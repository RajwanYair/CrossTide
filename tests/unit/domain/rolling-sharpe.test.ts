import { describe, it, expect } from "vitest";
import { computeRollingSharpe } from "../../../src/domain/rolling-sharpe";
import { makeCandles } from "../../helpers/candle-factory";

describe("computeRollingSharpe", () => {
  it("returns null for insufficient data", () => {
    const candles = makeCandles([100, 101, 102]);
    expect(computeRollingSharpe(candles, { window: 10 })).toBeNull();
  });

  it("returns correct number of points", () => {
    // 70 candles → 69 returns → with window=20, should get 50 points
    const prices = Array.from({ length: 70 }, (_, i) => 100 + i * 0.5);
    const candles = makeCandles(prices);
    const result = computeRollingSharpe(candles, { window: 20 });
    expect(result).not.toBeNull();
    expect(result!.length).toBe(50);
  });

  it("computes positive sharpe for uptrending series", () => {
    // Steady uptrend: each day +0.5%
    const prices = Array.from({ length: 100 }, (_, i) => 100 * 1.005 ** i);
    const candles = makeCandles(prices);
    const result = computeRollingSharpe(candles, { window: 30, riskFreeRate: 0.02 });
    expect(result).not.toBeNull();
    // All Sharpe values should be positive for a steady uptrend
    for (const point of result!) {
      expect(point.value).toBeGreaterThan(0);
    }
  });

  it("computes negative sharpe for downtrending series", () => {
    // Steady downtrend: each day -0.5%
    const prices = Array.from({ length: 100 }, (_, i) => 100 * 0.995 ** i);
    const candles = makeCandles(prices);
    const result = computeRollingSharpe(candles, { window: 30, riskFreeRate: 0.02 });
    expect(result).not.toBeNull();
    // All Sharpe values should be negative for a steady downtrend
    for (const point of result!) {
      expect(point.value).toBeLessThan(0);
    }
  });

  it("returns zero sharpe for flat series", () => {
    const prices = Array.from({ length: 80 }, () => 100);
    const candles = makeCandles(prices);
    const result = computeRollingSharpe(candles, { window: 20, riskFreeRate: 0 });
    expect(result).not.toBeNull();
    for (const point of result!) {
      expect(point.value).toBe(0);
    }
  });

  it("each point has a date string", () => {
    const prices = Array.from({ length: 70 }, (_, i) => 100 + i);
    const candles = makeCandles(prices);
    const result = computeRollingSharpe(candles, { window: 20 });
    expect(result).not.toBeNull();
    for (const point of result!) {
      expect(point.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it("uses default options when none provided", () => {
    // 200 candles, default window=60
    const prices = Array.from({ length: 200 }, (_, i) => 100 + Math.sin(i / 10) * 10);
    const candles = makeCandles(prices);
    const result = computeRollingSharpe(candles);
    expect(result).not.toBeNull();
    expect(result!.length).toBe(200 - 60 - 1 + 1); // returns.length - window + 1
  });
});
