import { describe, it, expect } from "vitest";
import { computeAtrSeries, computeAtr } from "../../../src/domain/atr-calculator";
import { makeCandles } from "../../helpers/candle-factory";

describe("computeAtrSeries", () => {
  it("returns empty for insufficient data", () => {
    const candles = makeCandles([100, 101, 102]);
    expect(computeAtrSeries(candles, 5)).toEqual([]);
  });

  it("returns series starting after period warmup", () => {
    const closes = Array.from({ length: 20 }, (_, i) => 100 + i);
    const candles = makeCandles(closes);
    const series = computeAtrSeries(candles, 14);
    expect(series.length).toBe(20 - 14);
    expect(series[0]?.date).toBe(candles[14]?.date);
  });

  it("ATR values are positive", () => {
    const closes = Array.from({ length: 30 }, (_, i) => 100 + Math.sin(i) * 5);
    const candles = makeCandles(closes);
    const series = computeAtrSeries(candles, 14);
    for (const p of series) {
      expect(p.atr).toBeGreaterThan(0);
      expect(p.atrPercent).toBeGreaterThan(0);
    }
  });
});

describe("computeAtr", () => {
  it("returns null for insufficient data", () => {
    expect(computeAtr(makeCandles([100, 101]), 14)).toBeNull();
  });

  it("returns the latest ATR value", () => {
    const closes = Array.from({ length: 30 }, (_, i) => 100 + i);
    const result = computeAtr(makeCandles(closes), 14);
    expect(result).toBeTypeOf("number");
    expect(result).toBeGreaterThan(0);
  });
});
