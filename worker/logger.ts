/**
 * Structured Logger — JSON-formatted logs for Cloudflare Workers.
 *
 * Emits structured log lines that are parseable by log aggregators
 * (Logflare, Datadog, Loki, etc.). Each log includes:
 * - timestamp (ISO 8601)
 * - level (debug, info, warn, error)
 * - message
 * - requestId (correlation ID)
 * - route, method, latencyMs (for request logs)
 * - provider (for upstream calls)
 * - Additional arbitrary fields
 */

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  msg: string;
  requestId?: string;
  route?: string;
  method?: string;
  status?: number;
  latencyMs?: number;
  provider?: string;
  [key: string]: unknown;
}

export interface Logger {
  debug(msg: string, fields?: Record<string, unknown>): void;
  info(msg: string, fields?: Record<string, unknown>): void;
  warn(msg: string, fields?: Record<string, unknown>): void;
  error(msg: string, fields?: Record<string, unknown>): void;
  /** Create a child logger with additional default fields. */
  child(fields: Record<string, unknown>): Logger;
}

const LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

/**
 * Create a structured logger instance.
 *
 * @param defaults - Fields included in every log entry (e.g. requestId, route).
 * @param minLevel - Minimum log level to emit. Defaults to "info".
 */
export function createLogger(
  defaults: Record<string, unknown> = {},
  minLevel: LogLevel = "info",
): Logger {
  function emit(level: LogLevel, msg: string, fields?: Record<string, unknown>): void {
    if (LEVEL_ORDER[level] < LEVEL_ORDER[minLevel]) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      msg,
      ...defaults,
      ...fields,
    };

    const line = JSON.stringify(entry);

    switch (level) {
      case "error":
        console.error(line);
        break;
      case "warn":
        console.warn(line);
        break;
      case "debug":
        console.debug(line);
        break;
      default:
        console.log(line);
    }
  }

  const logger: Logger = {
    debug: (msg, fields) => emit("debug", msg, fields),
    info: (msg, fields) => emit("info", msg, fields),
    warn: (msg, fields) => emit("warn", msg, fields),
    error: (msg, fields) => emit("error", msg, fields),
    child: (fields) => createLogger({ ...defaults, ...fields }, minLevel),
  };

  return logger;
}

/**
 * Measure latency of an async operation and log it.
 */
export async function withTiming<T>(
  logger: Logger,
  msg: string,
  fn: () => Promise<T>,
  fields?: Record<string, unknown>,
): Promise<T> {
  const start = Date.now();
  try {
    const result = await fn();
    logger.info(msg, { ...fields, latencyMs: Date.now() - start });
    return result;
  } catch (err) {
    logger.error(msg, {
      ...fields,
      latencyMs: Date.now() - start,
      error: err instanceof Error ? err.message : String(err),
    });
    throw err;
  }
}
