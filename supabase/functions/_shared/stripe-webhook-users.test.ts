import { describe, expect, it } from "vitest";
import { saveStripeCustomerMapping, stripeObjectId, userForStripeCustomer } from "./stripe-webhook-users.ts";
import { chainable, createMockServiceClient, ok } from "./test-support.ts";

const USER_ID = "11111111-1111-4111-8111-111111111111";
const OTHER_USER_ID = "22222222-2222-4222-8222-222222222222";

describe("stripeObjectId", () => {
  it("returns the string as-is", () => {
    expect(stripeObjectId("cus_123")).toBe("cus_123");
  });

  it("extracts the id from an expanded object", () => {
    expect(stripeObjectId({ id: "cus_123", object: "customer" })).toBe("cus_123");
  });

  it("returns null for anything else", () => {
    expect(stripeObjectId(null)).toBeNull();
    expect(stripeObjectId(undefined)).toBeNull();
    expect(stripeObjectId(42)).toBeNull();
    expect(stripeObjectId({})).toBeNull();
  });
});

describe("userForStripeCustomer", () => {
  it("resolves via the billing_customers mapping when present", async () => {
    const serviceClient = createMockServiceClient({
      from: (table) => {
        expect(table).toBe("billing_customers");
        return chainable(ok({ user_id: USER_ID }));
      },
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userId = await userForStripeCustomer(serviceClient as any, "cus_1");
    expect(userId).toBe(USER_ID);
  });

  it("throws WEBHOOK_IDENTITY_MISMATCH when metadata disagrees with the stored mapping", async () => {
    const serviceClient = createMockServiceClient({
      from: () => chainable(ok({ user_id: USER_ID })),
    });
    await expect(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      userForStripeCustomer(serviceClient as any, "cus_1", OTHER_USER_ID),
    ).rejects.toMatchObject({ code: "WEBHOOK_IDENTITY_MISMATCH" });
  });

  it("falls back to metadata user id when there is no stored customer mapping", async () => {
    const serviceClient = createMockServiceClient({
      from: (table) => {
        if (table === "billing_customers") return chainable(ok(null));
        if (table === "profiles") return chainable(ok({ id: USER_ID }));
        throw new Error(`unexpected table ${table}`);
      },
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userId = await userForStripeCustomer(serviceClient as any, "cus_new", USER_ID);
    expect(userId).toBe(USER_ID);
  });

  it("ignores a malformed metadata user id and looks up by customer only", async () => {
    const serviceClient = createMockServiceClient({
      from: () => chainable(ok({ user_id: USER_ID })),
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userId = await userForStripeCustomer(serviceClient as any, "cus_1", "not-a-uuid");
    expect(userId).toBe(USER_ID);
  });

  it("throws WEBHOOK_USER_NOT_FOUND when nothing matches", async () => {
    const serviceClient = createMockServiceClient({
      from: () => chainable(ok(null)),
    });
    await expect(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      userForStripeCustomer(serviceClient as any, null, undefined),
    ).rejects.toMatchObject({ code: "WEBHOOK_USER_NOT_FOUND" });
  });
});

describe("saveStripeCustomerMapping", () => {
  it("no-ops when there is no customer id", async () => {
    const serviceClient = createMockServiceClient({
      from: () => {
        throw new Error("should not query when customerId is null");
      },
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await expect(saveStripeCustomerMapping(serviceClient as any, USER_ID, null)).resolves.toBeUndefined();
  });

  it("throws WEBHOOK_IDENTITY_MISMATCH when the customer already belongs to another user", async () => {
    const serviceClient = createMockServiceClient({
      from: () => chainable(ok({ user_id: OTHER_USER_ID })),
    });
    await expect(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      saveStripeCustomerMapping(serviceClient as any, USER_ID, "cus_1"),
    ).rejects.toMatchObject({ code: "WEBHOOK_IDENTITY_MISMATCH" });
  });

  it("upserts the mapping when it is new or already owned by this user", async () => {
    let upserted: unknown;
    const serviceClient = createMockServiceClient({
      from: (table) => {
        if (table !== "billing_customers") throw new Error(`unexpected table ${table}`);
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ok(null),
            }),
          }),
          upsert: (payload: unknown) => {
            upserted = payload;
            return { then: (resolve: (v: unknown) => void) => resolve(ok(null)) };
          },
        };
      },
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await saveStripeCustomerMapping(serviceClient as any, USER_ID, "cus_new");
    expect(upserted).toEqual({ user_id: USER_ID, stripe_customer_id: "cus_new" });
  });
});
