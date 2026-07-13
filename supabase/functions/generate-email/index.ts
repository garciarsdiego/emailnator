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
  emailPrompts,
  parseGeneratedEmail,
  type EmailGenerationInput,
} from "../_shared/prompts/email.ts";
import {
  objectValue,
  optionalObject,
  optionalString,
  requiredString,
} from "../_shared/validation.ts";

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
    await enforceRateLimit({ serviceClient, userId, action: "generate_email", maxRequests: 10, windowSeconds: 60 });
    const rawBody = await readJson(req);
    const body = objectValue(rawBody);
    const siteAnalysis = optionalObject(body, "siteAnalysis", 50_000);
    const language = optionalString(body, "language", 20)
      || (typeof siteAnalysis?.language === "string" ? siteAnalysis.language.slice(0, 20) : "pt-BR");

    const input: EmailGenerationInput = {
      niche: requiredString(body, "niche", { max: 100 }),
      campaignType: requiredString(body, "campaignType", { max: 100 }),
      tone: requiredString(body, "tone", { max: 100 }),
      targetAudience: requiredString(body, "targetAudience", { max: 2000 }),
      siteUrl: optionalString(body, "siteUrl", 2000),
      siteAnalysis,
      contentReference: optionalObject(body, "contentReference", 10_000),
      customOffer: optionalString(body, "customOffer", 3000),
      language,
      additionalContext: optionalString(body, "additionalContext", 3000),
    };

    const reservation = await reserveCredits({
      serviceClient,
      userId,
      jobType: "email_generation",
      creditType: "email",
      amount: 1,
      idempotencyKey: idempotencyKey(req),
      requestBody: input,
    });
    jobId = reservation.job_id;
    if (reservation.status === "succeeded" && reservation.result) {
      return jsonResponse(req, reservation.result, 200, { "X-Generation-Job-Id": jobId });
    }

    await markProcessing(serviceClient, userId, jobId);
    const prompts = emailPrompts(input);
    const rawResult = await callAiJson({ ...prompts, temperature: 0.8 });
    const result = parseGeneratedEmail(rawResult, input);
    await completeGeneration(serviceClient, userId, jobId, result);
    logInfo("email_generation_completed", { requestId: traceId, userId, jobId });
    return jsonResponse(req, result, 200, { "X-Generation-Job-Id": jobId });
  } catch (error) {
    if (jobId && userId && serviceClient) {
      await refundGeneration(serviceClient, userId, jobId, error);
    }
    return errorResponse(req, error, traceId);
  }
});
