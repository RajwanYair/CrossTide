import { describe, it, expect } from "vitest";
import { computeAdxSeries, computeAdx } from "../../../src/domain/adx-calculator";
import { makeCandles } from "../../helpers/candle-factory";

describe("computeAdxSeries", () => {
  it("returns empty for insufficient data", () => {
    const candles = makeCandles(Array.from({ length: 20 }, (_, i) => 100 + i));
    expect(computeAdxSeries(candles, 14)).toEqual([]);
  });

  it("returns results for sufficient data", () => {
    const closes = Array.from({ length: 40 }, (_, i) => 100 + Math.sin(i) * 5);
    const series = computeAdxSeries(makeCandles(closes), 14);
    expect(series.length).toBeGreaterThan(0);
  });

  it("ADX values are between 0 and 100", () => {
    const closes = Array.from({ length: 50 }, (_, i) => 100 + i * 0.5);
    const series = computeAdxSeries(makeCandles(closes), 14);
    for (const p of series) {
      expect(p.adx).toBeGreaterThanOrEqual(0);
      expect(p.adx).toBeLessThanOrEqual(100);
    }
  });

  it("+DI and -DI are non-negative", () => {
    const closes = Array.from({ length: 50 }, (_, i) => 100 + Math.sin(i) * 10);
    const series = computeAdxSeries(makeCandles(closes), 14);
    for (const p of series) {
      expect(p.plusDi).toBeGreaterThanOrEqual(0);
      expect(p.minusDi).toBeGreaterThanOrEqual(0);
    }
  });
});

describe("computeAdx", () => {
  it("returns null for insufficient data", () => {
    expect(computeAdx(makeCandles([100, 101]), 14)).toBeNull();
  });

  it("returns the latest ADX value", () => {
    const closes = Array.from({ length: 50 }, (_, i) => 100 + i);
    const result = computeAdx(makeCandles(closes), 14);
    expect(result).toBeTypeOf("number");
  });
});
