import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";
import { AppError } from "./errors.ts";
import { sha256 } from "./hash.ts";

export type GenerationJobType =
  | "email_generation"
  | "funnel_generation"
  | "block_text_generation"
  | "site_analysis";

export type CreditType = "email" | "analysis";

interface Reservation {
  job_id: string;
  status: "reserved" | "processing" | "succeeded" | "failed";
  already_processed: boolean;
  result: unknown | null;
}

function rpcError(error: { message?: string; code?: string } | null): never {
  const message = error?.message ?? "Credit operation failed";
  if (message.includes("INSUFFICIENT_CREDITS")) {
    throw new AppError("INSUFFICIENT_CREDITS", 402, "Créditos insuficientes para esta operação");
  }
  if (message.includes("IDEMPOTENCY_CONFLICT")) {
    throw new AppError("IDEMPOTENCY_CONFLICT", 409, "This idempotency key was already used for another request");
  }
  throw new AppError("CREDIT_OPERATION_FAILED", 500, "Unable to reserve credits", false, {
    databaseCode: error?.code,
  });
}

export async function reserveCredits(options: {
  serviceClient: SupabaseClient;
  userId: string;
  jobType: GenerationJobType;
  creditType: CreditType;
  amount: number;
  idempotencyKey: string;
  requestBody: unknown;
}): Promise<Reservation> {
  const { error: staleError } = await options.serviceClient.rpc("refund_stale_generation_jobs", {
    p_user_id: options.userId,
    p_older_than_seconds: 900,
  });
  if (staleError) {
    throw new AppError("STALE_JOB_RECOVERY_FAILED", 500, "Unable to recover interrupted generations", false, {
      databaseCode: staleError.code,
    });
  }
  const fingerprint = await sha256(options.requestBody);
  const { data, error } = await options.serviceClient.rpc("reserve_generation_credits", {
    p_user_id: options.userId,
    p_job_type: options.jobType,
    p_credit_type: options.creditType,
    p_amount: options.amount,
    p_idempotency_key: options.idempotencyKey,
    p_request_fingerprint: fingerprint,
  });
  if (error || !data) rpcError(error);

  const reservation = data as Reservation;
  if (reservation.already_processed && reservation.status === "succeeded") {
    return reservation;
  }
  if (reservation.already_processed) {
    throw new AppError(
      "GENERATION_ALREADY_IN_PROGRESS",
      409,
      reservation.status === "failed"
        ? "This generation attempt already failed; use a new idempotency key"
        : "This generation is already in progress",
      true,
      { jobId: reservation.job_id, status: reservation.status },
    );
  }

  return reservation;
}

export async function markProcessing(
  serviceClient: SupabaseClient,
  userId: string,
  jobId: string,
): Promise<void> {
  const { error } = await serviceClient.rpc("mark_generation_job_processing", {
    p_user_id: userId,
    p_job_id: jobId,
  });
  if (error) rpcError(error);
}

export async function completeGeneration(
  serviceClient: SupabaseClient,
  userId: string,
  jobId: string,
  result: unknown,
): Promise<void> {
  const { error } = await serviceClient.rpc("complete_generation_job", {
    p_user_id: userId,
    p_job_id: jobId,
    p_result: result,
  });
  if (error) rpcError(error);
}

export async function refundGeneration(
  serviceClient: SupabaseClient,
  userId: string,
  jobId: string,
  error: unknown,
): Promise<void> {
  const code = error instanceof AppError ? error.code : "GENERATION_FAILED";
  const message = error instanceof Error ? error.message.slice(0, 500) : "Generation failed";
  const { error: rpcFailure } = await serviceClient.rpc("refund_generation_credits", {
    p_user_id: userId,
    p_job_id: jobId,
    p_error_code: code,
    p_error_message: message,
  });
  if (rpcFailure) {
    // Preserve the original failure. A structured log at the handler boundary will
    // still expose the refund problem without leaking it to the client.
    console.error(JSON.stringify({
      level: "error",
      event: "credit_refund_failed",
      jobId,
      databaseCode: rpcFailure.code,
    }));
  }
}

export function idempotencyKey(req: Request): string {
  const supplied = req.headers.get("idempotency-key")?.trim();
  if (supplied) {
    if (supplied.length > 200 || !/^[A-Za-z0-9._:-]+$/.test(supplied)) {
      throw new AppError("INVALID_IDEMPOTENCY_KEY", 400, "Idempotency-Key has an invalid format");
    }
    return supplied;
  }
  return `generated:${crypto.randomUUID()}`;
}
