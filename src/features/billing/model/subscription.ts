export type SubscriptionPlan = "free" | "starter" | "pro" | "enterprise";

export interface SubscriptionInfo {
  subscribed: boolean;
  plan: SubscriptionPlan;
  subscriptionEnd: string | null;
  isTrialing: boolean;
}

export const FREE_SUBSCRIPTION: SubscriptionInfo = {
  subscribed: false,
  plan: "free",
  subscriptionEnd: null,
  isTrialing: false,
};

const PLANS: SubscriptionPlan[] = ["free", "starter", "pro", "enterprise"];

export function normalizeSubscription(value: unknown): SubscriptionInfo {
  if (!value || typeof value !== "object") return FREE_SUBSCRIPTION;

  const input = value as Record<string, unknown>;
  const plan = PLANS.includes(input.plan as SubscriptionPlan)
    ? (input.plan as SubscriptionPlan)
    : "free";

  return {
    subscribed: input.subscribed === true,
    plan,
    subscriptionEnd:
      typeof input.subscription_end === "string" ? input.subscription_end : null,
    isTrialing: input.is_trialing === true,
  };
}
