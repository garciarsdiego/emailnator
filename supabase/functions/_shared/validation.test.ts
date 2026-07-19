import { describe, expect, it } from "vitest";
import {
  objectValue,
  optionalObject,
  optionalString,
  requiredString,
  trimmed,
} from "./validation.ts";

describe("objectValue", () => {
  it("returns plain objects unchanged", () => {
    expect(objectValue({ a: 1 })).toEqual({ a: 1 });
  });

  it("rejects null, arrays, and primitives", () => {
    expect(() => objectValue(null)).toThrow("body must be an object");
    expect(() => objectValue([1, 2])).toThrow(/must be an object/);
    expect(() => objectValue("hi")).toThrow(/must be an object/);
    expect(() => objectValue(42)).toThrow(/must be an object/);
  });

  it("uses the provided field name in the error", () => {
    expect(() => objectValue(null, "settings")).toThrow("settings must be an object");
  });
});

describe("requiredString", () => {
  it("trims and returns a valid string within bounds", () => {
    expect(requiredString({ name: "  Alice  " }, "name")).toBe("Alice");
  });

  it("rejects missing or non-string values", () => {
    expect(() => requiredString({}, "name")).toThrow(/must contain between/);
    expect(() => requiredString({ name: 42 }, "name")).toThrow(/must contain between/);
  });

  it("rejects strings shorter than min after trimming", () => {
    expect(() => requiredString({ name: "   " }, "name", { min: 1 })).toThrow();
  });

  it("rejects strings longer than max (measured before trimming)", () => {
    expect(() => requiredString({ name: "abcdef" }, "name", { max: 5 })).toThrow();
  });

  it("honors custom min/max bounds", () => {
    expect(requiredString({ code: "AB" }, "code", { min: 2, max: 2 })).toBe("AB");
  });
});

describe("optionalString", () => {
  it("returns undefined for null, undefined, or empty string", () => {
    expect(optionalString({ bio: null }, "bio")).toBeUndefined();
    expect(optionalString({ bio: undefined }, "bio")).toBeUndefined();
    expect(optionalString({ bio: "" }, "bio")).toBeUndefined();
    expect(optionalString({}, "bio")).toBeUndefined();
  });

  it("trims and returns a valid string", () => {
    expect(optionalString({ bio: "  hello  " }, "bio")).toBe("hello");
  });

  it("rejects non-string values and over-length strings", () => {
    expect(() => optionalString({ bio: 123 }, "bio")).toThrow(/must be a string/);
    expect(() => optionalString({ bio: "x".repeat(10) }, "bio", 5)).toThrow(/must be a string/);
  });
});

describe("optionalObject", () => {
  it("returns undefined for null/undefined", () => {
    expect(optionalObject({ settings: null }, "settings")).toBeUndefined();
    expect(optionalObject({}, "settings")).toBeUndefined();
  });

  it("returns the parsed object when within the byte budget", () => {
    expect(optionalObject({ settings: { theme: "dark" } }, "settings")).toEqual({ theme: "dark" });
  });

  it("rejects payloads larger than maxBytes", () => {
    const big = { blob: "x".repeat(100) };
    expect(() => optionalObject({ settings: big }, "settings", 10)).toThrow(/too large/);
  });

  it("rejects non-object values via objectValue", () => {
    expect(() => optionalObject({ settings: "nope" }, "settings")).toThrow(/must be an object/);
  });
});

describe("trimmed", () => {
  it("trims and truncates strings", () => {
    expect(trimmed("  hello world  ", 5)).toBe("hello");
  });

  it("returns an empty string for non-string input", () => {
    expect(trimmed(42, 5)).toBe("");
    expect(trimmed(undefined, 5)).toBe("");
    expect(trimmed(null, 5)).toBe("");
  });
});
