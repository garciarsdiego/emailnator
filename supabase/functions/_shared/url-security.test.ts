import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { validatePublicUrl } from "./url-security.ts";
import { stubDenoEnv } from "./test-support.ts";

function stubResolveDns(byHost: Record<string, { A?: string[]; AAAA?: string[] }>) {
  stubDenoEnv({});
  const denoGlobal = globalThis as unknown as { Deno: { env: unknown; resolveDns?: unknown } };
  denoGlobal.Deno.resolveDns = async (host: string, type: "A" | "AAAA") => {
    const entry = byHost[host];
    if (!entry) return [];
    return (type === "A" ? entry.A : entry.AAAA) ?? [];
  };
}

describe("validatePublicUrl", () => {
  beforeEach(() => {
    stubResolveDns({ "example.com": { A: ["93.184.216.34"] } });
  });

  afterEach(() => {
    delete (globalThis as { Deno?: unknown }).Deno;
  });

  it("accepts a public https URL that resolves to a public IP", async () => {
    const url = await validatePublicUrl("https://example.com/page");
    expect(url.hostname).toBe("example.com");
  });

  it("defaults a bare host to https", async () => {
    const url = await validatePublicUrl("example.com");
    expect(url.protocol).toBe("https:");
  });

  it("rejects disallowed schemes", async () => {
    await expect(validatePublicUrl("javascript:alert(1)")).rejects.toMatchObject({
      code: "INVALID_URL_SCHEME",
    });
    await expect(validatePublicUrl("ftp://example.com/file")).rejects.toMatchObject({
      code: "INVALID_URL_SCHEME",
    });
  });

  it("rejects URLs with embedded credentials", async () => {
    await expect(validatePublicUrl("https://user:pass@example.com")).rejects.toMatchObject({
      code: "INVALID_URL",
    });
  });

  it("rejects non-standard ports", async () => {
    await expect(validatePublicUrl("https://example.com:8080")).rejects.toMatchObject({
      code: "UNSAFE_URL_PORT",
    });
  });

  it("rejects loopback and localhost literals without a DNS lookup", async () => {
    await expect(validatePublicUrl("http://127.0.0.1/")).rejects.toMatchObject({
      code: "URL_NOT_PUBLIC",
    });
    await expect(validatePublicUrl("http://localhost/")).rejects.toMatchObject({
      code: "URL_NOT_PUBLIC",
    });
  });

  it("rejects RFC1918 private IPv4 ranges", async () => {
    await expect(validatePublicUrl("http://10.0.0.5/")).rejects.toMatchObject({ code: "URL_NOT_PUBLIC" });
    await expect(validatePublicUrl("http://192.168.1.1/")).rejects.toMatchObject({ code: "URL_NOT_PUBLIC" });
    await expect(validatePublicUrl("http://172.16.0.1/")).rejects.toMatchObject({ code: "URL_NOT_PUBLIC" });
  });

  it("rejects the cloud metadata link-local address", async () => {
    await expect(validatePublicUrl("http://169.254.169.254/latest/meta-data")).rejects.toMatchObject({
      code: "URL_NOT_PUBLIC",
    });
  });

  it("rejects blocked hostname suffixes used for internal networks", async () => {
    await expect(validatePublicUrl("http://box.internal/")).rejects.toMatchObject({ code: "URL_NOT_PUBLIC" });
    await expect(validatePublicUrl("http://printer.lan/")).rejects.toMatchObject({ code: "URL_NOT_PUBLIC" });
  });

  it("blocks DNS rebinding: a public-looking hostname that resolves to a private IP", async () => {
    stubResolveDns({ "rebind.example.com": { A: ["10.1.2.3"] } });
    await expect(validatePublicUrl("https://rebind.example.com")).rejects.toMatchObject({
      code: "URL_NOT_PUBLIC",
    });
  });

  it("fails closed when DNS resolution errors out", async () => {
    stubDenoEnv({});
    const denoGlobal = globalThis as unknown as { Deno: { resolveDns?: unknown } };
    denoGlobal.Deno.resolveDns = async () => {
      throw new Error("DNS server unreachable");
    };
    await expect(validatePublicUrl("https://unresolvable.example.com")).rejects.toMatchObject({
      code: "DNS_RESOLUTION_FAILED",
    });
  });

  it("fails closed when the hostname has no DNS records at all", async () => {
    stubResolveDns({});
    await expect(validatePublicUrl("https://nowhere.example.com")).rejects.toMatchObject({
      code: "DNS_RESOLUTION_FAILED",
    });
  });
});
