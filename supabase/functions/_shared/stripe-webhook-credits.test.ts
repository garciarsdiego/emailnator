import { afterEach, describe, expect, it } from "vitest";
import { applyPurchasedPack, restoreReversedPack, reversePurchasedPack } from "./stripe-webhook-credits.ts";
import { stripeCatalog } from "./stripe-catalog.ts";
import { chainable, createMockServiceClient, ok, stubDenoEnv } from "./test-support.ts";

const USER_ID = "11111111-1111-4111-8111-111111111111";

afterEach(() => {
  delete (globalThis as { Deno?: unknown }).Deno;
});

function pack10() {
  stubDenoEnv({});
  return stripeCatalog().find((item) => item.key === "pack10")!;
}

describe("applyPurchasedPack", () => {
  it("grants the catalog's credit amount for a one-time pack", async () => {
    const item = pack10();
    const calls: Record<string, unknown>[] = [];
    const serviceClient = createMockServiceClient({
      rpc: async (fn, args) => {
        calls.push({ fn, ...args });
        return ok(null);
      },
    });
    await applyPurchasedPack(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      serviceClient as any,
      USER_ID,
      item.priceId,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      { id: "evt_1" } as any,
    );
    expect(calls[0].fn).toBe("apply_credit_adjustment");
    expect(calls[0].p_amount).toBe(10);
    expect(calls[0].p_idempotency_key).toBe("stripe:evt_1:pack");
  });

  it("throws WEBHOOK_CATALOG_MISMATCH for a subscription price or unknown price", async () => {
    stubDenoEnv({});
    const subscriptionPrice = stripeCatalog().find((i) => i.key === "starter")!.priceId;
    const serviceClient = createMockServiceClient({ rpc: async () => ok(null) });
    await expect(
      applyPurchasedPack(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        serviceClient as any,
        USER_ID,
        subscriptionPrice,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        { id: "evt_2" } as any,
      ),
    ).rejects.toMatchObject({ code: "WEBHOOK_CATALOG_MISMATCH" });
  });
});

