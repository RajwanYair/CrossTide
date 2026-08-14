/**
 * Representative rendering measurements for the A05 hybrid-rendering decision.
 */
import { test, expect, type Page, type TestInfo } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import {
  evaluatePerformanceBudgets,
  type PerformanceBudgetMetric,
} from "../../src/core/perf-metrics";
import { waitForAppReady } from "./app-ready";

interface WorkflowMeasurement {
  readonly workflow: "watchlist" | "chart" | "heatmap";
  readonly lcpMs: number | null;
  readonly inpMs: number | null;
  readonly cls: number;
  readonly longTaskMs: number;
  readonly memoryMb: number | null;
  readonly routeTransitionMs: number;
  readonly traces: Record<string, number>;
  readonly seriousAccessibilityViolations: number;
  readonly accessibilityViolationDetails: readonly {
    readonly id: string;
    readonly targets: readonly string[][];
  }[];
}

interface PerformanceSnapshot {
  readonly lcpMs: number | null;
  readonly inpMs: number | null;
  readonly cls: number;
  readonly longTaskMs: number;
  readonly memoryMb: number | null;
  readonly traces: Record<string, number>;
}

interface BudgetEvidence {
  readonly metric: PerformanceBudgetMetric;
  readonly value: number | null;
  readonly maximum: number;
  readonly status: "pass" | "fail" | "unmeasured";
}

function maxMeasured(values: readonly (number | null)[]): number | null {
  const measured = values.filter((value): value is number => value !== null);
  return measured.length === 0 ? null : Math.max(...measured);
}

async function installObservers(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const state = {
      lcpMs: null as number | null,
      inpMs: null as number | null,
      cls: 0,
      longTaskMs: 0,
    };
    Object.defineProperty(window, "__crosstidePerformance", { value: state });

    try {
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const last = entries.at(-1);
        if (last) state.lcpMs = last.startTime;
      }).observe({ type: "largest-contentful-paint", buffered: true });
    } catch {
      // LCP is optional in older engines.
    }

    try {
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          state.inpMs = Math.max(state.inpMs ?? 0, entry.duration);
        }
      }).observe({ type: "event", buffered: true });
    } catch {
      // INP is optional in older engines.
    }

    try {
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const shift = entry as PerformanceEntry & { hadRecentInput?: boolean; value?: number };
          if (!shift.hadRecentInput) state.cls += shift.value ?? 0;
        }
      }).observe({ type: "layout-shift", buffered: true });
    } catch {
      // CLS is optional in older engines.
    }

    try {
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries())
          state.longTaskMs = Math.max(state.longTaskMs, entry.duration);
      }).observe({ type: "longtask", buffered: true });
    } catch {
      // Long-task entries are optional in older engines.
    }
  });
}

async function readSnapshot(page: Page): Promise<PerformanceSnapshot> {
  return page.evaluate(() => {
    const state = window.__crosstidePerformance as
      | { lcpMs: number | null; inpMs: number | null; cls: number; longTaskMs: number }
      | undefined;
    const memory = (performance as Performance & { memory?: { usedJSHeapSize: number } }).memory;
    return {
      lcpMs: state?.lcpMs ?? null,
      inpMs: state?.inpMs ?? null,
      cls: state?.cls ?? 0,
      longTaskMs: state?.longTaskMs ?? 0,
      memoryMb: memory === undefined ? null : memory.usedJSHeapSize / 1024 / 1024,
      traces: window.__crosstidePerformanceMetrics?.().traces ?? {},
    };
  });
}

