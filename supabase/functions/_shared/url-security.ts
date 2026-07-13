import { AppError } from "./errors.ts";

const BLOCKED_HOST_SUFFIXES = [
  ".localhost", ".local", ".internal", ".home", ".lan", ".test", ".invalid",
];
const BLOCKED_HOSTS = new Set([
  "localhost",
  "metadata.google.internal",
  "metadata.azure.internal",
  "instance-data.ec2.internal",
]);

function ipv4Parts(value: string): number[] | null {
  const match = value.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!match) return null;
  const parts = match.slice(1).map(Number);
  return parts.every((part) => part >= 0 && part <= 255) ? parts : null;
}

function privateIpv4(value: string): boolean {
  const parts = ipv4Parts(value);
  if (!parts) return false;
  const [a, b, c] = parts;
  return a === 0
    || a === 10
    || a === 127
    || (a === 100 && b >= 64 && b <= 127)
    || (a === 169 && b === 254)
    || (a === 172 && b >= 16 && b <= 31)
    || (a === 192 && b === 0 && c === 0)
    || (a === 192 && b === 0 && c === 2)
    || (a === 192 && b === 168)
    || (a === 198 && (b === 18 || b === 19))
    || (a === 198 && b === 51 && c === 100)
    || (a === 203 && b === 0 && c === 113)
    || a >= 224;
}

function privateIpv6(value: string): boolean {
  const normalized = value.toLowerCase().replace(/^\[|\]$/g, "");
  if (!normalized.includes(":")) return false;
  if (normalized === "::" || normalized === "::1") return true;
  if (/^(fc|fd)/.test(normalized)) return true;
  if (/^fe[89ab]/.test(normalized)) return true;
  if (/^ff/.test(normalized)) return true;
  if (normalized.startsWith("2001:db8:")) return true;
  const mapped = normalized.match(/(?:^|:)(\d+\.\d+\.\d+\.\d+)$/);
  return mapped ? privateIpv4(mapped[1]) : false;
}

function privateAddress(value: string): boolean {
  return privateIpv4(value) || privateIpv6(value);
}

async function assertPublicHost(hostname: string): Promise<void> {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, "").replace(/\.$/, "");
  if (
    !host
    || BLOCKED_HOSTS.has(host)
    || BLOCKED_HOST_SUFFIXES.some((suffix) => host.endsWith(suffix))
    || privateAddress(host)
  ) {
    throw new AppError("URL_NOT_PUBLIC", 400, "The URL must resolve to a public internet host");
  }

  // DNS checks prevent standard private-network and cloud metadata SSRF. Every
  // redirect is validated again before it is followed.
  if (!ipv4Parts(host) && !host.includes(":")) {
    let addresses: string[] = [];
    try {
      const [ipv4, ipv6] = await Promise.all([
        Deno.resolveDns(host, "A").catch(() => [] as string[]),
        Deno.resolveDns(host, "AAAA").catch(() => [] as string[]),
      ]);
      addresses = [...ipv4, ...ipv6];
    } catch {
      throw new AppError("DNS_RESOLUTION_FAILED", 400, "The site hostname could not be resolved");
    }
    if (!addresses.length) {
      throw new AppError("DNS_RESOLUTION_FAILED", 400, "The site hostname could not be resolved");
    }
    if (addresses.some(privateAddress)) {
      throw new AppError("URL_NOT_PUBLIC", 400, "The URL resolves to a private or reserved network");
    }
  }
}

export async function validatePublicUrl(raw: string): Promise<URL> {
  const candidate = /^[a-z][a-z0-9+.-]*:/i.test(raw) ? raw : `https://${raw}`;
  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    throw new AppError("INVALID_URL", 400, "Informe uma URL válida");
  }
  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new AppError("INVALID_URL_SCHEME", 400, "Only HTTP and HTTPS URLs are supported");
  }
  if (url.username || url.password) {
    throw new AppError("INVALID_URL", 400, "URLs with embedded credentials are not supported");
  }
  if (url.port && !['80', '443'].includes(url.port)) {
    throw new AppError("UNSAFE_URL_PORT", 400, "Only standard HTTP and HTTPS ports are supported");
  }
  url.hash = "";
  await assertPublicHost(url.hostname);
  return url;
}

export async function fetchPublicText(
  initialUrl: URL,
  options: { timeoutMs?: number; maxBytes?: number; maxRedirects?: number } = {},
): Promise<{ url: URL; text: string; contentType: string }> {
  const timeoutMs = options.timeoutMs ?? 12_000;
  const maxBytes = options.maxBytes ?? 750_000;
  const maxRedirects = options.maxRedirects ?? 3;
  let current = initialUrl;

  for (let redirect = 0; redirect <= maxRedirects; redirect += 1) {
    await assertPublicHost(current.hostname);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    let response: Response;
    try {
      response = await fetch(current, {
        method: "GET",
        redirect: "manual",
        signal: controller.signal,
        headers: {
          Accept: "text/html,text/plain;q=0.9",
          "User-Agent": "EmailMuseSiteAnalyzer/2.0",
        },
      });
    } catch (error) {
      clearTimeout(timeout);
      if (error instanceof DOMException && error.name === "AbortError") {
        throw new AppError("SITE_FETCH_TIMEOUT", 504, "O site demorou demais para responder");
      }
      throw new AppError("SITE_FETCH_FAILED", 502, "Não foi possível acessar o site informado");
    }

    try {
      if ([301, 302, 303, 307, 308].includes(response.status)) {
        if (redirect === maxRedirects) {
          throw new AppError("TOO_MANY_REDIRECTS", 400, "The site redirected too many times");
        }
        const location = response.headers.get("location");
        if (!location) throw new AppError("INVALID_REDIRECT", 502, "The site returned an invalid redirect");
        let redirected: URL;
        try {
          redirected = new URL(location, current);
        } catch {
          throw new AppError("INVALID_REDIRECT", 502, "The site returned an invalid redirect URL");
        }
        current = await validatePublicUrl(redirected.toString());
        continue;
      }

      if (!response.ok) {
        throw new AppError("SITE_FETCH_FAILED", 502, `The site responded with HTTP ${response.status}`);
      }
      const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
      if (!contentType.includes("text/html") && !contentType.includes("text/plain")) {
        throw new AppError("UNSUPPORTED_SITE_CONTENT", 415, "The URL must return HTML or plain text");
      }
      const contentLength = Number(response.headers.get("content-length") ?? 0);
      if (contentLength > maxBytes) {
        throw new AppError("SITE_RESPONSE_TOO_LARGE", 413, "The site response is too large to analyze");
      }
      if (!response.body) return { url: current, text: "", contentType };

      const reader = response.body.getReader();
      const chunks: Uint8Array[] = [];
      let total = 0;
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        total += value.byteLength;
        if (total > maxBytes) {
          await reader.cancel();
          throw new AppError("SITE_RESPONSE_TOO_LARGE", 413, "The site response is too large to analyze");
        }
        chunks.push(value);
      }
      const merged = new Uint8Array(total);
      let offset = 0;
      for (const chunk of chunks) {
        merged.set(chunk, offset);
        offset += chunk.byteLength;
      }
      return { url: current, text: new TextDecoder().decode(merged), contentType };
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        throw new AppError("SITE_FETCH_TIMEOUT", 504, "O site demorou demais para responder");
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  throw new AppError("SITE_FETCH_FAILED", 502, "Unable to fetch the site");
}
