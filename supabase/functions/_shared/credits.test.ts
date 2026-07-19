import { describe, expect, it } from "vitest";
import {
  completeGeneration,
  idempotencyKey,
  markProcessing,
  refundGeneration,
  reserveCredits,
} from "./credits.ts";
import { AppError } from "./errors.ts";
import { createMockServiceClient, fail, ok } from "./test-support.ts";

function baseOptions(rpcResults: { stale?: unknown; reserve?: unknown }) {
  const calls: { fn: string; args: Record<string, unknown> }[] = [];
  const serviceClient = createMockServiceClient({
    rpc: async (fn, args) => {
      calls.push({ fn, args });
      if (fn === "refund_stale_generation_jobs") return (rpcResults.stale as never) ?? ok(null);
      if (fn === "reserve_generation_credits") return (rpcResults.reserve as never) ?? ok(null);
      throw new Error(`unexpected rpc ${fn}`);
    },
  });
  return { serviceClient, calls };
}

describe("reserveCredits", () => {
  it("reserves credits and returns the fresh reservation", async () => {
    const { serviceClient, calls } = baseOptions({
      reserve: ok({ job_id: "job-1", status: "reserved", already_processed: false, result: null }),
    });
    const reservation = await reserveCredits({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      serviceClient: serviceClient as any,
      userId: "user-1",
      jobType: "email_generation",
      creditType: "email",
      amount: 1,
      idempotencyKey: "key-1",
      requestBody: { prompt: "hello" },
    });
    expect(reservation.job_id).toBe("job-1");
    expect(calls[0].fn).toBe("refund_stale_generation_jobs");
    expect(calls[1].fn).toBe("reserve_generation_credits");
    expect(calls[1].args.p_idempotency_key).toBe("key-1");
  });

  it("throws INSUFFICIENT_CREDITS when the RPC reports it", async () => {
    const { serviceClient } = baseOptions({
      reserve: fail("INSUFFICIENT_CREDITS: balance too low"),
    });
    await expect(
      reserveCredits({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        serviceClient: serviceClient as any,
        userId: "user-1",
        jobType: "email_generation",
        creditType: "email",
        amount: 1,
        idempotencyKey: "key-1",
        requestBody: {},
      }),
    ).rejects.toMatchObject({ code: "INSUFFICIENT_CREDITS", status: 402 });
  });

  it("throws IDEMPOTENCY_CONFLICT when the same key targets a different request", async () => {
    const { serviceClient } = baseOptions({
      reserve: fail("IDEMPOTENCY_CONFLICT: fingerprint mismatch"),
    });
    await expect(
      reserveCredits({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        serviceClient: serviceClient as any,
        userId: "user-1",
        jobType: "email_generation",
        creditType: "email",
        amount: 1,
        idempotencyKey: "key-1",
        requestBody: {},
      }),
    ).rejects.toMatchObject({ code: "IDEMPOTENCY_CONFLICT", status: 409 });
  });

  it("replays a previously succeeded job instead of reserving again", async () => {
    const { serviceClient } = baseOptions({
      reserve: ok({ job_id: "job-2", status: "succeeded", already_processed: true, result: { html: "<p/>" } }),
    });
    const reservation = await reserveCredits({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      serviceClient: serviceClient as any,
      userId: "user-1",
      jobType: "email_generation",
      creditType: "email",
      amount: 1,
      idempotencyKey: "key-2",
      requestBody: {},
    });
    expect(reservation.result).toEqual({ html: "<p/>" });
  });

  it("rejects a retry while the same job is still in flight", async () => {
    const { serviceClient } = baseOptions({
      reserve: ok({ job_id: "job-3", status: "processing", already_processed: true, result: null }),
    });
    await expect(
      reserveCredits({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        serviceClient: serviceClient as any,
        userId: "user-1",
        jobType: "email_generation",
        creditType: "email",
        amount: 1,
        idempotencyKey: "key-3",
        requestBody: {},
      }),
    ).rejects.toMatchObject({ code: "GENERATION_ALREADY_IN_PROGRESS", status: 409 });
  });

  it("surfaces stale-job recovery failures without attempting the reservation", async () => {
    const { serviceClient, calls } = baseOptions({
      stale: fail("db unavailable", "57P01"),
    });
    await expect(
      reserveCredits({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        serviceClient: serviceClient as any,
        userId: "user-1",
        jobType: "email_generation",
        creditType: "email",
        amount: 1,
        idempotencyKey: "key-4",
        requestBody: {},
      }),
    ).rejects.toMatchObject({ code: "STALE_JOB_RECOVERY_FAILED" });
    expect(calls).toHaveLength(1);
  });
});

describe("markProcessing / completeGeneration / refundGeneration", () => {
  it("propagate RPC failures as AppError", async () => {
    const serviceClient = createMockServiceClient({ rpc: async () => fail("boom", "XX000") });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await expect(markProcessing(serviceClient as any, "u1", "j1")).rejects.toBeInstanceOf(AppError);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await expect(completeGeneration(serviceClient as any, "u1", "j1", {})).rejects.toBeInstanceOf(AppError);
  });

  it("refundGeneration never throws even if the refund RPC itself fails", async () => {
    const serviceClient = createMockServiceClient({ rpc: async () => fail("refund failed", "XX000") });
    await expect(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      refundGeneration(serviceClient as any, "u1", "j1", new Error("generation blew up")),
    ).resolves.toBeUndefined();
  });
});

describe("idempotencyKey", () => {
  it("returns a supplied, well-formed header value", () => {
    const req = new Request("https://x", { headers: { "idempotency-key": "abc-123_def.456:x" } });
    expect(idempotencyKey(req)).toBe("abc-123_def.456:x");
  });

  it("rejects an invalid header format", () => {
    const req = new Request("https://x", { headers: { "idempotency-key": "not valid!" } });
    expect(() => idempotencyKey(req)).toThrow(AppError);
  });

  it("rejects an overly long header value", () => {
    const req = new Request("https://x", { headers: { "idempotency-key": "a".repeat(201) } });
    expect(() => idempotencyKey(req)).toThrow(AppError);
  });

  it("generates a key when the header is absent", () => {
    const req = new Request("https://x");
    expect(idempotencyKey(req)).toMatch(/^generated:/);
  });
});
