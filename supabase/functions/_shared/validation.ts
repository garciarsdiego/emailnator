import { AppError } from "./errors.ts";

export type JsonObject = Record<string, unknown>;

export function objectValue(value: unknown, field = "body"): JsonObject {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new AppError("VALIDATION_ERROR", 400, `${field} must be an object`);
  }
  return value as JsonObject;
}

export function requiredString(
  object: JsonObject,
  field: string,
  options: { min?: number; max?: number } = {},
): string {
  const value = object[field];
  const min = options.min ?? 1;
  const max = options.max ?? 1000;
  if (typeof value !== "string" || value.trim().length < min || value.length > max) {
    throw new AppError("VALIDATION_ERROR", 400, `${field} must contain between ${min} and ${max} characters`, true, { field });
  }
  return value.trim();
}

export function optionalString(
  object: JsonObject,
  field: string,
  max = 5000,
): string | undefined {
  const value = object[field];
  if (value === null || value === undefined || value === "") return undefined;
  if (typeof value !== "string" || value.length > max) {
    throw new AppError("VALIDATION_ERROR", 400, `${field} must be a string with at most ${max} characters`, true, { field });
  }
  return value.trim();
}

export function optionalObject(object: JsonObject, field: string, maxBytes = 50_000): JsonObject | undefined {
  const value = object[field];
  if (value === null || value === undefined) return undefined;
  const parsed = objectValue(value, field);
  if (new TextEncoder().encode(JSON.stringify(parsed)).byteLength > maxBytes) {
    throw new AppError("VALIDATION_ERROR", 400, `${field} is too large`, true, { field });
  }
  return parsed;
}

export function trimmed(value: unknown, max: number): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}
