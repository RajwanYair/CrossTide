/**
 * MACD Calculator tests.
 * Test cases ported from Dart: test/domain/macd_calculator_test.dart
 */
import { describe, it, expect } from "vitest";
import { computeMacdSeries } from "../../../src/domain/macd-calculator";
import type { DailyCandle } from "../../../src/types/domain";

function makeCandles(closes: number[]): DailyCandle[] {
  return closes.map((close, i) => ({
    date: `2024-01-${String(i + 1).padStart(2, "0")}`,
    open: close,
    high: close + 1,
    low: close - 1,
    close,
    volume: 1000,
  }));
}

describe("computeMacdSeries", () => {
  it("returns all nulls for insufficient data", () => {
    const candles = makeCandles([100, 101, 102]);
    const series = computeMacdSeries(candles, 12, 26, 9);
    expect(series.every((p) => p.macd === null)).toBe(true);
  });

  it("series length matches candle count", () => {
    const closes = Array.from({ length: 50 }, (_, i) => 100 + i * 0.5);
    const candles = makeCandles(closes);
    const series = computeMacdSeries(candles);
    expect(series).toHaveLength(50);
  });

  it("has non-null MACD values after slow period warmup", () => {
    const closes = Array.from({ length: 50 }, (_, i) => 100 + Math.sin(i / 5) * 10);
    const candles = makeCandles(closes);
    const series = computeMacdSeries(candles, 12, 26, 9);

    // After slow period (26), MACD should be computed
    const nonNullMacd = series.filter((p) => p.macd !== null);
    expect(nonNullMacd.length).toBeGreaterThan(0);
  });

  it("histogram is MACD minus signal when both are available", () => {
    const closes = Array.from({ length: 60 }, (_, i) => 100 + i);
    const candles = makeCandles(closes);
    const series = computeMacdSeries(candles, 12, 26, 9);

    for (const point of series) {
      if (point.macd !== null && point.signal !== null && point.histogram !== null) {
        expect(point.histogram).toBeCloseTo(point.macd - point.signal, 10);
      }
    }
  });

  it("uses custom periods", () => {
    const closes = Array.from({ length: 30 }, (_, i) => 50 + i);
    const candles = makeCandles(closes);
    const series = computeMacdSeries(candles, 5, 10, 3);
    const nonNullMacd = series.filter((p) => p.macd !== null);
    expect(nonNullMacd.length).toBeGreaterThan(0);
  });
});
