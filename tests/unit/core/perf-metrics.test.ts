import { describe, it, expect, beforeEach, vi } from "vitest";

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
});
