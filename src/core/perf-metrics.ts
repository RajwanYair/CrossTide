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
  readonly longTaskMs: number | null; // Longest main-thread task (ms)
  readonly ttfb: number | null; // Time to First Byte (ms)
  readonly domContentLoaded: number | null;
  readonly fetchCount: number;
  readonly avgFetchLatencyMs: number;
  readonly lastRenderMs: number;
  readonly traces: Readonly<Record<PerformanceTraceMetric, number>>;
}

export type PerformanceTraceMetric =
  | "startupMs"
  | "cardLoadMs"
  | "chartRenderMs"
  | "workerTransferMs"
  | "serviceWorkerUpdateMs";

export type PerformanceBudgetMetric =
  | "lcp"
  | "inp"
  | "cls"
  | "longTaskMs"
  | "routeTransitionMs"
  | "workerP95Ms"
  | "cacheHitRate"
  | "websocketRecoveryMs"
  | "memoryMb";

export interface PerformanceBudget {
  readonly metric: PerformanceBudgetMetric;
  readonly maximum: number;
  readonly unit: "ms" | "ratio" | "MB";
}

/** Shared targets consumed by Lighthouse and production health probes. */
export const PERFORMANCE_BUDGETS: readonly PerformanceBudget[] = [
  { metric: "lcp", maximum: 1_800, unit: "ms" },
  { metric: "inp", maximum: 200, unit: "ms" },
  { metric: "cls", maximum: 0.05, unit: "ratio" },
  { metric: "longTaskMs", maximum: 200, unit: "ms" },
  { metric: "routeTransitionMs", maximum: 500, unit: "ms" },
  { metric: "workerP95Ms", maximum: 300, unit: "ms" },
  { metric: "cacheHitRate", maximum: 0.8, unit: "ratio" },
  { metric: "websocketRecoveryMs", maximum: 5_000, unit: "ms" },
  { metric: "memoryMb", maximum: 128, unit: "MB" },
];

export interface PerformanceBudgetResult {
  readonly metric: PerformanceBudgetMetric;
  readonly value: number | null;
  readonly maximum: number;
  readonly status: "pass" | "fail" | "unmeasured";
}

/** Evaluate measured values without treating unavailable probes as passes. */
export function evaluatePerformanceBudgets(
  values: Partial<Record<PerformanceBudgetMetric, number | null>>,
): readonly PerformanceBudgetResult[] {
  return PERFORMANCE_BUDGETS.map((budget) => {
    const value = values[budget.metric] ?? null;
    let status: PerformanceBudgetResult["status"] = "unmeasured";
    if (value !== null) status = value <= budget.maximum ? "pass" : "fail";
    return {
      metric: budget.metric,
      value,
      maximum: budget.maximum,
      status,
    };
  });
}

let lcp: number | null = null;
let fcp: number | null = null;
let cls: number | null = null;
let inp: number | null = null;
let longTaskMs: number | null = null;
let ttfb: number | null = null;
let domContentLoaded: number | null = null;
let fetchCount = 0;
let totalFetchLatency = 0;
let lastRenderMs = 0;
const traces: Record<PerformanceTraceMetric, number> = {
  startupMs: 0,
  cardLoadMs: 0,
  chartRenderMs: 0,
  workerTransferMs: 0,
  serviceWorkerUpdateMs: 0,
};

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

/** Record the latest duration for a named application performance trace. */
export function recordPerformanceTrace(metric: PerformanceTraceMetric, durationMs: number): void {
  traces[metric] = Math.max(0, durationMs);
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
    longTaskMs,
    ttfb,
    domContentLoaded,
    fetchCount,
    avgFetchLatencyMs: fetchCount > 0 ? totalFetchLatency / fetchCount : 0,
    lastRenderMs,
    traces: { ...traces },
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
      const last = entries.at(-1);
      if (last) lcp = last.startTime;
    });
    lcpObs.observe({ type: "largest-contentful-paint", buffered: true });
    observers.push(lcpObs);
  } catch {
    // Not supported
  }

  try {
    const inpObs = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        inp = Math.max(inp ?? 0, entry.duration);
      }
    });
    inpObs.observe({ type: "event", buffered: true });
    observers.push(inpObs);
  } catch {
    // Not supported
  }

  try {
    const longTaskObs = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        longTaskMs = Math.max(longTaskMs ?? 0, entry.duration);
      }
    });
    longTaskObs.observe({ type: "longtask", buffered: true });
    observers.push(longTaskObs);
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
  for (const metric of Object.keys(traces) as PerformanceTraceMetric[]) traces[metric] = 0;
}
