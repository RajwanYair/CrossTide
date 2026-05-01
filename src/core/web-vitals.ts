/**
 * Web Vitals reporter — minimal client-side measurement of LCP, CLS, INP, FCP, TTFB.
 *
 * No external dependency; uses native `PerformanceObserver`. Falls back to
 * a no-op when the API is unavailable (SSR/older browsers).
 */

export type VitalName = "LCP" | "CLS" | "INP" | "FCP" | "TTFB";

export interface VitalReport {
  readonly name: VitalName;
  readonly value: number;
  readonly id: string;
  readonly timestamp: number;
}

export type VitalHandler = (report: VitalReport) => void;

interface MaybeLayoutShift extends PerformanceEntry {
  hadRecentInput?: boolean;
  value?: number;
}

interface MaybePaintEntry extends PerformanceEntry {
  startTime: number;
}

interface MaybeNavTiming extends PerformanceEntry {
  responseStart: number;
}

interface MaybeEventTiming extends PerformanceEntry {
  duration: number;
  interactionId?: number;
}

let counter = 0;
function makeId(prefix: VitalName): string {
  counter = (counter + 1) % Number.MAX_SAFE_INTEGER;
  return `${prefix}-${Date.now().toString(36)}-${counter.toString(36)}`;
}

function safeObserve(
  type: string,
  cb: (entry: PerformanceEntry) => void,
  buffered = true,
): PerformanceObserver | null {
  if (typeof PerformanceObserver === "undefined") return null;
  try {
    const po = new PerformanceObserver((list) => {
      for (const e of list.getEntries()) cb(e);
    });
    po.observe({ type, buffered });
    return po;
  } catch {
    return null;
  }
}

export interface VitalsObserver {
  stop(): void;
}

export function observeWebVitals(handler: VitalHandler): VitalsObserver {
  const observers: PerformanceObserver[] = [];

  // LCP — keep largest
  let lcpValue = 0;
  const lcpObs = safeObserve("largest-contentful-paint", (e) => {
    const entry = e as MaybePaintEntry;
    if (entry.startTime > lcpValue) {
      lcpValue = entry.startTime;
      handler({
        name: "LCP",
        value: lcpValue,
        id: makeId("LCP"),
        timestamp: Date.now(),
      });
    }
  });
  if (lcpObs) observers.push(lcpObs);

  // CLS — sum
  let clsValue = 0;
  const clsObs = safeObserve("layout-shift", (e) => {
    const ls = e as MaybeLayoutShift;
    if (ls.hadRecentInput) return;
    clsValue += ls.value ?? 0;
    handler({
      name: "CLS",
      value: clsValue,
      id: makeId("CLS"),
      timestamp: Date.now(),
    });
  });
  if (clsObs) observers.push(clsObs);

  // FCP
  const fcpObs = safeObserve("paint", (e) => {
    if (e.name !== "first-contentful-paint") return;
    handler({
      name: "FCP",
      value: (e as MaybePaintEntry).startTime,
      id: makeId("FCP"),
      timestamp: Date.now(),
    });
  });
  if (fcpObs) observers.push(fcpObs);

  // TTFB from navigation timing
  const navObs = safeObserve("navigation", (e) => {
    const nav = e as MaybeNavTiming;
    handler({
      name: "TTFB",
      value: nav.responseStart,
      id: makeId("TTFB"),
      timestamp: Date.now(),
    });
  });
  if (navObs) observers.push(navObs);

  // INP — track max event duration as proxy
  let inpValue = 0;
  const inpObs = safeObserve("event", (e) => {
    const ev = e as MaybeEventTiming;
    if (ev.duration > inpValue) {
      inpValue = ev.duration;
      handler({
        name: "INP",
        value: inpValue,
        id: makeId("INP"),
        timestamp: Date.now(),
      });
    }
  });
  if (inpObs) observers.push(inpObs);

  return {
    stop(): void {
      for (const o of observers) {
        try {
          o.disconnect();
        } catch {
          /* ignore */
        }
      }
    },
  };
}

/**
 * Build a fire-and-forget reporter that POSTs vitals to a URL using `sendBeacon`
 * when available, falling back to `fetch`.
 */
export function makeBeaconReporter(url: string): VitalHandler {
  return (report) => {
    const body = JSON.stringify(report);
    const nav = typeof navigator !== "undefined" ? navigator : undefined;
    if (nav && typeof nav.sendBeacon === "function") {
      try {
        nav.sendBeacon(url, body);
        return;
      } catch {
        /* fallback below */
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
  };
}
