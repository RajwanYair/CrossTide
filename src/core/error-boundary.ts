/**
 * Error boundary — global error handler + unhandled rejection catcher.
 *
 * Captures errors and displays a fallback UI / logs them.
 */

export interface ErrorRecord {
  readonly message: string;
  readonly source: string;
  readonly timestamp: number;
  readonly stack?: string;
}

export type ErrorHandler = (record: ErrorRecord) => void;

let handler: ErrorHandler | null = null;
const errorLog: ErrorRecord[] = [];
const MAX_LOG = 100;

function record(r: ErrorRecord): void {
  errorLog.push(r);
  if (errorLog.length > MAX_LOG) errorLog.shift();
  handler?.(r);
}

function onError(event: ErrorEvent): void {
  const stack: string | undefined = event.error instanceof Error ? event.error.stack : undefined;
  const r: ErrorRecord =
    stack === undefined
      ? {
          message: event.message || "Unknown error",
          source: event.filename ?? "unknown",
          timestamp: Date.now(),
        }
      : {
          message: event.message || "Unknown error",
          source: event.filename ?? "unknown",
          timestamp: Date.now(),
          stack,
        };
  record(r);
}

function onRejection(event: PromiseRejectionEvent): void {
  const err: unknown = event.reason;
  const message = err instanceof Error ? err.message : String(err);
  const stack: string | undefined = err instanceof Error ? err.stack : undefined;
  const r: ErrorRecord =
    stack === undefined
      ? { message, source: "unhandledrejection", timestamp: Date.now() }
      : { message, source: "unhandledrejection", timestamp: Date.now(), stack };
  record(r);
}

/**
 * Install global error handlers. Call once at app startup.
 */
export function installErrorBoundary(onError_?: ErrorHandler): () => void {
  handler = onError_ ?? null;
  window.addEventListener("error", onError);
  window.addEventListener("unhandledrejection", onRejection);

  return () => {
    window.removeEventListener("error", onError);
    window.removeEventListener("unhandledrejection", onRejection);
    handler = null;
  };
}

/**
 * Get all recorded errors (most recent last).
 */
export function getErrorLog(): readonly ErrorRecord[] {
  return [...errorLog];
}

/**
 * Clear the error log.
 */
export function clearErrorLog(): void {
  errorLog.length = 0;
}
