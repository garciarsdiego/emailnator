import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";
import type Stripe from "https://esm.sh/stripe@18.5.0";
import { AppError } from "./errors.ts";
import { activeSubscriptionStatus, catalogItemForPrice, type Plan } from "./stripe-catalog.ts";

type SubscriptionLike = Stripe.Subscription & Record<string, unknown>;

function id(value: unknown): string | null {
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && typeof (value as { id?: unknown }).id === "string") {
    return (value as { id: string }).id;
  }
  return null;
}

function unix(value: unknown): string | null {
  return typeof value === "number" && Number.isFinite(value)
    ? new Date(value * 1000).toISOString()
    : null;
}

export function subscriptionSnapshot(subscription: SubscriptionLike): {
  customerId: string;
  subscriptionId: string;
  priceId: string | null;
  productId: string | null;
  plan: Plan;
  status: string;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
} {
  const item = subscription.items?.data?.[0];
  const priceId = item?.price?.id ?? null;
  const productId = id(item?.price?.product);
  const catalog = catalogItemForPrice(priceId, productId);
  const status = subscription.status;
  if (activeSubscriptionStatus(status) && !catalog?.plan) {
    throw new AppError("STRIPE_CATALOG_MISMATCH", 500, "Active subscription price is not in the server catalog", false);
  }
  const plan = activeSubscriptionStatus(status) && catalog?.plan ? catalog.plan : "free";
  const extendedItem = item as unknown as Record<string, unknown> | undefined;
  const periodStart = (subscription as unknown as Record<string, unknown>).current_period_start
    ?? extendedItem?.current_period_start;
  const periodEnd = (subscription as unknown as Record<string, unknown>).current_period_end
    ?? extendedItem?.current_period_end;
  const customerId = id(subscription.customer);
  if (!customerId) throw new AppError("STRIPE_STATE_INVALID", 500, "Stripe customer is missing", false);

  return {
    customerId,
    subscriptionId: subscription.id,
    priceId,
    productId,
    plan,
    status,
    currentPeriodStart: unix(periodStart),
    currentPeriodEnd: unix(periodEnd),
    cancelAtPeriodEnd: Boolean(subscription.cancel_at_period_end),
  };
}

export async function syncSubscription(options: {
  serviceClient: SupabaseClient;
  userId: string;
  subscription: SubscriptionLike;
  resetCycle: boolean;
  sourceEventKey: string;
}): Promise<Record<string, unknown>> {
  const snapshot = subscriptionSnapshot(options.subscription);
  const { data, error } = await options.serviceClient.rpc("sync_subscription_state", {
    p_user_id: options.userId,
    p_plan: snapshot.plan,
    p_status: snapshot.status,
    p_stripe_customer_id: snapshot.customerId,
    p_stripe_subscription_id: snapshot.subscriptionId,
    p_stripe_price_id: snapshot.priceId,
    p_stripe_product_id: snapshot.productId,
    p_current_period_start: snapshot.currentPeriodStart,
    p_current_period_end: snapshot.currentPeriodEnd,
    p_cancel_at_period_end: snapshot.cancelAtPeriodEnd,
    p_reset_cycle: options.resetCycle,
    p_source_event_key: options.sourceEventKey,
  });
  if (error) {
    throw new AppError("SUBSCRIPTION_SYNC_FAILED", 500, "Unable to synchronize subscription", false, {
      databaseCode: error.code,
    });
  }
  return data as Record<string, unknown>;
}

export async function syncFreeAccount(options: {
  serviceClient: SupabaseClient;
  userId: string;
  customerId?: string | null;
  status?: string;
  sourceEventKey: string;
}): Promise<Record<string, unknown>> {
  const { data, error } = await options.serviceClient.rpc("sync_subscription_state", {
    p_user_id: options.userId,
    p_plan: "free",
    p_status: options.status ?? "inactive",
    p_stripe_customer_id: options.customerId ?? null,
    p_stripe_subscription_id: null,
    p_stripe_price_id: null,
    p_stripe_product_id: null,
    p_current_period_start: null,
    p_current_period_end: null,
    p_cancel_at_period_end: false,
    p_reset_cycle: false,
    p_source_event_key: options.sourceEventKey,
  });
  if (error) {
    throw new AppError("SUBSCRIPTION_SYNC_FAILED", 500, "Unable to synchronize subscription", false, {
      databaseCode: error.code,
    });
  }
  return data as Record<string, unknown>;
}
