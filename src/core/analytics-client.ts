/**
 * Cookieless analytics client — Plausible/Umami-compatible event reporter.
 *
 * No cookies. No PII. Sends `pageview` and named custom events to a
 * configured endpoint via `sendBeacon` (with `fetch` fallback).
 *
 * Designed to be lazy-imported to keep the initial bundle small.
 */

export interface AnalyticsConfig {
  readonly endpoint: string;
  readonly site: string;
  /** Skip emission entirely (e.g. in dev). */
  readonly disabled?: boolean;
  /** Override the source used for transport (tests). */
  readonly send?: (url: string, body: string) => void;
}

export interface AnalyticsClient {
  pageview(path?: string): void;
  event(name: string, props?: Readonly<Record<string, string | number | boolean>>): void;
  setEnabled(enabled: boolean): void;
}

function defaultSend(url: string, body: string): void {
  const nav = typeof navigator !== "undefined" ? navigator : undefined;
  if (nav && typeof nav.sendBeacon === "function") {
    try {
      const blob = new Blob([body], { type: "application/json" });
      if (nav.sendBeacon(url, blob)) return;
    } catch {
      /* fall through */
    }
  }
  if (typeof fetch === "function") {
    void fetch(url, {
      method: "POST",
      body,
      keepalive: true,
      headers: { "content-type": "application/json" },
    }).catch(() => undefined);
  }
}

export function createAnalyticsClient(config: AnalyticsConfig): AnalyticsClient {
  let enabled = !config.disabled;
  const send = config.send ?? defaultSend;

  function emit(payload: Record<string, unknown>): void {
    if (!enabled) return;
    send(config.endpoint, JSON.stringify(payload));
  }

  function currentPath(): string {
    if (typeof window === "undefined" || !window.location) return "/";
    return window.location.pathname + window.location.search + window.location.hash;
  }

  return {
    pageview(path?: string): void {
      emit({
        site: config.site,
        name: "pageview",
        url: path ?? currentPath(),
        ts: Date.now(),
      });
    },
    event(name: string, props?: Readonly<Record<string, string | number | boolean>>): void {
      emit({
        site: config.site,
        name,
        url: currentPath(),
        props: props ?? {},
        ts: Date.now(),
      });
    },
    setEnabled(value: boolean): void {
      enabled = value;
    },
  };
}
