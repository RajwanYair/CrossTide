/**
 * Telemetry façade — wires Plausible analytics, GlitchTip error tracking,
 * and Web Vitals reporting together from a single call site.
 *
 * All sinks are **env-gated**: nothing is sent unless the corresponding
 * `VITE_*` environment variable is defined at build time.
 *
 *   VITE_PLAUSIBLE_URL   — base URL of your Plausible instance, e.g. https://plausible.io
 *   VITE_PLAUSIBLE_SITE  — domain registered in Plausible, e.g. crosstide.dev
 *   VITE_GLITCHTIP_DSN   — GlitchTip / Sentry-compatible DSN for error reporting
 *
 * Usage (call once in main.ts):
 *   import { initTelemetry } from "./core/telemetry";
 *   initTelemetry();
 */

import { createAnalyticsClient, type AnalyticsClient } from "./analytics-client";
import { installErrorBoundary, type ErrorRecord } from "./error-boundary";
import { observeWebVitals, type VitalReport } from "./web-vitals";

// ── Read env vars (replaced at build time by Vite define) ──────────────────
// Using string fallback "" to keep the code path safe when vars are absent.
declare const __PLAUSIBLE_URL__: string;
declare const __PLAUSIBLE_SITE__: string;
declare const __GLITCHTIP_DSN__: string;

const plausibleUrl: string = typeof __PLAUSIBLE_URL__ !== "undefined" ? __PLAUSIBLE_URL__ : "";
const plausibleSite: string = typeof __PLAUSIBLE_SITE__ !== "undefined" ? __PLAUSIBLE_SITE__ : "";
const glitchtipDsn: string = typeof __GLITCHTIP_DSN__ !== "undefined" ? __GLITCHTIP_DSN__ : "";

export interface TelemetryHandle {
  /** Log a named analytics event. */
  event(name: string, props?: Readonly<Record<string, string | number | boolean>>): void;
  /** Log a page navigation. */
  pageview(path?: string): void;
  /** Disable / enable event emission at runtime. */
  setEnabled(enabled: boolean): void;
  /** Tear down observers (error handlers, vitals). */
  destroy(): void;
}

/**
 * Sends a sampled error to GlitchTip via the Sentry-envelope API.
 * Sampling rate is 25% to keep free-tier quotas comfortable.
 */
function reportToGlitchTip(dsn: string, record: ErrorRecord): void {
  if (Math.random() > 0.25) return; // 25% sample rate

  // Parse DSN: {scheme}://{key}@{host}/{project}
  const match = /^https?:\/\/([^@]+)@([^/]+)\/(.+)$/.exec(dsn);
  if (!match) return;
  const [, publicKey, host, projectId] = match;
  if (!publicKey || !host || !projectId) return;

  const envelope = [
    JSON.stringify({
      sent_at: new Date().toISOString(),
      dsn,
    }),
    JSON.stringify({ type: "event" }),
    JSON.stringify({
      event_id: crypto.randomUUID(),
      timestamp: record.timestamp / 1000,
      platform: "javascript",
      level: "error",
      message: record.message,
      culprit: record.source,
      ...(record.stack !== undefined && {
        exception: {
          values: [
            {
              type: "Error",
              value: record.message,
              stacktrace: { frames: parseStackTrace(record.stack) },
            },
          ],
        },
      }),
    }),
  ].join("\n");

  const url = `https://${host}/api/${projectId}/envelope/?sentry_key=${publicKey}&sentry_version=7`;

  try {
    if (typeof navigator !== "undefined" && navigator.sendBeacon) {
      navigator.sendBeacon(url, new Blob([envelope], { type: "application/x-sentry-envelope" }));
    } else if (typeof fetch !== "undefined") {
      void fetch(url, {
        method: "POST",
        body: envelope,
        headers: { "content-type": "application/x-sentry-envelope" },
        keepalive: true,
      }).catch(() => undefined);
    }
  } catch {
    /* never propagate telemetry errors */
  }
}

/** Very minimal stack trace parser — extracts frame locations for GlitchTip. */
function parseStackTrace(stack: string): Array<{ filename: string; lineno: number }> {
  return stack
    .split("\n")
    .slice(1, 10) // limit to 10 frames
    .map((line) => {
      const m = /(https?:\/\/[^:]+):(\d+)/.exec(line);
      return m
        ? { filename: m[1] ?? "unknown", lineno: Number(m[2] ?? "0") }
        : { filename: "unknown", lineno: 0 };
    });
}

let _handle: TelemetryHandle | null = null;

/**
 * Initialise telemetry (analytics + errors + vitals).
 *
 * Idempotent — safe to call multiple times; only the first call is active.
 * Returns a handle to manually emit events or tear down.
 */
export function initTelemetry(): TelemetryHandle {
  if (_handle) return _handle;

  const hasAnalytics = plausibleUrl !== "" && plausibleSite !== "";
  const hasErrorTracking = glitchtipDsn !== "";

  // If neither sink is configured, return a no-op handle
  if (!hasAnalytics && !hasErrorTracking) {
    _handle = {
      event: (): undefined => undefined,
      pageview: (): undefined => undefined,
      setEnabled: (): undefined => undefined,
      destroy(): void {
        _handle = null;
      },
    };
    return _handle;
  }

  // ── Analytics (Plausible) ─────────────────────────────────────────────────
  let analytics: AnalyticsClient | null = null;
  if (hasAnalytics) {
    analytics = createAnalyticsClient({
      endpoint: `${plausibleUrl}/api/event`,
      site: plausibleSite,
    });
  }

  // ── Error boundary (GlitchTip) ────────────────────────────────────────────
  let teardownErrors: (() => void) | null = null;
  if (hasErrorTracking) {
    teardownErrors = installErrorBoundary((record) => {
      reportToGlitchTip(glitchtipDsn, record);
      // Also send as an analytics event (error name only, no PII)
      analytics?.event("js_error", { source: record.source.slice(-60) });
    });
  } else {
    // Install error boundary without a custom handler (still logs locally)
    teardownErrors = installErrorBoundary();
  }

  // ── Web Vitals → Analytics ─────────────────────────────────────────────────
  let vitalsObserver: ReturnType<typeof observeWebVitals> | null = null;
  if (analytics) {
    vitalsObserver = observeWebVitals((report: VitalReport) => {
      analytics?.event("web_vital", {
        name: report.name,
        value: Math.round(report.value),
      });
    });
  }

  _handle = {
    event(name, props): void {
      analytics?.event(name, props);
    },
    pageview(path): void {
      analytics?.pageview(path);
    },
    setEnabled(enabled): void {
      analytics?.setEnabled(enabled);
    },
    destroy(): void {
      teardownErrors?.();
      vitalsObserver?.stop();
      _handle = null;
    },
  };

  return _handle;
}

/**
 * Returns the current active telemetry handle, or null if not yet initialised.
 */
export function getTelemetry(): TelemetryHandle | null {
  return _handle;
}

/** Reset singleton — only for tests. */
export function _resetTelemetryForTests(): void {
  _handle = null;
}

/** Exposed for unit testing only. */
export { parseStackTrace as _parseStackTraceForTests, reportToGlitchTip as _reportToGlitchTipForTests };
