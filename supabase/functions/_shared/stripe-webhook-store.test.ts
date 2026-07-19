import { describe, expect, it } from "vitest";
import { claimStripeEvent, finishStripeEvent } from "./stripe-webhook-store.ts";
import { createMockServiceClient, fail, ok } from "./test-support.ts";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function event(overrides: Record<string, unknown> = {}): any {
  return {
    id: "evt_1",
    type: "checkout.session.completed",
    created: 1700000000,
    livemode: false,
    data: { object: { id: "cs_1" } },
    ...overrides,
  };
}

describe("claimStripeEvent", () => {
  it("returns 'claimed' when the insert succeeds (first delivery)", async () => {
    const serviceClient = createMockServiceClient({
      from: (table) => {
        expect(table).toBe("stripe_events");
        return { insert: () => ({ then: (r: (v: unknown) => void) => r(ok(null)) }) };
      },
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await expect(claimStripeEvent(serviceClient as any, event())).resolves.toBe("claimed");
  });

  it("returns 'duplicate' when the event was already processed", async () => {
    const serviceClient = createMockServiceClient({
      from: () => ({
        insert: () => ({ then: (r: (v: unknown) => void) => r(fail("dup", "23505")) }),
        select: () => ({
          eq: () => ({
            single: async () => ok({ processing_status: "processed", updated_at: new Date().toISOString() }),
          }),
        }),
      }),
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await expect(claimStripeEvent(serviceClient as any, event())).resolves.toBe("duplicate");
  });

  it("returns 'busy' when another delivery is actively processing the same event", async () => {
    const serviceClient = createMockServiceClient({
      from: () => ({
        insert: () => ({ then: (r: (v: unknown) => void) => r(fail("dup", "23505")) }),
        select: () => ({
          eq: () => ({
            single: async () => ok({ processing_status: "processing", updated_at: new Date().toISOString() }),
          }),
        }),
      }),
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await expect(claimStripeEvent(serviceClient as any, event())).resolves.toBe("busy");
  });

  it("reclaims a stale 'processing' row instead of leaving it stuck forever", async () => {
    const staleTimestamp = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    let updatedPayload: unknown;
    const serviceClient = createMockServiceClient({
      from: () => ({
        insert: () => ({ then: (r: (v: unknown) => void) => r(fail("dup", "23505")) }),
        select: () => ({
          eq: () => ({
            single: async () => ok({ processing_status: "processing", updated_at: staleTimestamp }),
          }),
        }),
        update: (payload: unknown) => {
          updatedPayload = payload;
          return { eq: () => ({ then: (r: (v: unknown) => void) => r(ok(null)) }) };
        },
      }),
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await expect(claimStripeEvent(serviceClient as any, event())).resolves.toBe("claimed");
    expect(updatedPayload).toMatchObject({ processing_status: "processing" });
  });

  it("throws WEBHOOK_AUDIT_FAILED for a non-conflict insert error", async () => {
    const serviceClient = createMockServiceClient({
      from: () => ({ insert: () => ({ then: (r: (v: unknown) => void) => r(fail("db down", "XX000")) }) }),
    });
    await expect(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      claimStripeEvent(serviceClient as any, event()),
    ).rejects.toMatchObject({ code: "WEBHOOK_AUDIT_FAILED" });
  });
});

describe("finishStripeEvent", () => {
  it("marks the event processed with a timestamp", async () => {
    let payload: unknown;
    const serviceClient = createMockServiceClient({
      from: () => ({
        update: (p: unknown) => {
          payload = p;
          return { eq: () => ({ then: (r: (v: unknown) => void) => r(ok(null)) }) };
        },
      }),
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await finishStripeEvent(serviceClient as any, "evt_1", "processed");
    expect(payload).toMatchObject({ processing_status: "processed" });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((payload as any).processed_at).not.toBeNull();
  });

  it("does not stamp processed_at when marking a failure, but keeps the error message", async () => {
    let payload: unknown;
    const serviceClient = createMockServiceClient({
      from: () => ({
        update: (p: unknown) => {
          payload = p;
          return { eq: () => ({ then: (r: (v: unknown) => void) => r(ok(null)) }) };
        },
      }),
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await finishStripeEvent(serviceClient as any, "evt_1", "failed", new Error("stripe timeout"));
    expect(payload).toMatchObject({ processing_status: "failed", processed_at: null, error_message: "stripe timeout" });
  });
});
