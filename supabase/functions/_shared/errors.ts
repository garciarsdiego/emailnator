export class AppError extends Error {
  constructor(
    public readonly code: string,
    public readonly status: number,
    message: string,
    public readonly expose = true,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function errorCode(error: unknown): string {
  if (error instanceof AppError) return error.code;
  if (error instanceof Error && error.message === "INSUFFICIENT_CREDITS") {
    return "INSUFFICIENT_CREDITS";
  }
  return "INTERNAL_ERROR";
}

export function errorMessage(error: unknown): string {
  if (error instanceof AppError && error.expose) return error.message;
  return "Não foi possível concluir a solicitação.";
}

export function errorStatus(error: unknown): number {
  if (error instanceof AppError) return error.status;
  return 500;
}
