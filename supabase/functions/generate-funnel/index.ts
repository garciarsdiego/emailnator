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
import { errorResponse, jsonResponse, readJson, requestId } from "../_shared/http.ts";
import { logInfo } from "../_shared/logger.ts";
import { enforceRateLimit } from "../_shared/rate-limit.ts";
import {
  funnelPrompts,
  parseGeneratedFunnel,
  type FunnelGenerationInput,
} from "../_shared/prompts/funnel.ts";
import { objectValue, optionalObject, optionalString, requiredString } from "../_shared/validation.ts";

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
    await enforceRateLimit({ serviceClient, userId, action: "generate_funnel", maxRequests: 3, windowSeconds: 300 });
    const rawBody = await readJson(req);
    const body = objectValue(rawBody);
    const siteAnalysis = optionalObject(body, "siteAnalysis", 50_000);
    const input: FunnelGenerationInput = {
      niche: requiredString(body, "niche", { max: 100 }),
      tone: requiredString(body, "tone", { max: 100 }),
      productDescription: requiredString(body, "productDescription", { max: 5000 }),
      siteUrl: optionalString(body, "siteUrl", 2000),
      siteAnalysis,
      language: optionalString(body, "language", 20)
        || (typeof siteAnalysis?.language === "string" ? siteAnalysis.language.slice(0, 20) : "pt-BR"),
    };

    const reservation = await reserveCredits({
      serviceClient,
      userId,
      jobType: "funnel_generation",
      creditType: "email",
      amount: 5,
      idempotencyKey: idempotencyKey(req),
      requestBody: input,
    });
    jobId = reservation.job_id;
    if (reservation.status === "succeeded" && reservation.result) {
      return jsonResponse(req, reservation.result, 200, { "X-Generation-Job-Id": jobId });
    }

    await markProcessing(serviceClient, userId, jobId);
    const prompts = funnelPrompts(input);
    const rawResult = await callAiJson({ ...prompts, temperature: 0.7 });
    const result = parseGeneratedFunnel(rawResult);
    await completeGeneration(serviceClient, userId, jobId, result);
    logInfo("funnel_generation_completed", { requestId: traceId, userId, jobId });
    return jsonResponse(req, result, 200, { "X-Generation-Job-Id": jobId });
  } catch (error) {
    if (jobId && userId && serviceClient) {
      await refundGeneration(serviceClient, userId, jobId, error);
    }
    return errorResponse(req, error, traceId);
  }
});
