import { afterEach, describe, expect, it } from "vitest";
import {
  activeSubscriptionStatus,
  catalogItemForPrice,
  checkoutItem,
  stripeCatalog,
} from "./stripe-catalog.ts";
import { stubDenoEnv } from "./test-support.ts";

afterEach(() => {
  delete (globalThis as { Deno?: unknown }).Deno;
});

describe("stripeCatalog", () => {
  it("falls back to the built-in defaults when env vars are unset", () => {
    stubDenoEnv({});
    const catalog = stripeCatalog();
    expect(catalog.find((item) => item.key === "starter")?.priceId).toBe("price_1ShwSxHTsSYecV8PE48lPEwy");
  });

  it("prefers configured env values over defaults", () => {
    stubDenoEnv({ STRIPE_STARTER_PRICE_ID: "price_override" });
    expect(stripeCatalog().find((item) => item.key === "starter")?.priceId).toBe("price_override");
  });
});

describe("checkoutItem", () => {
  it("resolves an item by productKey", () => {
    stubDenoEnv({});
    const item = checkoutItem({ productKey: "pack10" });
    expect(item.emailCredits).toBe(10);
  });

  it("resolves an item by priceId", () => {
    stubDenoEnv({});
    const priceId = stripeCatalog()[0].priceId;
    const item = checkoutItem({ priceId });
    expect(item.key).toBe("starter");
  });

  it("rejects an unknown product", () => {
    stubDenoEnv({});
    expect(() => checkoutItem({ productKey: "not-a-real-product" })).toThrow(/not available/);
  });

  it("rejects when the requested mode does not match the catalog entry", () => {
    stubDenoEnv({});
    expect(() => checkoutItem({ productKey: "pack10", mode: "subscription" })).toThrow(/mode does not match/);
  });
});

describe("catalogItemForPrice", () => {
  it("matches by priceId or productId", () => {
    stubDenoEnv({});
    const [starter] = stripeCatalog();
    expect(catalogItemForPrice(starter.priceId)?.key).toBe("starter");
    expect(catalogItemForPrice(undefined, starter.productId)?.key).toBe("starter");
    expect(catalogItemForPrice("unknown", "unknown")).toBeUndefined();
  });
});

describe("activeSubscriptionStatus", () => {
  it("treats active and trialing as active", () => {
    expect(activeSubscriptionStatus("active")).toBe(true);
    expect(activeSubscriptionStatus("trialing")).toBe(true);
  });

  it("treats every other status as inactive", () => {
    expect(activeSubscriptionStatus("past_due")).toBe(false);
    expect(activeSubscriptionStatus("canceled")).toBe(false);
    expect(activeSubscriptionStatus("incomplete_expired")).toBe(false);
  });
});
