/**
 * Performance metrics card tests.
 */
import { describe, it, expect, beforeEach } from "vitest";
import {
  formatRatio,
  classifyPerformance,
  renderPerformanceMetrics,
  type PerformanceMetrics,
} from "../../../src/cards/performance-metrics";
import { formatPercent } from "../../../src/ui/number-format";

const GOOD_METRICS: PerformanceMetrics = {
  totalReturn: 0.25,
  annualizedReturn: 0.18,
  sharpeRatio: 1.5,
  sortinoRatio: 2.1,
  maxDrawdown: 0.12,
  winRate: 0.6,
  tradeCount: 42,
  profitFactor: 1.8,
};

const POOR_METRICS: PerformanceMetrics = {
  totalReturn: -0.1,
  annualizedReturn: -0.08,
  sharpeRatio: -0.5,
  sortinoRatio: null,
  maxDrawdown: 0.35,
  winRate: 0.3,
  tradeCount: 10,
  profitFactor: 0.6,
};

describe("formatRatio", () => {
  it("formats a number to 2 decimals", () => {
    expect(formatRatio(1.234)).toBe("1.23");
  });

  it("returns N/A for null", () => {
    expect(formatRatio(null)).toBe("N/A");
  });
});

describe("formatPercent", () => {
  it("formats positive with +", () => {
    expect(formatPercent(0.15, { signed: true })).toBe("+15.00%");
  });

  it("formats negative", () => {
    expect(formatPercent(-0.05, { signed: true })).toBe("-5.00%");
  });

  it("formats zero with +", () => {
    expect(formatPercent(0, { signed: true })).toBe("0.00%");
  });
});

describe("classifyPerformance", () => {
  it("classifies excellent performance", () => {
    const excellent: PerformanceMetrics = {
      ...GOOD_METRICS,
      sharpeRatio: 2.5,
      maxDrawdown: 0.05,
      totalReturn: 0.3,
    };
    expect(classifyPerformance(excellent)).toBe("excellent");
  });

  it("classifies good performance", () => {
    expect(classifyPerformance(GOOD_METRICS)).toBe("good");
  });

  it("classifies fair performance", () => {
    const fair: PerformanceMetrics = { ...POOR_METRICS, totalReturn: 0.01 };
    expect(classifyPerformance(fair)).toBe("fair");
  });

  it("classifies poor performance", () => {
    expect(classifyPerformance(POOR_METRICS)).toBe("poor");
  });

  it("classifies as fair when sharpe is null but return positive", () => {
    const noSharpe: PerformanceMetrics = { ...GOOD_METRICS, sharpeRatio: null };
    expect(classifyPerformance(noSharpe)).toBe("fair");
  });
});

describe("renderPerformanceMetrics", () => {
  let container: HTMLElement;
  beforeEach(() => {
    container = document.createElement("div");
  });

  it("renders all metric rows", () => {
    renderPerformanceMetrics(container, "Backtest Results", GOOD_METRICS);
    const rows = container.querySelectorAll("tbody tr");
    expect(rows.length).toBe(8);
  });

  it("shows the label in header", () => {
    renderPerformanceMetrics(container, "My Strategy", GOOD_METRICS);
    expect(container.textContent).toContain("My Strategy");
  });

  it("shows quality badge", () => {
    renderPerformanceMetrics(container, "Test", GOOD_METRICS);
    expect(container.textContent).toContain("good");
  });

  it("displays metrics values", () => {
    renderPerformanceMetrics(container, "Test", GOOD_METRICS);
    const text = container.textContent ?? "";
    expect(text).toContain("+25.00%"); // total return
    expect(text).toContain("1.50"); // sharpe
    expect(text).toContain("42"); // trade count
  });

  it("shows N/A for null values", () => {
    renderPerformanceMetrics(container, "Test", POOR_METRICS);
    expect(container.textContent).toContain("N/A");
  });

  it("escapes label", () => {
    renderPerformanceMetrics(container, "<script>", GOOD_METRICS);
    expect(container.innerHTML).not.toContain("<script>");
    expect(container.innerHTML).toContain("&lt;script&gt;");
  });
});
