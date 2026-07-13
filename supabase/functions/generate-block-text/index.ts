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
import { blockPrompts, parseBlockText, type BlockTextInput } from "../_shared/prompts/block.ts";
import { objectValue, optionalString, requiredString } from "../_shared/validation.ts";

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
    await enforceRateLimit({ serviceClient, userId, action: "generate_block_text", maxRequests: 20, windowSeconds: 60 });
    const body = objectValue(await readJson(req));
    const input: BlockTextInput = {
      textType: requiredString(body, "textType", { max: 100 }),
      context: optionalString(body, "context", 3000),
      tone: requiredString(body, "tone", { max: 100 }),
      blockType: requiredString(body, "blockType", { max: 100 }),
      currentText: optionalString(body, "currentText", 5000),
      language: optionalString(body, "language", 20) || "pt-BR",
    };

    const reservation = await reserveCredits({
      serviceClient,
      userId,
      jobType: "block_text_generation",
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
    const rawResult = await callAiJson({ ...blockPrompts(input), temperature: 0.65 });
    const result = parseBlockText(rawResult);
    await completeGeneration(serviceClient, userId, jobId, result);
    logInfo("block_text_generation_completed", { requestId: traceId, userId, jobId });
    return jsonResponse(req, result, 200, { "X-Generation-Job-Id": jobId });
  } catch (error) {
    if (jobId && userId && serviceClient) {
      await refundGeneration(serviceClient, userId, jobId, error);
    }
    return errorResponse(req, error, traceId);
  }
});
