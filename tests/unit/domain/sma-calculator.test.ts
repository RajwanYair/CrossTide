/**
 * SMA Calculator tests.
 * Test cases ported from Dart: test/domain/sma_calculator_test.dart
 */
import { describe, it, expect } from "vitest";
import { computeSma, computeSmaSeries } from "../../../src/domain/sma-calculator";
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

describe("computeSma", () => {
  it("returns null when fewer candles than period", () => {
    const candles = makeCandles([10, 20, 30]);
    expect(computeSma(candles, 5)).toBeNull();
  });

  it("computes SMA correctly for exact period length", () => {
    const candles = makeCandles([10, 20, 30, 40, 50]);
    expect(computeSma(candles, 5)).toBe(30); // (10+20+30+40+50)/5
  });

  it("uses only the last N candles", () => {
    const candles = makeCandles([100, 10, 20, 30, 40, 50]);
    expect(computeSma(candles, 5)).toBe(30); // ignores 100
  });

  it("returns null for empty array", () => {
    expect(computeSma([], 5)).toBeNull();
  });

  it("handles period of 1", () => {
    const candles = makeCandles([42]);
    expect(computeSma(candles, 1)).toBe(42);
  });
});

describe("computeSmaSeries", () => {
  it("returns nulls for warmup period", () => {
    const candles = makeCandles([10, 20, 30, 40, 50]);
    const series = computeSmaSeries(candles, 3);
    expect(series[0]?.value).toBeNull();
    expect(series[1]?.value).toBeNull();
    expect(series[2]?.value).toBe(20); // (10+20+30)/3
    expect(series[3]?.value).toBe(30); // (20+30+40)/3
    expect(series[4]?.value).toBe(40); // (30+40+50)/3
  });

  it("series length matches candle count", () => {
    const candles = makeCandles([10, 20, 30]);
    const series = computeSmaSeries(candles, 2);
    expect(series).toHaveLength(3);
  });

  it("handles insufficient data", () => {
    const candles = makeCandles([10]);
    const series = computeSmaSeries(candles, 5);
    expect(series).toHaveLength(1);
    expect(series[0]?.value).toBeNull();
  });
});
