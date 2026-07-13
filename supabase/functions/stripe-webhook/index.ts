import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createServiceClient } from "../_shared/auth.ts";
import { AppError } from "../_shared/errors.ts";
import { logError, logInfo } from "../_shared/logger.ts";
import { stripeClient } from "../_shared/stripe-client.ts";
import { processStripeEvent } from "../_shared/stripe-webhook-events.ts";
import { claimStripeEvent, finishStripeEvent } from "../_shared/stripe-webhook-store.ts";

function response(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
  });
}

serve(async (req) => {
  if (req.method !== "POST") return response({ error: "Method not allowed" }, 405);
  let event: Stripe.Event | null = null;
  let serviceClient: SupabaseClient | null = null;
  try {
    const signature = req.headers.get("stripe-signature");
    const secret = Deno.env.get("STRIPE_WEBHOOK_SECRET")?.trim();
    if (!signature || !secret) {
      throw new AppError("WEBHOOK_SIGNATURE_MISSING", 400, "Stripe signature is missing", false);
    }
    const stripe = stripeClient();
    const declaredLength = Number(req.headers.get("content-length") ?? 0);
    if (declaredLength > 1_000_000) {
      throw new AppError("WEBHOOK_TOO_LARGE", 413, "Stripe webhook payload is too large", false);
    }
    const rawBody = await req.text();
    if (new TextEncoder().encode(rawBody).byteLength > 1_000_000) {
      throw new AppError("WEBHOOK_TOO_LARGE", 413, "Stripe webhook payload is too large", false);
    }
    event = await stripe.webhooks.constructEventAsync(
      rawBody,
      signature,
      secret,
      undefined,
      Stripe.createSubtleCryptoProvider(),
    );

    serviceClient = createServiceClient();
    const claim = await claimStripeEvent(serviceClient, event);
    if (claim === "duplicate") return response({ received: true, duplicate: true });
    if (claim === "busy") return response({ received: false, processing: true }, 409);

    const processed = await processStripeEvent(event, serviceClient, stripe);
    await finishStripeEvent(serviceClient, event.id, processed ? "processed" : "ignored");
    logInfo("stripe_webhook_processed", { eventId: event.id, eventType: event.type, processed });
    return response({ received: true });
  } catch (error) {
    if (event && serviceClient) {
      try {
        await finishStripeEvent(serviceClient, event.id, "failed", error);
      } catch (auditError) {
        logError("stripe_webhook_audit_failed", auditError, { eventId: event.id, eventType: event.type });
      }
    }
    logError("stripe_webhook_failed", error, { eventId: event?.id, eventType: event?.type });
    return response({ error: "Webhook processing failed" }, error instanceof AppError ? error.status : 500);
  }
});
