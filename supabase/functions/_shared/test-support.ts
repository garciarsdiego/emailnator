// Test-only helpers shared across supabase/functions/_shared/*.test.ts files.
// Not a *.test.ts file itself, so vitest never picks it up as a spec.

export type MockResult<T = unknown> = {
  data: T | null;
  error: { message?: string; code?: string; details?: string } | null;
};

export function ok<T>(data: T): MockResult<T> {
  return { data, error: null };
}

export function fail(message: string, code?: string, details?: string): MockResult<never> {
  return { data: null, error: { message, code, details } };
}

/**
 * Builds a thenable proxy that answers any chained method call (`.select()`,
 * `.eq()`, `.maybeSingle()`, `.single()`, ...) with the same terminal result
 * when the chain is finally awaited. Good enough for query builders whose
 * exact intermediate shape the code under test doesn't care about.
 */
export function chainable(result: MockResult): unknown {
  const target = (..._args: unknown[]) => proxy;
  const proxy: unknown = new Proxy(target, {
    get(_obj, prop) {
      if (prop === "then") {
        return (resolve: (value: MockResult) => void) => resolve(result);
      }
      return (..._args: unknown[]) => proxy;
    },
    apply() {
      return proxy;
    },
  });
  return proxy;
}

export function createMockServiceClient(options: {
  rpc?: (fn: string, args: Record<string, unknown>) => Promise<MockResult> | MockResult;
  from?: (table: string) => unknown;
} = {}) {
  return {
    rpc: async (fn: string, args: Record<string, unknown>) => {
      if (!options.rpc) throw new Error(`rpc("${fn}") was not mocked`);
      return options.rpc(fn, args);
    },
    from: (table: string) => {
      if (!options.from) throw new Error(`from("${table}") was not mocked`);
      return options.from(table);
    },
  } as unknown;
}

export function stubDenoEnv(values: Record<string, string | undefined>) {
  const denoStub = {
    env: {
      get: (name: string) => values[name],
    },
  };
  Object.defineProperty(globalThis, "Deno", {
    value: denoStub,
    configurable: true,
    writable: true,
  });
  return denoStub;
}
