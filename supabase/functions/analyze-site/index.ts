import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { callAiJson } from "../_shared/ai.ts";
import { requireUser } from "../_shared/auth.ts";
import {
  completeGeneration,
  idempotencyKey,
  markProcessing,
  refundGeneration,
  reserveCredits,
} from "../_shared/credits.ts";
import { preflight } from "../_shared/cors.ts";
import { AppError } from "../_shared/errors.ts";
import { errorResponse, jsonResponse, readJson, requestId } from "../_shared/http.ts";
import { logInfo, logWarn } from "../_shared/logger.ts";
import { enforceRateLimit } from "../_shared/rate-limit.ts";
import { parseSiteAnalysis, siteAnalysisPrompts } from "../_shared/prompts/site-analysis.ts";
import { fetchPublicText, validatePublicUrl } from "../_shared/url-security.ts";
import { objectValue, requiredString, type JsonObject } from "../_shared/validation.ts";

interface ExtractedSite {
  text: string;
  branding?: JsonObject;
}

function visibleText(html: string): string {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<svg\b[^>]*>[\s\S]*?<\/svg>/gi, " ")
    .replace(/<!--([\s\S]*?)-->/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 30_000);
}

async function firecrawlExtract(url: URL): Promise<ExtractedSite | null> {
  const key = Deno.env.get("FIRECRAWL_API_KEY")?.trim();
  if (!key) return null;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25_000);
  try {
    const response = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      signal: controller.signal,
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        url: url.toString(),
        formats: ["markdown", "branding"],
        onlyMainContent: true,
        timeout: 20_000,
      }),
    });
    if (!response.ok) return null;
    const raw = await response.text();
    if (new TextEncoder().encode(raw).byteLength > 1_500_000) return null;
    const payload = JSON.parse(raw) as {
      success?: boolean;
      data?: { markdown?: unknown; branding?: unknown };
    };
    if (!payload.success || typeof payload.data?.markdown !== "string") return null;
    const branding = payload.data.branding && typeof payload.data.branding === "object"
      && !Array.isArray(payload.data.branding)
      ? payload.data.branding as JsonObject
      : undefined;
    return { text: payload.data.markdown.slice(0, 30_000), branding };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function extractSite(url: URL, traceId: string): Promise<ExtractedSite> {
  const firecrawl = await firecrawlExtract(url);
  if (firecrawl) return firecrawl;
  logWarn("firecrawl_unavailable_using_safe_fetch", { requestId: traceId, host: url.hostname });
  const response = await fetchPublicText(url);
  return { text: visibleText(response.text) };
}

serve(async (req) => {
  const optionsResponse = preflight(req);
  if (optionsResponse) return optionsResponse;
  const traceId = requestId(req);
  let jobId: string | null = null;
  let userId: string | null = null;
  let serviceClient: Awaited<ReturnType<typeof requireUser>>["serviceClient"] | null = null;

  try {
    const auth = await requireUser(req);
    userId = auth.user.id;
    serviceClient = auth.serviceClient;
    await enforceRateLimit({ serviceClient, userId, action: "analyze_site", maxRequests: 5, windowSeconds: 300 });
    const body = objectValue(await readJson(req));
    const rawUrl = requiredString(body, "siteUrl", { max: 2000 });
    const url = await validatePublicUrl(rawUrl);
    const normalizedRequest = { siteUrl: url.toString() };

    const reservation = await reserveCredits({
      serviceClient,
      userId,
      jobType: "site_analysis",
      creditType: "analysis",
      amount: 1,
      idempotencyKey: idempotencyKey(req),
      requestBody: normalizedRequest,
    });
    jobId = reservation.job_id;
    if (reservation.status === "succeeded" && reservation.result) {
      return jsonResponse(req, reservation.result, 200, { "X-Generation-Job-Id": jobId });
    }

    await markProcessing(serviceClient, userId, jobId);
    const extracted = await extractSite(url, traceId);
    if (!extracted.text) {
      throw new AppError("SITE_CONTENT_EMPTY", 422, "Não foi possível extrair conteúdo textual do site");
    }

    const rawAnalysis = await callAiJson({
      ...siteAnalysisPrompts({ url: url.toString(), siteText: extracted.text, branding: extracted.branding }),
      temperature: 0.25,
    });
    const analysis = parseSiteAnalysis(rawAnalysis, url.toString());

    const { data: persisted, error: persistError } = await serviceClient
      .from("site_analyses")
      .insert({ user_id: userId, site_url: url.toString(), analysis_data: analysis })
      .select("id")
      .single();
    if (persistError || !persisted) {
      throw new AppError("ANALYSIS_PERSISTENCE_FAILED", 500, "Unable to save the site analysis", false);
    }

    const result = { ...analysis, analysisId: persisted.id };
    await completeGeneration(serviceClient, userId, jobId, result);
    logInfo("site_analysis_completed", { requestId: traceId, userId, jobId, analysisId: persisted.id });
    return jsonResponse(req, result, 200, { "X-Generation-Job-Id": jobId });
  } catch (error) {
    if (jobId && userId && serviceClient) {
      await refundGeneration(serviceClient, userId, jobId, error);
    }
    return errorResponse(req, error, traceId);
  }
});
