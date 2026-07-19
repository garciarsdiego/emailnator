import { afterEach, describe, expect, it } from "vitest";
import { appOrigin, assertAllowedOrigin, corsHeaders, preflight } from "./cors.ts";
import { stubDenoEnv } from "./test-support.ts";

afterEach(() => {
  delete (globalThis as { Deno?: unknown }).Deno;
});

function req(headers: Record<string, string> = {}, method = "GET") {
  return new Request("https://x.example/fn", { headers, method });
}

describe("assertAllowedOrigin", () => {
  it("allows requests without an Origin header (e.g. server-to-server)", () => {
    stubDenoEnv({});
    expect(() => assertAllowedOrigin(req())).not.toThrow();
  });

  it("allows the configured APP_ORIGIN", () => {
    stubDenoEnv({ APP_ORIGIN: "https://app.example.com" });
    expect(() => assertAllowedOrigin(req({ origin: "https://app.example.com" }))).not.toThrow();
  });

  it("allows the built-in local dev origins even when unconfigured", () => {
    stubDenoEnv({});
    expect(() => assertAllowedOrigin(req({ origin: "http://localhost:5173" }))).not.toThrow();
  });

  it("rejects an origin that is not on the allow list", () => {
    stubDenoEnv({ APP_ORIGIN: "https://app.example.com" });
    expect(() => assertAllowedOrigin(req({ origin: "https://evil.example.com" }))).toThrow(/not allowed/);
  });
});

describe("corsHeaders / preflight", () => {
  it("echoes back an allowed origin", () => {
    stubDenoEnv({ APP_ORIGIN: "https://app.example.com" });
    const headers = corsHeaders(req({ origin: "https://app.example.com" }));
    expect(headers["Access-Control-Allow-Origin"]).toBe("https://app.example.com");
  });

  it("returns 204 for an allowed preflight and 403 for a disallowed one", () => {
    stubDenoEnv({ APP_ORIGIN: "https://app.example.com" });
    const allowed = preflight(req({ origin: "https://app.example.com" }, "OPTIONS"));
    expect(allowed?.status).toBe(204);
    const blocked = preflight(req({ origin: "https://evil.example.com" }, "OPTIONS"));
    expect(blocked?.status).toBe(403);
  });

  it("returns null for non-OPTIONS requests", () => {
    stubDenoEnv({});
    expect(preflight(req({}, "POST"))).toBeNull();
  });
});

describe("appOrigin", () => {
  it("prefers the explicit APP_ORIGIN over the request origin", () => {
    stubDenoEnv({ APP_ORIGIN: "https://configured.example.com/" });
    expect(appOrigin(req({ origin: "https://other.example.com" }))).toBe("https://configured.example.com");
  });

  it("falls back to the validated request origin when APP_ORIGIN is unset", () => {
    stubDenoEnv({ ALLOWED_ORIGINS: "https://other.example.com" });
    expect(appOrigin(req({ origin: "https://other.example.com" }))).toBe("https://other.example.com");
  });
});
