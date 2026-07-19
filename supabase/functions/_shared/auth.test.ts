import { afterEach, describe, expect, it, vi } from "vitest";

// auth.ts imports `createClient` from https://esm.sh/@supabase/supabase-js@2.89.0
// at runtime (Deno edge). vitest.config.ts aliases that specifier to the local
// `@supabase/supabase-js` dependency (same version pin), and we mock that
// resolved module here so `requireUser`/`createServiceClient` never attempt a
// real network call — same alias technique used for sanitize-html, plus a
// mock for the parts that would otherwise hit the network.
const { createClientMock, getUserMock } = vi.hoisted(() => ({
  createClientMock: vi.fn((url: string, key: string, options?: Record<string, unknown>) => ({
    __url: url,
    __key: key,
    __options: options,
    auth: { getUser: getUserMock },
  })),
  getUserMock: vi.fn(),
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: createClientMock,
}));

import { createServiceClient, requireUser } from "./auth.ts";
import { AppError } from "./errors.ts";
import { stubDenoEnv } from "./test-support.ts";

const USER = { id: "user-1", email: "user@example.com" };

function fakeRequest(headers: Record<string, string> = {}): Request {
  const lower = new Map(Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v]));
  return {
    headers: {
      get: (name: string) => lower.get(name.toLowerCase()) ?? null,
    },
  } as unknown as Request;
}

function expectAppError(fn: () => unknown, code: string, status: number) {
  try {
    fn();
    throw new Error("expected function to throw");
  } catch (caught) {
    expect(caught).toBeInstanceOf(AppError);
    const err = caught as AppError;
    expect(err.code).toBe(code);
    expect(err.status).toBe(status);
  }
}

async function expectAppErrorAsync(fn: () => Promise<unknown>, code: string, status: number) {
  await expect(fn()).rejects.toBeInstanceOf(AppError);
  try {
    await fn();
  } catch (caught) {
    const err = caught as AppError;
    expect(err.code).toBe(code);
    expect(err.status).toBe(status);
  }
}

afterEach(() => {
  delete (globalThis as { Deno?: unknown }).Deno;
  createClientMock.mockClear();
  getUserMock.mockReset();
});

const ENV = {
  SUPABASE_URL: "https://project.supabase.co",
  SUPABASE_ANON_KEY: "anon-key-123",
  SUPABASE_SERVICE_ROLE_KEY: "service-role-key-456",
};

describe("createServiceClient", () => {
  it("builds a client with the service role key and no session persistence", () => {
    stubDenoEnv(ENV);
    createServiceClient();
    expect(createClientMock).toHaveBeenCalledWith(
      ENV.SUPABASE_URL,
      ENV.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { autoRefreshToken: false, persistSession: false } },
    );
  });

  it("throws SERVER_MISCONFIGURED when SUPABASE_URL is missing", () => {
    stubDenoEnv({ SUPABASE_SERVICE_ROLE_KEY: ENV.SUPABASE_SERVICE_ROLE_KEY });
    expectAppError(() => createServiceClient(), "SERVER_MISCONFIGURED", 500);
  });

  it("throws SERVER_MISCONFIGURED when SUPABASE_SERVICE_ROLE_KEY is missing", () => {
    stubDenoEnv({ SUPABASE_URL: ENV.SUPABASE_URL });
    expectAppError(() => createServiceClient(), "SERVER_MISCONFIGURED", 500);
  });

  it("treats a whitespace-only env value as unset", () => {
    stubDenoEnv({ SUPABASE_URL: "   ", SUPABASE_SERVICE_ROLE_KEY: ENV.SUPABASE_SERVICE_ROLE_KEY });
    expectAppError(() => createServiceClient(), "SERVER_MISCONFIGURED", 500);
  });
});

