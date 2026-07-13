import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useIdempotencyKey } from "@/shared/hooks/useIdempotencyKey";

describe("useIdempotencyKey", () => {
  it("keeps a key for the same failed intent and renews it after completion", () => {
    const { result } = renderHook(() => useIdempotencyKey());
    const first = result.current.getKey({ niche: "retail" });
    expect(result.current.getKey({ niche: "retail" })).toBe(first);
    expect(result.current.getKey({ niche: "saas" })).not.toBe(first);

    const current = result.current.getKey({ niche: "saas" });
    act(() => result.current.complete());
    expect(result.current.getKey({ niche: "saas" })).not.toBe(current);
  });
});
