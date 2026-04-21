import { describe, it, expect } from "vitest";
import { computeStochasticSeries, computeStochastic } from "../../../src/domain/stochastic-calculator";
import { makeCandles } from "../../helpers/candle-factory";

describe("computeStochasticSeries", () => {
  it("returns empty for insufficient data", () => {
    expect(computeStochasticSeries(makeCandles([100, 101]), 14)).toEqual([]);
  });

  it("values are between 0 and 100", () => {
    const closes = Array.from({ length: 30 }, (_, i) => 100 + Math.sin(i) * 10);
    const series = computeStochasticSeries(makeCandles(closes), 14, 3, 3);
    for (const p of series) {
      expect(p.percentK).toBeGreaterThanOrEqual(0);
      expect(p.percentK).toBeLessThanOrEqual(100);
      expect(p.percentD).toBeGreaterThanOrEqual(0);
      expect(p.percentD).toBeLessThanOrEqual(100);
    }
  });

  it("produces results for sufficient data", () => {
    const closes = Array.from({ length: 30 }, (_, i) => 100 + i);
    const series = computeStochasticSeries(makeCandles(closes), 14, 3, 3);
    expect(series.length).toBeGreaterThan(0);
  });
});

describe("computeStochastic", () => {
  it("returns null for insufficient data", () => {
    expect(computeStochastic(makeCandles([100, 101]), 14)).toBeNull();
  });

  it("returns the latest value", () => {
    const closes = Array.from({ length: 30 }, (_, i) => 100 + i);
    const result = computeStochastic(makeCandles(closes));
    expect(result).not.toBeNull();
    expect(result!.percentK).toBeTypeOf("number");
  });
});
