import { describe, expect, it } from "vitest";
import {
  FREE_SUBSCRIPTION,
  normalizeSubscription,
} from "@/features/billing/model/subscription";

describe("normalizeSubscription", () => {
  it("returns the free contract for malformed payloads", () => {
    expect(normalizeSubscription(null)).toEqual(FREE_SUBSCRIPTION);
    expect(normalizeSubscription("pro")).toEqual(FREE_SUBSCRIPTION);
  });

  it("normalizes a valid server payload", () => {
    expect(
      normalizeSubscription({
        subscribed: true,
        plan: "pro",
        subscription_end: "2027-01-01T00:00:00.000Z",
        is_trialing: true,
      }),
    ).toEqual({
      subscribed: true,
      plan: "pro",
      subscriptionEnd: "2027-01-01T00:00:00.000Z",
      isTrialing: true,
    });
  });

  it("does not accept an unknown entitlement", () => {
    expect(normalizeSubscription({ subscribed: true, plan: "root" }).plan).toBe("free");
  });
});
