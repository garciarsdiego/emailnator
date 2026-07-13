import { AppError } from "./errors.ts";

const LOCAL_ORIGINS = new Set([
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:4173",
  "http://127.0.0.1:4173",
]);

function configuredOrigins(): Set<string> {
  const values = [
    Deno.env.get("APP_ORIGIN") ?? "",
    Deno.env.get("ALLOWED_ORIGINS") ?? "",
  ]
    .flatMap((value) => value.split(","))
    .map((value) => value.trim().replace(/\/$/, ""))
    .filter(Boolean);
  return new Set([...LOCAL_ORIGINS, ...values]);
}

export function assertAllowedOrigin(req: Request): void {
  const origin = req.headers.get("origin")?.replace(/\/$/, "");
  if (!origin) return;
  const origins = configuredOrigins();
  if (!origins.has("*") && !origins.has(origin)) {
    throw new AppError("ORIGIN_NOT_ALLOWED", 403, "Origin is not allowed");
  }
}

export function corsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("origin")?.replace(/\/$/, "");
  const origins = configuredOrigins();
  const allowedOrigin = origins.has("*")
    ? "*"
    : origin && origins.has(origin)
    ? origin
    : [...origins][0] ?? "http://localhost:5173";

  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, idempotency-key",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Expose-Headers": "X-Generation-Job-Id, X-Request-Id",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

export function preflight(req: Request): Response | null {
  if (req.method !== "OPTIONS") return null;
  try {
    assertAllowedOrigin(req);
    return new Response(null, { status: 204, headers: corsHeaders(req) });
  } catch {
    return new Response(null, { status: 403, headers: corsHeaders(req) });
  }
}

export function appOrigin(req: Request): string {
  const explicit = Deno.env.get("APP_ORIGIN")?.trim().replace(/\/$/, "");
  if (explicit) return explicit;

  assertAllowedOrigin(req);
  const requestOrigin = req.headers.get("origin")?.replace(/\/$/, "");
  if (requestOrigin) return requestOrigin;
  return "http://localhost:5173";
}
