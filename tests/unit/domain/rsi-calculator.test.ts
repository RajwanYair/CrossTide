/**
 * RSI Calculator tests.
 * Test cases ported from Dart: test/domain/rsi_calculator_test.dart
 */
import { describe, it, expect } from "vitest";
import { computeRsi, computeRsiSeries } from "../../../src/domain/rsi-calculator";
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

describe("computeRsiSeries", () => {
  it("returns all nulls when candles <= period", () => {
    const candles = makeCandles(Array.from({ length: 14 }, (_, i) => 100 + i));
    const series = computeRsiSeries(candles, 14);
    expect(series.every((p) => p.value === null)).toBe(true);
  });

  it("computes RSI of 100 when all changes are positive", () => {
    // 16 candles: strictly increasing, period=14
    const closes = Array.from({ length: 16 }, (_, i) => 100 + i);
    const candles = makeCandles(closes);
    const series = computeRsiSeries(candles, 14);
    expect(series[14]?.value).toBe(100);
  });

  it("computes RSI of 0 when all changes are negative", () => {
    const closes = Array.from({ length: 16 }, (_, i) => 200 - i);
    const candles = makeCandles(closes);
    const series = computeRsiSeries(candles, 14);
    expect(series[14]?.value).toBe(0);
  });

  it("first period entries are null warmup", () => {
    const closes = Array.from({ length: 20 }, (_, i) => 100 + Math.sin(i) * 5);
    const candles = makeCandles(closes);
    const series = computeRsiSeries(candles, 14);
    for (let i = 0; i < 14; i++) {
      expect(series[i]?.value).toBeNull();
    }
    expect(series[14]?.value).not.toBeNull();
  });

  it("RSI is between 0 and 100", () => {
    const closes = [100, 102, 101, 103, 104, 99, 97, 100, 102, 98, 97, 99, 101, 103, 100, 98];
    const candles = makeCandles(closes);
    const series = computeRsiSeries(candles, 14);
    for (const point of series) {
      if (point.value !== null) {
        expect(point.value).toBeGreaterThanOrEqual(0);
        expect(point.value).toBeLessThanOrEqual(100);
      }
    }
  });
});

describe("computeRsi", () => {
  it("returns null for insufficient data", () => {
    const candles = makeCandles([100, 101, 102]);
    expect(computeRsi(candles, 14)).toBeNull();
  });

  it("returns the latest RSI value", () => {
    const closes = Array.from({ length: 20 }, (_, i) => 100 + i);
    const candles = makeCandles(closes);
    const result = computeRsi(candles, 14);
    expect(result).toBe(100); // all gains
  });
});
