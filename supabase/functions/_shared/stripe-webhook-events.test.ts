import { afterEach, describe, expect, it } from "vitest";
import { processStripeEvent } from "./stripe-webhook-events.ts";
import { stripeCatalog } from "./stripe-catalog.ts";
import { chainable, createMockServiceClient, ok, stubDenoEnv } from "./test-support.ts";

const USER_ID = "11111111-1111-4111-8111-111111111111";
const CUSTOMER_ID = "cus_1";

afterEach(() => {
  delete (globalThis as { Deno?: unknown }).Deno;
});

function proPrice() {
  stubDenoEnv({});
  return stripeCatalog().find((item) => item.key === "pro")!;
}

function subscription(overrides: Record<string, unknown> = {}) {
  const price = proPrice();
  return {
    id: "sub_1",
    status: "active",
    customer: CUSTOMER_ID,
    cancel_at_period_end: false,
    current_period_start: 1700000000,
    current_period_end: 1702592000,
    created: 1700000000,
    metadata: {},
    items: { data: [{ price: { id: price.priceId, product: price.productId } }] },
    ...overrides,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;
}

function serviceClientWithMapping(rpcCalls: Record<string, unknown>[]) {
  return createMockServiceClient({
    from: (table) => {
      if (table === "billing_customers") return chainable(ok({ user_id: USER_ID }));
      throw new Error(`unexpected table ${table}`);
    },
    rpc: async (fn, args) => {
      rpcCalls.push({ fn, ...args });
      return ok(null);
    },
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function event(type: string, object: Record<string, unknown>): any {
  return { id: `evt_${type}`, type, data: { object } };
}

describe("processStripeEvent - checkout completion", () => {
  it("grants purchased credits for a paid one-time checkout", async () => {
    stubDenoEnv({});
    const pack = stripeCatalog().find((i) => i.key === "pack10")!;
    const rpcCalls: Record<string, unknown>[] = [];
    const serviceClient = serviceClientWithMapping(rpcCalls);
    const handled = await processStripeEvent(
      event("checkout.session.completed", {
        id: "cs_1",
        customer: CUSTOMER_ID,
        mode: "payment",
        payment_status: "paid",
        metadata: { price_id: pack.priceId },
      }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      serviceClient as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      {} as any,
    );
    expect(handled).toBe(true);
    expect(rpcCalls.some((c) => c.fn === "apply_credit_adjustment" && c.p_amount === 10)).toBe(true);
  });

  it("does not grant credits for an unpaid one-time checkout", async () => {
    stubDenoEnv({});
    const pack = stripeCatalog().find((i) => i.key === "pack10")!;
    const rpcCalls: Record<string, unknown>[] = [];
    const serviceClient = serviceClientWithMapping(rpcCalls);
    await processStripeEvent(
      event("checkout.session.completed", {
        id: "cs_2",
        customer: CUSTOMER_ID,
        mode: "payment",
        payment_status: "unpaid",
        metadata: { price_id: pack.priceId },
      }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      serviceClient as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      {} as any,
    );
    expect(rpcCalls.some((c) => c.fn === "apply_credit_adjustment")).toBe(false);
  });

  it("syncs the subscription for a subscription-mode checkout", async () => {
    const sub = subscription();
    const rpcCalls: Record<string, unknown>[] = [];
    const serviceClient = serviceClientWithMapping(rpcCalls);
    const stripe = { subscriptions: { retrieve: async () => sub } };
    await processStripeEvent(
      event("checkout.session.completed", {
        id: "cs_3",
        customer: CUSTOMER_ID,
        mode: "subscription",
        subscription: sub.id,
      }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      serviceClient as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      stripe as any,
    );
    const syncCall = rpcCalls.find((c) => c.fn === "sync_subscription_state");
    expect(syncCall?.p_plan).toBe("pro");
  });

  it("returns false for an event type it does not handle", async () => {
    const serviceClient = createMockServiceClient({});
    const handled = await processStripeEvent(
      event("payment_intent.created", { id: "pi_1" }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      serviceClient as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      {} as any,
    );
    expect(handled).toBe(false);
  });
});

describe("processStripeEvent - subscription lifecycle", () => {
  it("never downgrades a user to free when a newer active subscription already exists", async () => {
    // Regression test: an out-of-order `customer.subscription.deleted` webhook
    // for an OLD subscription must not clobber the user's still-active new plan.
    const oldSub = subscription({ id: "sub_old", status: "canceled", created: 1690000000 });
    const newSub = subscription({ id: "sub_new", status: "active", created: 1700000000 });
    const rpcCalls: Record<string, unknown>[] = [];
    const serviceClient = serviceClientWithMapping(rpcCalls);
    const stripe = {
      subscriptions: {
        list: async () => ({ data: [oldSub, newSub] }),
      },
    };
    await processStripeEvent(
      event("customer.subscription.deleted", oldSub),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      serviceClient as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      stripe as any,
    );
    const syncCall = rpcCalls.find((c) => c.fn === "sync_subscription_state");
    expect(syncCall?.p_stripe_subscription_id).toBe("sub_new");
    expect(syncCall?.p_plan).toBe("pro");
  });

  it("syncs the free plan once the customer has no active subscriptions left", async () => {
    const canceled = subscription({ id: "sub_1", status: "canceled" });
    const rpcCalls: Record<string, unknown>[] = [];
    const serviceClient = serviceClientWithMapping(rpcCalls);
    const stripe = { subscriptions: { list: async () => ({ data: [canceled] }) } };
    await processStripeEvent(
      event("customer.subscription.deleted", canceled),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      serviceClient as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      stripe as any,
    );
    const syncCall = rpcCalls.find((c) => c.fn === "sync_subscription_state");
    expect(syncCall?.p_plan).toBe("free");
  });

  it("picks the most recently created active subscription when several exist", async () => {
    const older = subscription({ id: "sub_a", status: "active", created: 1690000000 });
    const newer = subscription({ id: "sub_b", status: "active", created: 1700000000 });
    const rpcCalls: Record<string, unknown>[] = [];
    const serviceClient = serviceClientWithMapping(rpcCalls);
    const stripe = { subscriptions: { list: async () => ({ data: [older, newer] }) } };
    await processStripeEvent(
      event("customer.subscription.updated", older),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      serviceClient as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      stripe as any,
    );
    const syncCall = rpcCalls.find((c) => c.fn === "sync_subscription_state");
    expect(syncCall?.p_stripe_subscription_id).toBe("sub_b");
  });

  it("throws rather than silently reconciling when a subscription event carries no customer", async () => {
    // customerId is null, so userForStripeCustomer throws WEBHOOK_USER_NOT_FOUND
    // before the dedicated "missing customer" check is even reached — there is
    // nothing to reconcile without a resolvable user either way.
    const sub = subscription({ customer: null });
    const rpcCalls: Record<string, unknown>[] = [];
    const serviceClient = createMockServiceClient({
      from: () => chainable(ok(null)),
      rpc: async (fn, args) => {
        rpcCalls.push({ fn, ...args });
        return ok(null);
      },
    });
    await expect(
      processStripeEvent(
        event("customer.subscription.updated", sub),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        serviceClient as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        {} as any,
      ),
    ).rejects.toThrow();
  });
});

describe("processStripeEvent - refunds and disputes", () => {
  it("reverses purchased credits on refund.created", async () => {
    const pack = (() => {
      stubDenoEnv({});
      return stripeCatalog().find((i) => i.key === "pack10")!;
    })();
    const rpcCalls: Record<string, unknown>[] = [];
    const serviceClient = createMockServiceClient({
      from: () => chainable(ok({ user_id: USER_ID })),
      rpc: async (fn, args) => {
        rpcCalls.push({ fn, ...args });
        return ok(null);
      },
    });
    const stripe = {
      paymentIntents: {
        retrieve: async () => ({
          id: "pi_1",
          customer: CUSTOMER_ID,
          amount: 1000,
          amount_received: 1000,
          metadata: { price_id: pack.priceId },
        }),
      },
    };
    await processStripeEvent(
      event("refund.created", { id: "re_1", payment_intent: "pi_1", amount: 1000 }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      serviceClient as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      stripe as any,
    );
    expect(rpcCalls.some((c) => c.fn === "apply_credit_adjustment" && c.p_amount === -10)).toBe(true);
  });

  it("restores credits only when a dispute is closed as won", async () => {
    const rpcCalls: Record<string, unknown>[] = [];
    const serviceClient = createMockServiceClient({
      from: (table) => {
        if (table === "billing_customers") return chainable(ok({ user_id: USER_ID }));
        if (table === "credit_ledger") return chainable(ok(null));
        throw new Error(`unexpected table ${table}`);
      },
      rpc: async (fn, args) => {
        rpcCalls.push({ fn, ...args });
        return ok(null);
      },
    });
    const stripe = {
      charges: { retrieve: async () => ({ id: "ch_1", payment_intent: "pi_1" }) },
    };
    const lostHandled = await processStripeEvent(
      event("charge.dispute.closed", { id: "dp_1", status: "lost", charge: "ch_1" }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      serviceClient as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      stripe as any,
    );
    expect(lostHandled).toBe(true);
    expect(rpcCalls).toHaveLength(0);
  });
});
