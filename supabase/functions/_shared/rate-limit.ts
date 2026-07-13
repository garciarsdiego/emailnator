import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";
import { AppError } from "./errors.ts";

export async function enforceRateLimit(options: {
  serviceClient: SupabaseClient;
  userId: string;
  action: string;
  maxRequests: number;
  windowSeconds: number;
}): Promise<void> {
  const { error } = await options.serviceClient.rpc("enforce_api_rate_limit", {
    p_user_id: options.userId,
    p_action: options.action,
    p_max_requests: options.maxRequests,
    p_window_seconds: options.windowSeconds,
  });
  if (!error) return;
  if (error.message.includes("RATE_LIMIT_EXCEEDED")) {
    let retryAfter = options.windowSeconds;
    const match = error.details?.match(/"retry_after_seconds"\s*:\s*(\d+)/);
    if (match) retryAfter = Number(match[1]);
    throw new AppError(
      "RATE_LIMIT_EXCEEDED",
      429,
      "Muitas solicitações em pouco tempo. Aguarde e tente novamente.",
      true,
      { retryAfterSeconds: retryAfter },
    );
  }
  throw new AppError("RATE_LIMIT_CHECK_FAILED", 500, "Unable to validate request rate", false, {
    databaseCode: error.code,
  });
}
