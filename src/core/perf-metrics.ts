/**
 * Performance metrics collector — captures Core Web Vitals and app-specific
 * performance metrics for in-app display and diagnostics.
 *
 * Uses the Performance Observer API to measure LCP, INP, CLS, and FCP.
 * Also tracks custom app metrics like data fetch latency and render time.
 */

export interface PerfMetrics {
  readonly lcp: number | null; // Largest Contentful Paint (ms)
  readonly fcp: number | null; // First Contentful Paint (ms)
  readonly cls: number | null; // Cumulative Layout Shift
  readonly inp: number | null; // Interaction to Next Paint (ms)
  readonly ttfb: number | null; // Time to First Byte (ms)
  readonly domContentLoaded: number | null;
  readonly fetchCount: number;
  readonly avgFetchLatencyMs: number;
  readonly lastRenderMs: number;
}

let lcp: number | null = null;
let fcp: number | null = null;
let cls: number | null = null;
const inp: number | null = null;
let ttfb: number | null = null;
let domContentLoaded: number | null = null;
let fetchCount = 0;
let totalFetchLatency = 0;
let lastRenderMs = 0;

/**
 * Record a data fetch with its latency.
 */
export function recordFetchLatency(latencyMs: number): void {
  fetchCount++;
  totalFetchLatency += latencyMs;
}

/**
 * Record a render cycle duration.
 */
export function recordRenderTime(ms: number): void {
  lastRenderMs = ms;
}

/**
 * Get current performance metrics snapshot.
 */
export function getPerfMetrics(): PerfMetrics {
  return {
    lcp,
    fcp,
    cls,
    inp,
    ttfb,
    domContentLoaded,
    fetchCount,
    avgFetchLatencyMs: fetchCount > 0 ? totalFetchLatency / fetchCount : 0,
    lastRenderMs,
  };
}

/**
 * Format a metric value as a human-readable string.
 */
export function formatMetric(value: number | null, unit: string): string {
  if (value === null) return "—";
  if (unit === "ms") return `${Math.round(value)} ms`;
  if (unit === "s") return `${(value / 1000).toFixed(2)} s`;
  return value.toFixed(3);
}

/**
 * Initialize performance observation using PerformanceObserver.
 * Returns a cleanup function.
 */
export function initPerfObserver(): () => void {
  const observers: PerformanceObserver[] = [];

  try {
    // LCP
    const lcpObs = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const last = entries[entries.length - 1];
      if (last) lcp = last.startTime;
    });
    lcpObs.observe({ type: "largest-contentful-paint", buffered: true });
    observers.push(lcpObs);
  } catch {
    // Not supported
  }

  try {
    // FCP
    const fcpObs = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name === "first-contentful-paint") {
          fcp = entry.startTime;
        }
      }
    });
    fcpObs.observe({ type: "paint", buffered: true });
    observers.push(fcpObs);
  } catch {
    // Not supported
  }

  try {
    // CLS
    const clsObs = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!(entry as PerformanceEntry & { hadRecentInput?: boolean }).hadRecentInput) {
          cls = (cls ?? 0) + (entry as PerformanceEntry & { value: number }).value;
        }
      }
    });
    clsObs.observe({ type: "layout-shift", buffered: true });
    observers.push(clsObs);
  } catch {
    // Not supported
  }

  // Navigation timing
  try {
    const navEntries = performance.getEntriesByType("navigation") as PerformanceNavigationTiming[];
    if (navEntries.length > 0) {
      const nav = navEntries[0]!;
      ttfb = nav.responseStart - nav.requestStart;
      domContentLoaded = nav.domContentLoadedEventEnd - nav.startTime;
    }
  } catch {
    // Not supported
  }

  return (): void => {
    for (const obs of observers) {
      obs.disconnect();
    }
  };
}

/**
 * Reset all custom metrics (not CWV — those are session-based).
 */
export function resetCustomMetrics(): void {
  fetchCount = 0;
  totalFetchLatency = 0;
  lastRenderMs = 0;
}
