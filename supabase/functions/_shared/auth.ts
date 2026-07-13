import {
  createClient,
  type SupabaseClient,
  type User,
} from "https://esm.sh/@supabase/supabase-js@2.89.0";
import { AppError } from "./errors.ts";

export interface AuthContext {
  user: User;
  token: string;
  userClient: SupabaseClient;
  serviceClient: SupabaseClient;
}

function requiredEnv(name: string): string {
  const value = Deno.env.get(name)?.trim();
  if (!value) {
    throw new AppError("SERVER_MISCONFIGURED", 500, `${name} is not configured`, false);
  }
  return value;
}

export function createServiceClient(): SupabaseClient {
  return createClient(
    requiredEnv("SUPABASE_URL"),
    requiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
    {
      auth: { autoRefreshToken: false, persistSession: false },
    },
  );
}

function createUserClient(token: string): SupabaseClient {
  return createClient(
    requiredEnv("SUPABASE_URL"),
    requiredEnv("SUPABASE_ANON_KEY"),
    {
      auth: { autoRefreshToken: false, persistSession: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    },
  );
}

function bearerToken(req: Request): string {
  const header = req.headers.get("authorization")?.trim();
  const match = header?.match(/^Bearer\s+(.+)$/i);
  if (!match?.[1]) {
    throw new AppError("AUTHENTICATION_REQUIRED", 401, "A user access token is required");
  }

  const token = match[1].trim();
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")?.trim();
  if (!token || token === anonKey) {
    throw new AppError("AUTHENTICATION_REQUIRED", 401, "A user access token is required");
  }
  return token;
}

export async function requireUser(req: Request): Promise<AuthContext> {
  const token = bearerToken(req);
  const userClient = createUserClient(token);
  const serviceClient = createServiceClient();

  const { data, error } = await userClient.auth.getUser(token);
  if (error || !data.user) {
    throw new AppError("INVALID_ACCESS_TOKEN", 401, "The access token is invalid or expired");
  }

  return { user: data.user, token, userClient, serviceClient };
}
