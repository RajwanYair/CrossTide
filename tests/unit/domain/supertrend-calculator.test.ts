import { describe, it, expect } from "vitest";
import { computeSuperTrendSeries, computeSuperTrend } from "../../../src/domain/supertrend-calculator";
import { makeCandles } from "../../helpers/candle-factory";

describe("computeSuperTrendSeries", () => {
  it("returns empty for insufficient data", () => {
    expect(computeSuperTrendSeries(makeCandles([100, 101, 102]), 10)).toEqual([]);
  });

  it("returns series for sufficient data", () => {
    const closes = Array.from({ length: 30 }, (_, i) => 100 + i);
    const series = computeSuperTrendSeries(makeCandles(closes), 10, 3);
    expect(series.length).toBeGreaterThan(0);
  });

  it("superTrend values are positive", () => {
    const closes = Array.from({ length: 30 }, (_, i) => 100 + i * 0.5);
    const series = computeSuperTrendSeries(makeCandles(closes), 10, 3);
    for (const p of series) expect(p.superTrend).toBeGreaterThan(0);
  });
});

describe("computeSuperTrend", () => {
  it("returns null for insufficient data", () => {
    expect(computeSuperTrend(makeCandles([100, 101]), 10)).toBeNull();
  });

  it("returns the latest value", () => {
    const closes = Array.from({ length: 30 }, (_, i) => 100 + i);
    const result = computeSuperTrend(makeCandles(closes), 10, 3);
    expect(result).not.toBeNull();
  });
});
