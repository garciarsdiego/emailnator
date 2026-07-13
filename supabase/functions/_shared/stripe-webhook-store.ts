import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";
import type Stripe from "https://esm.sh/stripe@18.5.0";
import { AppError } from "./errors.ts";

export async function claimStripeEvent(
  serviceClient: SupabaseClient,
  event: Stripe.Event,
): Promise<"claimed" | "duplicate" | "busy"> {
  const payload = {
    id: event.id,
    type: event.type,
    created: event.created,
    livemode: event.livemode,
    object_id: (event.data.object as { id?: string }).id ?? null,
  };
  const { error } = await serviceClient.from("stripe_events").insert({
    event_id: event.id,
    event_type: event.type,
    processing_status: "processing",
    payload,
  });
  if (!error) return "claimed";
  if (error.code !== "23505") {
    throw new AppError("WEBHOOK_AUDIT_FAILED", 500, "Unable to record Stripe event", false);
  }

  const { data: existing, error: lookupError } = await serviceClient
    .from("stripe_events")
    .select("processing_status, updated_at")
    .eq("event_id", event.id)
    .single();
  if (lookupError) throw new AppError("WEBHOOK_AUDIT_FAILED", 500, "Unable to read Stripe event", false);
  if (["processed", "ignored"].includes(existing.processing_status)) return "duplicate";

  const stale = Date.now() - new Date(existing.updated_at).getTime() > 5 * 60 * 1000;
  if (existing.processing_status === "processing" && !stale) return "busy";
  const { error: updateError } = await serviceClient.from("stripe_events").update({
    processing_status: "processing",
    error_message: null,
  }).eq("event_id", event.id);
  if (updateError) throw new AppError("WEBHOOK_AUDIT_FAILED", 500, "Unable to retry Stripe event", false);
  return "claimed";
}

export async function finishStripeEvent(
  serviceClient: SupabaseClient,
  eventId: string,
  status: "processed" | "ignored" | "failed",
  error?: unknown,
): Promise<void> {
  const { error: updateError } = await serviceClient.from("stripe_events").update({
    processing_status: status,
    processed_at: status === "failed" ? null : new Date().toISOString(),
    error_message: error instanceof Error ? error.message.slice(0, 500) : null,
  }).eq("event_id", eventId);
  if (updateError) {
    throw new AppError("WEBHOOK_AUDIT_FAILED", 500, "Unable to finalize Stripe event", false);
  }
}