describe("requireUser - error paths", () => {
  it("throws AUTHENTICATION_REQUIRED when the Authorization header is absent", async () => {
    stubDenoEnv(ENV);
    await expectAppErrorAsync(() => requireUser(fakeRequest()), "AUTHENTICATION_REQUIRED", 401);
    expect(createClientMock).not.toHaveBeenCalled();
  });

  it("throws AUTHENTICATION_REQUIRED when the header has no Bearer prefix", async () => {
    stubDenoEnv(ENV);
    await expectAppErrorAsync(
      () => requireUser(fakeRequest({ authorization: "Basic abc123" })),
      "AUTHENTICATION_REQUIRED",
      401,
    );
  });

  it("throws AUTHENTICATION_REQUIRED when Bearer is present but the token is blank", async () => {
    stubDenoEnv(ENV);
    await expectAppErrorAsync(
      () => requireUser(fakeRequest({ authorization: "Bearer    " })),
      "AUTHENTICATION_REQUIRED",
      401,
    );
  });

  it("throws AUTHENTICATION_REQUIRED when the caller sends the anon key as the bearer token", async () => {
    // Regression: a caller must not be able to impersonate an authenticated
    // user simply by echoing the public anon key back as their access token.
    stubDenoEnv(ENV);
    await expectAppErrorAsync(
      () => requireUser(fakeRequest({ authorization: `Bearer ${ENV.SUPABASE_ANON_KEY}` })),
      "AUTHENTICATION_REQUIRED",
      401,
    );
    expect(createClientMock).not.toHaveBeenCalled();
  });

  it("accepts a lowercase 'bearer' scheme (case-insensitive)", async () => {
    stubDenoEnv(ENV);
    getUserMock.mockResolvedValue({ data: { user: USER }, error: null });
    const ctx = await requireUser(fakeRequest({ authorization: "bearer good-token" }));
    expect(ctx.token).toBe("good-token");
  });

  it("throws INVALID_ACCESS_TOKEN when Supabase returns an error for the token", async () => {
    stubDenoEnv(ENV);
    getUserMock.mockResolvedValue({ data: { user: null }, error: { message: "jwt expired" } });
    await expectAppErrorAsync(
      () => requireUser(fakeRequest({ authorization: "Bearer bad-token" })),
      "INVALID_ACCESS_TOKEN",
      401,
    );
  });

  it("throws INVALID_ACCESS_TOKEN when Supabase returns no error but also no user", async () => {
    stubDenoEnv(ENV);
    getUserMock.mockResolvedValue({ data: { user: null }, error: null });
    await expectAppErrorAsync(
      () => requireUser(fakeRequest({ authorization: "Bearer no-user-token" })),
      "INVALID_ACCESS_TOKEN",
      401,
    );
  });

  it("propagates SERVER_MISCONFIGURED when required Supabase env vars are missing", async () => {
    stubDenoEnv({ SUPABASE_ANON_KEY: ENV.SUPABASE_ANON_KEY }); // SUPABASE_URL missing
    await expectAppErrorAsync(
      () => requireUser(fakeRequest({ authorization: "Bearer good-token" })),
      "SERVER_MISCONFIGURED",
      500,
    );
  });
});

describe("requireUser - success path / response contract", () => {
  it("returns { user, token, userClient, serviceClient } for a valid token", async () => {
    stubDenoEnv(ENV);
    getUserMock.mockResolvedValue({ data: { user: USER }, error: null });
    const ctx = await requireUser(fakeRequest({ authorization: "Bearer good-token" }));
    expect(ctx.user).toBe(USER);
    expect(ctx.token).toBe("good-token");
    expect(ctx.userClient).toBeDefined();
    expect(ctx.serviceClient).toBeDefined();
    expect(Object.keys(ctx).sort()).toEqual(["serviceClient", "token", "user", "userClient"]);
  });

  it("builds the user client with the anon key and the caller's bearer token forwarded as Authorization", async () => {
    stubDenoEnv(ENV);
    getUserMock.mockResolvedValue({ data: { user: USER }, error: null });
    await requireUser(fakeRequest({ authorization: "Bearer good-token" }));
    expect(createClientMock).toHaveBeenCalledWith(
      ENV.SUPABASE_URL,
      ENV.SUPABASE_ANON_KEY,
      {
        auth: { autoRefreshToken: false, persistSession: false },
        global: { headers: { Authorization: "Bearer good-token" } },
      },
    );
  });

  it("also builds a separate service-role client alongside the user client", async () => {
    stubDenoEnv(ENV);
    getUserMock.mockResolvedValue({ data: { user: USER }, error: null });
    await requireUser(fakeRequest({ authorization: "Bearer good-token" }));
    expect(createClientMock).toHaveBeenCalledWith(
      ENV.SUPABASE_URL,
      ENV.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { autoRefreshToken: false, persistSession: false } },
    );
    expect(createClientMock).toHaveBeenCalledTimes(2);
  });

  it("calls Supabase auth.getUser with the extracted bearer token", async () => {
    stubDenoEnv(ENV);
    getUserMock.mockResolvedValue({ data: { user: USER }, error: null });
    await requireUser(fakeRequest({ authorization: "Bearer  good-token  " }));
    expect(getUserMock).toHaveBeenCalledWith("good-token");
  });
});
