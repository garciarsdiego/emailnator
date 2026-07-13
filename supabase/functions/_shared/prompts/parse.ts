import { AppError } from "../errors.ts";
import type { JsonObject } from "../validation.ts";

export function aiObject(value: unknown, field = "AI response"): JsonObject {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new AppError("AI_INVALID_RESPONSE", 502, `${field} must be an object`);
  }
  return value as JsonObject;
}
