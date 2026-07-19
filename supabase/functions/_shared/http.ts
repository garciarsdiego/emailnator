import { assertAllowedOrigin, corsHeaders } from "./cors.ts";
import { AppError, errorCode, errorMessage, errorStatus } from "./errors.ts";
import { logError } from "./logger.ts";

const MAX_JSON_BODY_BYTES = 128 * 1024;

export function jsonResponse(
  req: Request,
  body: unknown,
  status = 200,
  extraHeaders: Record<string, string> = {},
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders(req),
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      ...extraHeaders,
    },
  });
}

export async function readJson(req: Request): Promise<unknown> {
  assertAllowedOrigin(req);
  if (req.method !== "POST") {
    throw new AppError("METHOD_NOT_ALLOWED", 405, "Only POST is supported");
  }
  const declaredLength = Number(req.headers.get("content-length") ?? 0);
  if (declaredLength > MAX_JSON_BODY_BYTES) {
    throw new AppError("REQUEST_TOO_LARGE", 413, "Request body is too large");
  }

  const raw = await req.text();
  if (new TextEncoder().encode(raw).byteLength > MAX_JSON_BODY_BYTES) {
    throw new AppError("REQUEST_TOO_LARGE", 413, "Request body is too large");
  }
  try {
    return raw ? JSON.parse(raw) : {};
  } catch {
    throw new AppError("INVALID_JSON", 400, "Request body must be valid JSON");
  }
}

export function errorResponse(req: Request, error: unknown, requestId: string): Response {
  const code = errorCode(error);
  const appError = error instanceof AppError ? error : undefined;
  // Internal diagnostics (database codes, provider statuses) go to the
  // structured server log; the client only receives details from errors
  // explicitly marked as exposable.
  logError("request_failed", error, { requestId, code, ...(appError?.details ?? {}) });
  return jsonResponse(
    req,
    {
      error: errorMessage(error),
      code,
      requestId,
      ...(appError?.expose && appError.details ? { details: appError.details } : {}),
    },
    errorStatus(error),
  );
}

export function requestId(req: Request): string {
  return req.headers.get("x-request-id")?.slice(0, 100) || crypto.randomUUID();
}
