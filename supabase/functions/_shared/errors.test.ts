import { describe, expect, it } from "vitest";
import { AppError, errorCode, errorMessage, errorStatus } from "./errors.ts";

describe("AppError helpers", () => {
  it("extracts code/status/message from an AppError", () => {
    const error = new AppError("VALIDATION_ERROR", 400, "bad input");
    expect(errorCode(error)).toBe("VALIDATION_ERROR");
    expect(errorStatus(error)).toBe(400);
    expect(errorMessage(error)).toBe("bad input");
  });

  it("hides the message of a non-exposed AppError behind a generic string", () => {
    const error = new AppError("INTERNAL_DB_ERROR", 500, "duplicate key on credit_ledger", false);
    expect(errorMessage(error)).toBe("Não foi possível concluir a solicitação.");
    expect(errorStatus(error)).toBe(500);
  });

  it("maps the bare INSUFFICIENT_CREDITS Error thrown by some RPCs", () => {
    expect(errorCode(new Error("INSUFFICIENT_CREDITS"))).toBe("INSUFFICIENT_CREDITS");
  });

  it("defaults unknown errors to INTERNAL_ERROR / 500 / generic message", () => {
    expect(errorCode(new Error("anything"))).toBe("INTERNAL_ERROR");
    expect(errorCode("not even an error")).toBe("INTERNAL_ERROR");
    expect(errorStatus(new Error("x"))).toBe(500);
    expect(errorMessage(new Error("x"))).toBe("Não foi possível concluir a solicitação.");
  });
});
