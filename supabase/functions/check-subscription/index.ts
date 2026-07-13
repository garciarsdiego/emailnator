import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import type Stripe from "https://esm.sh/stripe@18.5.0";
import { requireUser } from "../_shared/auth.ts";
import { preflight } from "../_shared/cors.ts";
import { AppError } from "../_shared/errors.ts";
import { errorResponse, jsonResponse, readJson, requestId } from "../_shared/http.ts";
import { logInfo } from "../_shared/logger.ts";
import { enforceRateLimit } from "../_shared/rate-limit.ts";
import { stripeClient } from "../_shared/stripe-client.ts";
import { activeSubscriptionStatus } from "../_shared/stripe-catalog.ts";
import { subscriptionSnapshot, syncFreeAccount, syncSubscription } from "../_shared/subscriptions.ts";

serve(async (req) => {
  const optionsResponse = preflight(req);
  if (optionsResponse) return optionsResponse;
  const traceId = requestId(req);
  try {
    const auth = await requireUser(req);
    await enforceRateLimit({
      serviceClient: auth.serviceClient,
      userId: auth.user.id,
      action: "check_subscription",
      maxRequests: 12,
      windowSeconds: 300,
    });
    await readJson(req);
    const [{ data: profile, error: profileError }, { data: billing, error: billingError }] = await Promise.all([
      auth.serviceClient.from("profiles").select("plan, plan_source").eq("id", auth.user.id).single(),
      auth.serviceClient.from("billing_customers")
        .select("stripe_customer_id, stripe_subscription_id")
        .eq("user_id", auth.user.id)
        .maybeSingle(),
    ]);
    if (profileError || billingError) {
      throw new AppError("SUBSCRIPTION_LOOKUP_FAILED", 500, "Unable to load subscription", false);
    }

    if (profile.plan_source === "manual") {
      return jsonResponse(req, {
        subscribed: profile.plan !== "free",
        plan: profile.plan,
        source: "manual",
        subscription_end: null,
        is_trialing: false,
      });
    }

    let customerId = billing?.stripe_customer_id as string | null | undefined;
    let stripe: Stripe | null = null;
    let subscription: Stripe.Subscription | null = null;

    // One-time safe migration path for v1 subscribers: the old checkout stored
    // user_id on subscription metadata but did not persist the Stripe customer.
    // Email alone is never sufficient; metadata must match the authenticated user.
    if (!customerId && profile.plan_source === "legacy" && auth.user.email) {
      stripe = stripeClient();
      const customers = await stripe.customers.list({ email: auth.user.email, limit: 10 });
      for (const customer of customers.data) {
        const listed = await stripe.subscriptions.list({ customer: customer.id, status: "all", limit: 10 });
        const matched = listed.data.find((entry: Stripe.Subscription) =>
          entry.metadata?.user_id === auth.user.id && activeSubscriptionStatus(entry.status)
        );
        if (matched) {
          customerId = customer.id;
          subscription = matched;
          break;
        }
      }
    }

    if (!customerId) {
      await syncFreeAccount({
        serviceClient: auth.serviceClient,
        userId: auth.user.id,
        status: "inactive",
        sourceEventKey: `check:${traceId}`,
      });
      return jsonResponse(req, {
        subscribed: false,
        plan: "free",
        source: "stripe",
        subscription_end: null,
        is_trialing: false,
      });
    }

    stripe ??= stripeClient();
    const subscriptionId = billing?.stripe_subscription_id as string | null | undefined;
    if (!subscription && subscriptionId) {
      try {
        const retrieved = await stripe.subscriptions.retrieve(subscriptionId);
        if (!('deleted' in retrieved)) subscription = retrieved as Stripe.Subscription;
      } catch (error) {
        const status = typeof error === "object" && error && "statusCode" in error
          ? Number((error as { statusCode?: unknown }).statusCode)
          : 0;
        if (status !== 404) throw error;
      }
    }

    if (!subscription) {
      const listed = await stripe.subscriptions.list({ customer: customerId, status: "all", limit: 10 });
      subscription = listed.data.find((entry: Stripe.Subscription) => activeSubscriptionStatus(entry.status))
        ?? listed.data[0]
        ?? null;
    }

    if (!subscription || !activeSubscriptionStatus(subscription.status)) {
      await syncFreeAccount({
        serviceClient: auth.serviceClient,
        userId: auth.user.id,
        customerId,
        status: subscription?.status ?? "inactive",
        sourceEventKey: `check:${traceId}`,
      });
      return jsonResponse(req, {
        subscribed: false,
        plan: "free",
        source: "stripe",
        subscription_end: null,
        is_trialing: false,
      });
    }

    await syncSubscription({
      serviceClient: auth.serviceClient,
      userId: auth.user.id,
      subscription,
      resetCycle: profile.plan_source === "legacy",
      sourceEventKey: `check:${traceId}`,
    });
    const snapshot = subscriptionSnapshot(subscription);
    logInfo("subscription_checked", {
      requestId: traceId,
      userId: auth.user.id,
      subscriptionId: snapshot.subscriptionId,
      status: snapshot.status,
      plan: snapshot.plan,
    });
    return jsonResponse(req, {
      subscribed: activeSubscriptionStatus(snapshot.status),
      plan: snapshot.plan,
      source: "stripe",
      subscription_end: snapshot.currentPeriodEnd,
      is_trialing: snapshot.status === "trialing",
      cancel_at_period_end: snapshot.cancelAtPeriodEnd,
    });
  } catch (error) {
    return errorResponse(req, error, traceId);
  }
});
