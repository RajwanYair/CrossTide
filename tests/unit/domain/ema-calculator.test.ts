/**
 * EMA Calculator tests.
 * Test cases ported from Dart: test/domain/ema_calculator_test.dart
 */
import { describe, it, expect } from "vitest";
import { computeEma, computeEmaSeries } from "../../../src/domain/ema-calculator";
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

describe("computeEmaSeries", () => {
  it("returns all nulls when fewer candles than period", () => {
    const candles = makeCandles([10, 20]);
    const series = computeEmaSeries(candles, 5);
    expect(series).toHaveLength(2);
    expect(series.every((p) => p.value === null)).toBe(true);
  });

  it("seeds with SMA of first period closes", () => {
    const candles = makeCandles([10, 20, 30]);
    const series = computeEmaSeries(candles, 3);
    // Seed = (10+20+30)/3 = 20, placed at index 2
    expect(series[0]?.value).toBeNull();
    expect(series[1]?.value).toBeNull();
    expect(series[2]?.value).toBe(20);
  });

  it("applies EMA formula after seed", () => {
    const candles = makeCandles([10, 20, 30, 40]);
    const series = computeEmaSeries(candles, 3);
    // k = 2/(3+1) = 0.5
    // Seed = 20
    // EMA[3] = 40 * 0.5 + 20 * 0.5 = 30
    expect(series[3]?.value).toBe(30);
  });

  it("series length matches candle count", () => {
    const candles = makeCandles([10, 20, 30, 40, 50]);
    const series = computeEmaSeries(candles, 3);
    expect(series).toHaveLength(5);
  });
});

describe("computeEma", () => {
  it("returns null for insufficient data", () => {
    const candles = makeCandles([10]);
    expect(computeEma(candles, 5)).toBeNull();
  });

  it("returns the latest EMA value", () => {
    const candles = makeCandles([10, 20, 30, 40]);
    // k=0.5, seed=20, EMA[3]=30
    expect(computeEma(candles, 3)).toBe(30);
  });
});
