/**
 * Structured request logger (F4) — produces JSON log lines for
 * Cloudflare Logpush → R2 ingestion.
 *
 * Each log entry contains: timestamp, method, path, status, duration,
 * IP hash, user-agent, content-length, ray-id, and optional error.
 *
 * Usage (Hono middleware):
 *   app.use("*", async (c, next) => {
 *     const entry = startLogEntry(c.req.raw);
 *     await next();
 *     console.log(JSON.stringify(finalizeLogEntry(entry, c.res)));
 *   });
 */

// ── Types ────────────────────────────────────────────────────────────────

export interface LogEntry {
  readonly timestamp: string;
  readonly method: string;
  readonly path: string;
  readonly query: string;
  readonly status: number;
  readonly durationMs: number;
  readonly ip: string;
  readonly userAgent: string;
  readonly contentLength: number | null;
  readonly rayId: string | null;
  readonly error: string | null;
  readonly level: LogLevel;
}

export type LogLevel = "info" | "warn" | "error";

export interface PendingLogEntry {
  readonly startedAt: number;
  readonly method: string;
  readonly path: string;
  readonly query: string;
  readonly ip: string;
  readonly userAgent: string;
  readonly rayId: string | null;
}

// ── IP hashing ───────────────────────────────────────────────────────────

/**
 * Hash an IP address for privacy-safe logging (DJB2 variant).
 * Returns a hex string — not reversible to the original IP.
 */
export function hashIp(ip: string): string {
  let hash = 5381;
  for (let i = 0; i < ip.length; i++) {
    hash = ((hash << 5) + hash + ip.charCodeAt(i)) | 0;
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

// ── Log entry lifecycle ──────────────────────────────────────────────────

/**
 * Start a log entry from an incoming request.
 * Call `finalizeLogEntry()` after the response is available.
 */
export function startLogEntry(request: {
  method: string;
  url: string;
  headers: { get(name: string): string | null };
}): PendingLogEntry {
  const url = new URL(request.url, "http://localhost");
  const ip =
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown";

  return {
    startedAt: Date.now(),
    method: request.method,
    path: url.pathname,
    query: url.search,
    ip: hashIp(ip),
    userAgent: request.headers.get("user-agent") ?? "",
    rayId: request.headers.get("cf-ray") ?? null,
  };
}

/**
 * Finalize a pending log entry with response information.
 */
export function finalizeLogEntry(
  pending: PendingLogEntry,
  response: { status: number; headers: { get(name: string): string | null } },
  error?: string,
): LogEntry {
  const durationMs = Date.now() - pending.startedAt;
  const clHeader = response.headers.get("content-length");
  const contentLength = clHeader !== null ? parseInt(clHeader, 10) : null;
  const status = response.status;

  let level: LogLevel = "info";
  if (status >= 500 || error) level = "error";
  else if (status >= 400) level = "warn";

  return {
    timestamp: new Date(pending.startedAt).toISOString(),
    method: pending.method,
    path: pending.path,
    query: pending.query,
    status,
    durationMs,
    ip: pending.ip,
    userAgent: pending.userAgent,
    contentLength: Number.isFinite(contentLength) ? contentLength : null,
    rayId: pending.rayId,
    error: error ?? null,
    level,
  };
}

/**
 * Format a log entry as a single-line JSON string.
 */
export function formatLogLine(entry: LogEntry): string {
  return JSON.stringify(entry);
}

/**
 * Determine the log level for a given HTTP status code.
 */
export function statusToLevel(status: number): LogLevel {
  if (status >= 500) return "error";
  if (status >= 400) return "warn";
  return "info";
}
