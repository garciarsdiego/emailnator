import { afterEach, describe, expect, it } from "vitest";
import { subscriptionSnapshot, syncFreeAccount, syncSubscription } from "./subscriptions.ts";
import { stripeCatalog } from "./stripe-catalog.ts";
import { createMockServiceClient, ok, stubDenoEnv } from "./test-support.ts";

afterEach(() => {
  delete (globalThis as { Deno?: unknown }).Deno;
});

function baseSubscription(overrides: Record<string, unknown> = {}) {
  stubDenoEnv({});
  const priceId = stripeCatalog()[1].priceId; // "pro"
  return {
    id: "sub_123",
    status: "active",
    customer: "cus_123",
    cancel_at_period_end: false,
    current_period_start: 1700000000,
    current_period_end: 1702592000,
    items: { data: [{ price: { id: priceId, product: "prod_pro" } }] },
    ...overrides,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;
}

describe("subscriptionSnapshot", () => {
  it("maps an active subscription to its catalog plan", () => {
    const snapshot = subscriptionSnapshot(baseSubscription());
    expect(snapshot.plan).toBe("pro");
    expect(snapshot.status).toBe("active");
    expect(snapshot.customerId).toBe("cus_123");
    expect(snapshot.currentPeriodStart).toBe(new Date(1700000000 * 1000).toISOString());
    expect(snapshot.currentPeriodEnd).toBe(new Date(1702592000 * 1000).toISOString());
  });

  it("downgrades to free when the status is not active/trialing, even with a known price", () => {
    const snapshot = subscriptionSnapshot(baseSubscription({ status: "canceled" }));
    expect(snapshot.plan).toBe("free");
  });

  it("throws STRIPE_CATALOG_MISMATCH for an active subscription on an unknown price", () => {
    const sub = baseSubscription({
      items: { data: [{ price: { id: "price_unknown", product: "prod_unknown" } }] },
    });
    expect(() => subscriptionSnapshot(sub)).toThrow(/not in the server catalog/);
  });

  it("throws STRIPE_STATE_INVALID when the customer is missing", () => {
    expect(() => subscriptionSnapshot(baseSubscription({ customer: null }))).toThrow(/customer is missing/);
  });

  it("reads customer id off an expanded customer object", () => {
    const snapshot = subscriptionSnapshot(baseSubscription({ customer: { id: "cus_expanded" } }));
    expect(snapshot.customerId).toBe("cus_expanded");
  });

  it("reflects cancel_at_period_end", () => {
    const snapshot = subscriptionSnapshot(baseSubscription({ cancel_at_period_end: true }));
    expect(snapshot.cancelAtPeriodEnd).toBe(true);
  });
});

describe("syncSubscription / syncFreeAccount", () => {
  it("forwards the derived snapshot to sync_subscription_state", async () => {
    const calls: Record<string, unknown>[] = [];
    const serviceClient = createMockServiceClient({
      rpc: async (fn, args) => {
        calls.push({ fn, ...args });
        return ok({ plan: args.p_plan });
      },
    });
    const result = await syncSubscription({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      serviceClient: serviceClient as any,
      userId: "user-1",
      subscription: baseSubscription(),
      resetCycle: true,
      sourceEventKey: "evt_1",
    });
    expect(calls[0].fn).toBe("sync_subscription_state");
    expect(calls[0].p_plan).toBe("pro");
    expect(calls[0].p_reset_cycle).toBe(true);
    expect(result).toEqual({ plan: "pro" });
  });

  it("syncFreeAccount always syncs the free plan with a null subscription id", async () => {
    const calls: Record<string, unknown>[] = [];
    const serviceClient = createMockServiceClient({
      rpc: async (fn, args) => {
        calls.push({ fn, ...args });
        return ok({});
      },
    });
    await syncFreeAccount({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      serviceClient: serviceClient as any,
      userId: "user-1",
      customerId: "cus_1",
      sourceEventKey: "evt_2",
    });
    expect(calls[0].p_plan).toBe("free");
    expect(calls[0].p_stripe_subscription_id).toBeNull();
    expect(calls[0].p_status).toBe("inactive");
  });
});
