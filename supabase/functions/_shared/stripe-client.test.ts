import { afterEach, describe, expect, it } from "vitest";
import Stripe from "stripe";
import { stripeClient } from "./stripe-client.ts";
import { AppError } from "./errors.ts";
import { errorCode, errorMessage, errorStatus } from "./errors.ts";
import { stubDenoEnv } from "./test-support.ts";

// stripe-client.ts imports the real `stripe` package from
// https://esm.sh/stripe@18.5.0 at runtime (Deno edge). vitest.config.ts
// aliases that specifier to the local `stripe` devDependency (same version)
// so this suite exercises the real client construction without any network
// access — mirroring the sanitize-html alias technique.

afterEach(() => {
  delete (globalThis as { Deno?: unknown }).Deno;
});

describe("stripeClient - error path", () => {
  it("throws STRIPE_NOT_CONFIGURED when STRIPE_SECRET_KEY is unset", () => {
    stubDenoEnv({});
    expect(() => stripeClient()).toThrow(AppError);
  });

  it("throws STRIPE_NOT_CONFIGURED when STRIPE_SECRET_KEY is an empty string", () => {
    stubDenoEnv({ STRIPE_SECRET_KEY: "" });
    expect(() => stripeClient()).toThrow(AppError);
  });

  it("throws STRIPE_NOT_CONFIGURED when STRIPE_SECRET_KEY is whitespace only", () => {
    stubDenoEnv({ STRIPE_SECRET_KEY: "   " });
    expect(() => stripeClient()).toThrow(AppError);
  });

  it("carries a 503, non-exposable AppError contract so callers never leak billing internals", () => {
    stubDenoEnv({});
    try {
      stripeClient();
      throw new Error("expected stripeClient() to throw");
    } catch (caught) {
      expect(caught).toBeInstanceOf(AppError);
      const err = caught as AppError;
      expect(err.code).toBe("STRIPE_NOT_CONFIGURED");
      expect(err.status).toBe(503);
      expect(err.expose).toBe(false);
      // Response-contract helpers (used by every edge function's catch block)
      // must turn this into a safe, generic message rather than the raw one.
      expect(errorCode(err)).toBe("STRIPE_NOT_CONFIGURED");
      expect(errorStatus(err)).toBe(503);
      expect(errorMessage(err)).not.toContain("Billing is not configured");
      expect(errorMessage(err)).toBe("Não foi possível concluir a solicitação.");
    }
  });
});

describe("stripeClient - success path", () => {
  it("returns a real Stripe client instance configured with the pinned API version", () => {
    stubDenoEnv({ STRIPE_SECRET_KEY: "sk_test_123" });
    const client = stripeClient();
    expect(client).toBeInstanceOf(Stripe);
    const version = (client as unknown as { getApiField: (field: string) => string }).getApiField(
      "version",
    );
    expect(version).toBe("2025-08-27.basil");
  });

  it("exposes the Stripe resource namespaces the webhook/checkout code depends on", () => {
    stubDenoEnv({ STRIPE_SECRET_KEY: "sk_test_123" });
    const client = stripeClient();
    expect(typeof client.subscriptions.retrieve).toBe("function");
    expect(typeof client.subscriptions.list).toBe("function");
    expect(typeof client.customers.retrieve).toBe("function");
    expect(typeof client.paymentIntents.retrieve).toBe("function");
    expect(typeof client.charges.retrieve).toBe("function");
    expect(typeof client.checkout.sessions.create).toBe("function");
  });

  it("trims surrounding whitespace from the configured secret key", () => {
    stubDenoEnv({ STRIPE_SECRET_KEY: "  sk_test_456  " });
    expect(() => stripeClient()).not.toThrow();
  });

  it("wires a fetch-based HTTP client (no Node http/https) so it works on the Deno edge runtime", () => {
    stubDenoEnv({ STRIPE_SECRET_KEY: "sk_test_123" });
    const client = stripeClient();
    const httpClient = (client as unknown as { getApiField: (field: string) => unknown }).getApiField(
      "httpClient",
    );
    expect(httpClient).toBeDefined();
    // FetchHttpClient identifies itself distinctly from the default Node http client.
    expect((httpClient as { getClientName: () => string }).getClientName()).toBe("fetch");
  });

  it("builds a fresh client on every call (no shared/cached instance across invocations)", () => {
    stubDenoEnv({ STRIPE_SECRET_KEY: "sk_test_123" });
    const first = stripeClient();
    const second = stripeClient();
    expect(first).not.toBe(second);
  });
});
