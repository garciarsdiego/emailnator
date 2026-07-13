type LogDetails = Record<string, unknown>;

function safeDetails(details: LogDetails): LogDetails {
  return Object.fromEntries(
    Object.entries(details).filter(([key]) =>
      !/token|authorization|email|content|prompt|payload|secret|key/i.test(key)
    ),
  );
}

export function logInfo(event: string, details: LogDetails = {}): void {
  console.log(JSON.stringify({ level: "info", event, ...safeDetails(details) }));
}

export function logWarn(event: string, details: LogDetails = {}): void {
  console.warn(JSON.stringify({ level: "warn", event, ...safeDetails(details) }));
}

export function logError(event: string, error: unknown, details: LogDetails = {}): void {
  const message = (error instanceof Error ? error.message : "Unknown error")
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[redacted-email]")
    .replace(/\b(?:sk|rk|whsec)_[A-Za-z0-9_]+\b/g, "[redacted-secret]")
    .replace(/\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g, "[redacted-token]")
    .slice(0, 300);
  console.error(JSON.stringify({
    level: "error",
    event,
    errorType: error instanceof Error ? error.name : typeof error,
    errorMessage: message,
    ...safeDetails(details),
  }));
}
