import { describe, expect, it } from "vitest";
import { sha256 } from "./hash.ts";

describe("sha256", () => {
  it("is deterministic for the same value", async () => {
    const a = await sha256({ x: 1, y: "two" });
    const b = await sha256({ x: 1, y: "two" });
    expect(a).toBe(b);
  });

  it("is stable across key ordering (used to fingerprint idempotency requests)", async () => {
    const a = await sha256({ a: 1, b: 2, c: { d: 3, e: 4 } });
    const b = await sha256({ c: { e: 4, d: 3 }, b: 2, a: 1 });
    expect(a).toBe(b);
  });

  it("produces different hashes for different values", async () => {
    const a = await sha256({ amount: 10 });
    const b = await sha256({ amount: 11 });
    expect(a).not.toBe(b);
  });

  it("returns a 64-character lowercase hex digest", async () => {
    const digest = await sha256("hello");
    expect(digest).toMatch(/^[0-9a-f]{64}$/);
  });
});
