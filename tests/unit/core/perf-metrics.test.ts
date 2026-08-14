import { describe, it, expect, beforeEach, vi } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

beforeEach(() => {
  vi.resetModules();
});

describe("perf-metrics", () => {
  async function loadModule() {
    return import("../../../src/core/perf-metrics");
  }

  it("starts with null CWV metrics", async () => {
    const { getPerfMetrics } = await loadModule();
    const m = getPerfMetrics();
    expect(m.lcp).toBeNull();
    expect(m.fcp).toBeNull();
    expect(m.cls).toBeNull();
    expect(m.inp).toBeNull();
  });

  it("starts with zero custom metrics", async () => {
    const { getPerfMetrics } = await loadModule();
    const m = getPerfMetrics();
    expect(m.fetchCount).toBe(0);
    expect(m.avgFetchLatencyMs).toBe(0);
    expect(m.lastRenderMs).toBe(0);
  });

  it("recordFetchLatency updates count and average", async () => {
    const { recordFetchLatency, getPerfMetrics } = await loadModule();
    recordFetchLatency(100);
    recordFetchLatency(200);
    recordFetchLatency(300);
    const m = getPerfMetrics();
    expect(m.fetchCount).toBe(3);
    expect(m.avgFetchLatencyMs).toBe(200);
  });

  it("recordRenderTime updates lastRenderMs", async () => {
    const { recordRenderTime, getPerfMetrics } = await loadModule();
    recordRenderTime(16);
    expect(getPerfMetrics().lastRenderMs).toBe(16);
    recordRenderTime(8);
    expect(getPerfMetrics().lastRenderMs).toBe(8);
  });

  it("records named application performance traces", async () => {
    const { recordPerformanceTrace, getPerfMetrics, resetCustomMetrics } = await loadModule();
    recordPerformanceTrace("cardLoadMs", 42);
    recordPerformanceTrace("workerTransferMs", -1);
    expect(getPerfMetrics().traces).toMatchObject({ cardLoadMs: 42, workerTransferMs: 0 });
    resetCustomMetrics();
    expect(getPerfMetrics().traces.cardLoadMs).toBe(0);
  });

  it("calculates worker transfer p95 from bounded samples", async () => {
    const { recordPerformanceTrace, getPerfMetrics, resetCustomMetrics } = await loadModule();
    for (const duration of [10, 30, 20, 40, 50, 60, 70, 80, 90, 100]) {
      recordPerformanceTrace("workerTransferMs", duration);
    }
    expect(getPerfMetrics().workerP95Ms).toBe(100);
    resetCustomMetrics();
    expect(getPerfMetrics().workerP95Ms).toBeNull();
  });

  it("formatMetric formats ms values", async () => {
    const { formatMetric } = await loadModule();
    expect(formatMetric(1234, "ms")).toBe("1234 ms");
    expect(formatMetric(null, "ms")).toBe("—");
  });

  it("formatMetric formats seconds", async () => {
    const { formatMetric } = await loadModule();
    expect(formatMetric(1500, "s")).toBe("1.50 s");
  });

  it("formatMetric formats CLS-like values", async () => {
    const { formatMetric } = await loadModule();
    expect(formatMetric(0.025, "")).toBe("0.025");
  });

  it("resetCustomMetrics clears fetch and render metrics", async () => {
    const { recordFetchLatency, recordRenderTime, resetCustomMetrics, getPerfMetrics } =
      await loadModule();
    recordFetchLatency(100);
    recordRenderTime(16);
    resetCustomMetrics();
    const m = getPerfMetrics();
    expect(m.fetchCount).toBe(0);
    expect(m.lastRenderMs).toBe(0);
  });

  it("initPerfObserver returns a cleanup function", async () => {
    const { initPerfObserver } = await loadModule();
    // In happy-dom PerformanceObserver may not be full-featured
    // but the function should not throw
    const cleanup = initPerfObserver();
    expect(typeof cleanup).toBe("function");
    cleanup(); // should not throw
  });

  it("records INP and the longest long task from observer entries", async () => {
    type ObserverCallback = (list: { getEntries: () => PerformanceEntry[] }) => void;
    const observers: Array<{ type: string; callback: ObserverCallback }> = [];
    class MockPerformanceObserver {
      private readonly callback: ObserverCallback;

      constructor(callback: ObserverCallback) {
        this.callback = callback;
      }

      observe(options: { type: string }): void {
        observers.push({ type: options.type, callback: this.callback });
      }

      disconnect(): void {}
    }

    vi.stubGlobal("PerformanceObserver", MockPerformanceObserver);
    const { initPerfObserver, getPerfMetrics } = await loadModule();
    const cleanup = initPerfObserver();
    observers
      .find((observer) => observer.type === "event")
      ?.callback({ getEntries: () => [{ duration: 140 } as PerformanceEntry] });
    observers
      .find((observer) => observer.type === "longtask")
      ?.callback({ getEntries: () => [{ duration: 280 } as PerformanceEntry] });

    expect(getPerfMetrics()).toMatchObject({ inp: 140, longTaskMs: 280 });
    cleanup();
    vi.unstubAllGlobals();
  });

  it("evaluates shared budgets and leaves missing probes unmeasured", async () => {
    const { evaluatePerformanceBudgets } = await loadModule();
    const results = evaluatePerformanceBudgets({ lcp: 1_700, inp: 240 });

    expect(results.find((result) => result.metric === "lcp")).toMatchObject({ status: "pass" });
    expect(results.find((result) => result.metric === "inp")).toMatchObject({ status: "fail" });
    expect(results.find((result) => result.metric === "cls")).toMatchObject({
      status: "unmeasured",
    });
  });

  it("keeps every shared budget assigned to a Lighthouse assertion or probe", async () => {
    const { PERFORMANCE_BUDGETS } = await loadModule();
    const config = JSON.parse(
      readFileSync(resolve(process.cwd(), "config/lighthouserc.json"), "utf8"),
    ) as {
      ci: { assert: { assertions: Record<string, [string, { maxNumericValue?: number }]> } };
    };
    const lighthouseMetricByBudgetMetric: Readonly<Record<string, string>> = {
      lcp: "largest-contentful-paint",
      inp: "interaction-to-next-paint",
      cls: "cumulative-layout-shift",
      longTaskMs: "total-blocking-time",
      routeTransitionMs: "interactive",
    };
    const probeOnlyMetrics = ["workerP95Ms", "cacheHitRate", "websocketRecoveryMs", "memoryMb"];

    for (const budget of PERFORMANCE_BUDGETS) {
      const assertionName = lighthouseMetricByBudgetMetric[budget.metric];
      if (assertionName) {
        expect(config.ci.assert.assertions[assertionName]?.[1].maxNumericValue).toBe(
          budget.maximum,
        );
      } else {
        expect(probeOnlyMetrics).toContain(budget.metric);
      }
    }

    expect(new Set([...Object.keys(lighthouseMetricByBudgetMetric), ...probeOnlyMetrics])).toEqual(
      new Set(PERFORMANCE_BUDGETS.map((budget) => budget.metric)),
    );
  });
});
