import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import type Stripe from "https://esm.sh/stripe@18.5.0";
import { requireUser } from "../_shared/auth.ts";
import { appOrigin, preflight } from "../_shared/cors.ts";
import { idempotencyKey } from "../_shared/credits.ts";
import { AppError } from "../_shared/errors.ts";
import { errorResponse, jsonResponse, readJson, requestId } from "../_shared/http.ts";
import { logInfo } from "../_shared/logger.ts";
import { enforceRateLimit } from "../_shared/rate-limit.ts";
import { checkoutItem } from "../_shared/stripe-catalog.ts";
import { stripeClient } from "../_shared/stripe-client.ts";

serve(async (req) => {
  const optionsResponse = preflight(req);
  if (optionsResponse) return optionsResponse;
  const traceId = requestId(req);

  try {
    const auth = await requireUser(req);
    await enforceRateLimit({
      serviceClient: auth.serviceClient,
      userId: auth.user.id,
      action: "create_checkout",
      maxRequests: 10,
      windowSeconds: 600,
    });
    const item = checkoutItem(await readJson(req));
    const stripe = stripeClient();
    const { data: billing, error: billingError } = await auth.serviceClient
      .from("billing_customers")
      .select("stripe_customer_id, status")
      .eq("user_id", auth.user.id)
      .maybeSingle();
    if (billingError) throw new AppError("BILLING_LOOKUP_FAILED", 500, "Unable to load billing account", false);

    let customerId = billing?.status === "customer_deleted"
      ? null
      : billing?.stripe_customer_id as string | null | undefined;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: auth.user.email,
        name: typeof auth.user.user_metadata?.full_name === "string"
          ? auth.user.user_metadata.full_name.slice(0, 160)
          : undefined,
        metadata: { user_id: auth.user.id },
      }, { idempotencyKey: `email-muse:customer:${auth.user.id}` });
      customerId = customer.id;
      const { error } = await auth.serviceClient.from("billing_customers").upsert({
        user_id: auth.user.id,
        stripe_customer_id: customerId,
        status: "inactive",
        plan: "free",
      }, { onConflict: "user_id" });
      if (error) throw new AppError("BILLING_ACCOUNT_SAVE_FAILED", 500, "Unable to save billing account", false);
    }

    const origin = appOrigin(req);
    const metadata: Record<string, string> = {
      user_id: auth.user.id,
      catalog_key: item.key,
      checkout_mode: item.mode,
      price_id: item.priceId,
      ...(item.plan ? { plan: item.plan } : {}),
      ...(item.emailCredits ? { email_credits: String(item.emailCredits) } : {}),
    };
    const session: Stripe.Checkout.SessionCreateParams = {
      customer: customerId,
      client_reference_id: auth.user.id,
      line_items: [{ price: item.priceId, quantity: 1 }],
      mode: item.mode,
      success_url: `${origin}/dashboard?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/pricing?payment=canceled`,
      metadata,
      allow_promotion_codes: false,
    };

    if (item.mode === "subscription") {
      const configuredTrial = Number(Deno.env.get("STRIPE_TRIAL_DAYS") ?? 7);
      session.subscription_data = {
        ...(Number.isInteger(configuredTrial) && configuredTrial > 0
          ? { trial_period_days: Math.min(configuredTrial, 30) }
          : {}),
        metadata,
      };
    } else {
      session.payment_intent_data = { metadata };
    }

    const requestKey = idempotencyKey(req);
    const checkout = await stripe.checkout.sessions.create(session, {
      idempotencyKey: `email-muse:checkout:${auth.user.id}:${item.key}:${requestKey}`.slice(0, 255),
    });
    if (!checkout.url) throw new AppError("CHECKOUT_URL_MISSING", 502, "Stripe did not return a checkout URL", false);
    logInfo("checkout_created", {
      requestId: traceId,
      userId: auth.user.id,
      catalogKey: item.key,
      sessionId: checkout.id,
    });
    return jsonResponse(req, { url: checkout.url, sessionId: checkout.id });
  } catch (error) {
    return errorResponse(req, error, traceId);
  }
});