async function measureWorkflow(
  page: Page,
  workflow: WorkflowMeasurement["workflow"],
  path: string,
): Promise<WorkflowMeasurement> {
  const startedAt = performance.now();
  await page.goto(path);
  await waitForAppReady(page);
  await page.waitForFunction(
    () =>
      Boolean(document.documentElement.dataset.theme) &&
      !document.documentElement.classList.contains("theme-transitioning"),
  );
  await page.waitForFunction(() => {
    const root = document.documentElement;
    if (root.classList.contains("theme-transitioning")) return false;
    return new Promise<boolean>((resolve) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => resolve(!root.classList.contains("theme-transitioning")));
      });
    });
  });
  await expect(page.locator(`#view-${workflow}`)).toHaveClass(/active/);
  const snapshot = await readSnapshot(page);
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
  const seriousAccessibilityViolations = results.violations.filter(
    (violation) => violation.impact === "serious" || violation.impact === "critical",
  ).length;
  const accessibilityViolationDetails = results.violations
    .filter((violation) => violation.impact === "serious" || violation.impact === "critical")
    .map((violation) => ({
      id: violation.id,
      targets: violation.nodes.map((node) => node.target),
    }));
  return {
    workflow,
    ...snapshot,
    routeTransitionMs: performance.now() - startedAt,
    traces: snapshot.traces,
    seriousAccessibilityViolations,
    accessibilityViolationDetails,
  };
}

test(
  "records representative hybrid-rendering measurements",
  { retries: 2 },
  async ({ page }, testInfo) => {
    await installObservers(page);

    const measurements = [
      await measureWorkflow(page, "watchlist", "/watchlist"),
      await measureWorkflow(page, "chart", "/chart/AAPL"),
      await measureWorkflow(page, "heatmap", "/heatmap"),
    ];

    const values: Partial<Record<PerformanceBudgetMetric, number | null>> = {
      lcp: maxMeasured(measurements.map((measurement) => measurement.lcpMs)),
      inp: maxMeasured(measurements.map((measurement) => measurement.inpMs)),
      cls: Math.max(...measurements.map((measurement) => measurement.cls)),
      longTaskMs: Math.max(...measurements.map((measurement) => measurement.longTaskMs)),
      memoryMb: maxMeasured(measurements.map((measurement) => measurement.memoryMb)),
    };
    const budgetEvidence = evaluatePerformanceBudgets(values);

    for (const measurement of measurements) {
      expect(measurement.cls).toBeGreaterThanOrEqual(0);
      expect(measurement.longTaskMs).toBeGreaterThanOrEqual(0);
      expect(measurement.routeTransitionMs).toBeGreaterThanOrEqual(0);
      for (const metric of [
        "startupMs",
        "cardLoadMs",
        "chartRenderMs",
        "workerTransferMs",
        "serviceWorkerUpdateMs",
      ]) {
        expect(
          measurement.traces[metric],
          `${measurement.workflow} ${metric}`,
        ).toBeGreaterThanOrEqual(0);
      }
      expect(
        measurement.seriousAccessibilityViolations,
        `${measurement.workflow} has serious or critical accessibility violations: ${JSON.stringify(measurement.accessibilityViolationDetails)}`,
      ).toBe(0);
    }

    for (const result of budgetEvidence) {
      expect(
        result.status,
        `${result.metric} measured at ${result.value ?? "unmeasured"}; budget ${result.maximum}`,
      ).not.toBe("fail");
    }

    await testInfo.attach("hybrid-rendering-measurements.json", {
      body: Buffer.from(
        JSON.stringify(
          {
            generatedAt: new Date().toISOString(),
            profile: testInfo.project.name,
            measurements,
            budgetEvidence,
          },
          null,
          2,
        ),
      ),
      contentType: "application/json",
    });
  },
);

test("records F02 application trace measurements", async ({ page }, testInfo) => {
  await page.goto("/watchlist");
  await waitForAppReady(page);
  await expect(page.locator("#view-watchlist")).toHaveClass(/active/);

  const traces = await page.evaluate(() => window.__crosstidePerformanceMetrics?.().traces ?? {});
  for (const metric of [
    "startupMs",
    "cardLoadMs",
    "chartRenderMs",
    "workerTransferMs",
    "serviceWorkerUpdateMs",
  ]) {
    expect(traces[metric], metric).toBeGreaterThanOrEqual(0);
  }

  await testInfo.attach("f02-trace-measurements.json", {
    body: Buffer.from(
      JSON.stringify(
        { generatedAt: new Date().toISOString(), profile: testInfo.project.name, traces },
        null,
        2,
      ),
    ),
    contentType: "application/json",
  });
});