function stripeWithIntent(intent: Record<string, unknown>) {
  return {
    paymentIntents: {
      retrieve: async () => intent,
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;
}

describe("reversePurchasedPack", () => {
  it("reverses the full credit amount for a full refund", async () => {
    const item = pack10();
    const calls: Record<string, unknown>[] = [];
    const serviceClient = createMockServiceClient({
      from: () => chainable(ok({ user_id: USER_ID })),
      rpc: async (fn, args) => {
        calls.push({ fn, ...args });
        return ok(null);
      },
    });
    const intent = {
      id: "pi_1",
      customer: "cus_1",
      amount: 1000,
      amount_received: 1000,
      metadata: { price_id: item.priceId },
    };
    await reversePurchasedPack({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      serviceClient: serviceClient as any,
      stripe: stripeWithIntent(intent),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      event: { id: "evt_refund" } as any,
      paymentIntentId: "pi_1",
      reversalAmount: 1000,
      reason: "purchase_refund",
      stripeObjectId: "re_1",
    });
    expect(calls[0].p_amount).toBe(-10);
  });

  it("documents the known rounding limitation for a partial refund", async () => {
    // pack10 = 10 credits for a 1000-cent charge. A 333-cent partial refund is
    // 33.3% of the charge; Math.round(10 * 0.333) = 3 credits reversed, which
    // is a slight under-reversal relative to the exact 3.33 credits owed. This
    // pins the currently accepted behavior (see docs/security-v2.md).
    const item = pack10();
    const calls: Record<string, unknown>[] = [];
    const serviceClient = createMockServiceClient({
      from: () => chainable(ok({ user_id: USER_ID })),
      rpc: async (fn, args) => {
        calls.push({ fn, ...args });
        return ok(null);
      },
    });
    const intent = {
      id: "pi_2",
      customer: "cus_1",
      amount: 1000,
      amount_received: 1000,
      metadata: { price_id: item.priceId },
    };
    await reversePurchasedPack({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      serviceClient: serviceClient as any,
      stripe: stripeWithIntent(intent),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      event: { id: "evt_partial" } as any,
      paymentIntentId: "pi_2",
      reversalAmount: 333,
      reason: "purchase_refund",
      stripeObjectId: "re_2",
    });
    expect(calls[0].p_amount).toBe(-3);
  });

  it("never reverses more credits than the pack originally granted", async () => {
    const item = pack10();
    const calls: Record<string, unknown>[] = [];
    const serviceClient = createMockServiceClient({
      from: () => chainable(ok({ user_id: USER_ID })),
      rpc: async (fn, args) => {
        calls.push({ fn, ...args });
        return ok(null);
      },
    });
    const intent = {
      id: "pi_3",
      customer: "cus_1",
      amount: 1000,
      amount_received: 1000,
      metadata: { price_id: item.priceId },
    };
    // reversalAmount larger than the charge should still cap at item.emailCredits
    await reversePurchasedPack({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      serviceClient: serviceClient as any,
      stripe: stripeWithIntent(intent),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      event: { id: "evt_over" } as any,
      paymentIntentId: "pi_3",
      reversalAmount: 5000,
      reason: "chargeback",
      stripeObjectId: "dp_1",
    });
    expect(calls[0].p_amount).toBe(-10);
  });

  it("reverses at least 1 credit even for a tiny partial refund", async () => {
    const item = pack10();
    const calls: Record<string, unknown>[] = [];
    const serviceClient = createMockServiceClient({
      from: () => chainable(ok({ user_id: USER_ID })),
      rpc: async (fn, args) => {
        calls.push({ fn, ...args });
        return ok(null);
      },
    });
    const intent = {
      id: "pi_4",
      customer: "cus_1",
      amount: 1000,
      amount_received: 1000,
      metadata: { price_id: item.priceId },
    };
    await reversePurchasedPack({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      serviceClient: serviceClient as any,
      stripe: stripeWithIntent(intent),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      event: { id: "evt_tiny" } as any,
      paymentIntentId: "pi_4",
      reversalAmount: 1,
      reason: "purchase_refund",
      stripeObjectId: "re_3",
    });
    expect(calls[0].p_amount).toBe(-1);
  });

  it("is a no-op when the payment intent's price is not a credit pack", async () => {
    stubDenoEnv({});
    const serviceClient = createMockServiceClient({
      from: () => chainable(ok({ user_id: USER_ID })),
      rpc: async () => {
        throw new Error("rpc should not be called for a non-pack price");
      },
    });
    const intent = {
      id: "pi_5",
      customer: "cus_1",
      amount: 1000,
      amount_received: 1000,
      metadata: {},
    };
    await expect(
      reversePurchasedPack({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        serviceClient: serviceClient as any,
        stripe: stripeWithIntent(intent),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        event: { id: "evt_noop" } as any,
        paymentIntentId: "pi_5",
        reversalAmount: 500,
        reason: "purchase_refund",
        stripeObjectId: "re_4",
      }),
    ).resolves.toBeUndefined();
  });
});

describe("restoreReversedPack", () => {
  it("restores the exact amount that was previously debited", async () => {
    const calls: Record<string, unknown>[] = [];
    const serviceClient = createMockServiceClient({
      from: (table) => {
        if (table === "billing_customers") return chainable(ok({ user_id: USER_ID }));
        if (table === "credit_ledger") return chainable(ok({ amount: -3 }));
        throw new Error(`unexpected table ${table}`);
      },
      rpc: async (fn, args) => {
        calls.push({ fn, ...args });
        return ok(null);
      },
    });
    const intent = { id: "pi_2", customer: "cus_1", metadata: {} };
    await restoreReversedPack({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      serviceClient: serviceClient as any,
      stripe: stripeWithIntent(intent),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      event: { id: "evt_restore" } as any,
      paymentIntentId: "pi_2",
      debitReason: "purchase_refund",
      creditReason: "purchase_refund_reversal",
      stripeObjectId: "re_2",
    });
    expect(calls[0].p_amount).toBe(3);
  });

  it("is a no-op when there is no matching debit on record", async () => {
    const serviceClient = createMockServiceClient({
      from: (table) => {
        if (table === "billing_customers") return chainable(ok({ user_id: USER_ID }));
        if (table === "credit_ledger") return chainable(ok(null));
        throw new Error(`unexpected table ${table}`);
      },
      rpc: async () => {
        throw new Error("rpc should not be called when there is nothing to restore");
      },
    });
    const intent = { id: "pi_3", customer: "cus_1", metadata: {} };
    await expect(
      restoreReversedPack({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        serviceClient: serviceClient as any,
        stripe: stripeWithIntent(intent),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        event: { id: "evt_restore_noop" } as any,
        paymentIntentId: "pi_3",
        debitReason: "chargeback",
        creditReason: "chargeback_reversal",
        stripeObjectId: "dp_2",
      }),
    ).resolves.toBeUndefined();
  });
});
