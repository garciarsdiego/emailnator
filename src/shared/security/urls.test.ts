import { describe, expect, it } from "vitest";
import { safeExternalHttpUrl } from "@/shared/security/urls";

describe("safeExternalHttpUrl", () => {
  it("accepts only absolute http URLs", () => {
    expect(safeExternalHttpUrl("https://example.com/catalog")).toBe("https://example.com/catalog");
    expect(safeExternalHttpUrl("http://example.com")).toBe("http://example.com/");
    expect(safeExternalHttpUrl("javascript:alert(1)")).toBeNull();
    expect(safeExternalHttpUrl("//evil.example")).toBeNull();
    expect(safeExternalHttpUrl("not a url")).toBeNull();
  });
});
