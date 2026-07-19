import { describe, expect, it } from "vitest";
import { enforceRateLimit } from "./rate-limit.ts";
import { createMockServiceClient, fail, ok } from "./test-support.ts";

describe("enforceRateLimit", () => {
  it("resolves without error when the RPC allows the request", async () => {
    const serviceClient = createMockServiceClient({ rpc: async () => ok(null) });
    await expect(
      enforceRateLimit({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        serviceClient: serviceClient as any,
        userId: "u1",
        action: "generate-email",
        maxRequests: 10,
        windowSeconds: 60,
      }),
    ).resolves.toBeUndefined();
  });

  it("throws RATE_LIMIT_EXCEEDED with the retry-after parsed from details", async () => {
    const serviceClient = createMockServiceClient({
      rpc: async () =>
        fail("RATE_LIMIT_EXCEEDED", "P0001", '{"retry_after_seconds": 42}'),
    });
    await expect(
      enforceRateLimit({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        serviceClient: serviceClient as any,
        userId: "u1",
        action: "generate-email",
        maxRequests: 10,
        windowSeconds: 60,
      }),
    ).rejects.toMatchObject({
      code: "RATE_LIMIT_EXCEEDED",
      status: 429,
      details: { retryAfterSeconds: 42 },
    });
  });

  it("falls back to the configured window when retry-after is not present", async () => {
    const serviceClient = createMockServiceClient({ rpc: async () => fail("RATE_LIMIT_EXCEEDED") });
    await expect(
      enforceRateLimit({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        serviceClient: serviceClient as any,
        userId: "u1",
        action: "generate-email",
        maxRequests: 10,
        windowSeconds: 30,
      }),
    ).rejects.toMatchObject({ details: { retryAfterSeconds: 30 } });
  });

  it("wraps unexpected database errors as RATE_LIMIT_CHECK_FAILED", async () => {
    const serviceClient = createMockServiceClient({ rpc: async () => fail("connection reset", "08006") });
    await expect(
      enforceRateLimit({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        serviceClient: serviceClient as any,
        userId: "u1",
        action: "generate-email",
        maxRequests: 10,
        windowSeconds: 60,
      }),
    ).rejects.toMatchObject({ code: "RATE_LIMIT_CHECK_FAILED", status: 500 });
  });
});
