import { describe, it, expect } from "vitest";
import { computeRollingCorrelation } from "../../../src/domain/rolling-correlation";
import { makeCandles } from "../../helpers/candle-factory";

describe("computeRollingCorrelation", () => {
  it("returns null for insufficient data", () => {
    const a = makeCandles([100, 101, 102]);
    const b = makeCandles([200, 201, 202]);
    expect(computeRollingCorrelation(a, b, { window: 60 })).toBeNull();
  });

  it("returns correct number of points", () => {
    const prices = Array.from({ length: 80 }, (_, i) => 100 + i);
    const a = makeCandles(prices);
    const b = makeCandles(prices.map((p) => p * 2));
    const result = computeRollingCorrelation(a, b, { window: 20 });
    expect(result).not.toBeNull();
    // 80 candles → 79 returns → 79 - 20 + 1 = 60 points
    expect(result!.length).toBe(60);
  });

  it("returns near 1.0 for perfectly correlated series", () => {
    const prices = Array.from({ length: 80 }, (_, i) => 100 + i * 2);
    const a = makeCandles(prices);
    const b = makeCandles(prices.map((p) => p * 3 + 50)); // linear transform
    const result = computeRollingCorrelation(a, b, { window: 20 });
    expect(result).not.toBeNull();
    for (const point of result!) {
      expect(point.correlation).toBeGreaterThan(0.95);
    }
  });

  it("returns near -1.0 for inversely correlated series", () => {
    // When A goes up, B goes down on the same day (alternating)
    const pricesA = Array.from({ length: 80 }, (_, i) => 100 + (i % 2 === 0 ? 0 : 5));
    const pricesB = Array.from({ length: 80 }, (_, i) => 200 + (i % 2 === 0 ? 5 : 0));
    const a = makeCandles(pricesA);
    const b = makeCandles(pricesB);
    const result = computeRollingCorrelation(a, b, { window: 20 });
    expect(result).not.toBeNull();
    for (const point of result!) {
      expect(point.correlation).toBeLessThan(-0.95);
    }
  });

  it("returns near 0 for uncorrelated series", () => {
    // Alternating patterns that don't correlate
    const pricesA = Array.from({ length: 100 }, (_, i) => 100 + (i % 3) * 2);
    const pricesB = Array.from({ length: 100 }, (_, i) => 200 + (i % 7) * 3);
    const a = makeCandles(pricesA);
    const b = makeCandles(pricesB);
    const result = computeRollingCorrelation(a, b, { window: 30 });
    expect(result).not.toBeNull();
    const avgCorr = result!.reduce((s, p) => s + Math.abs(p.correlation), 0) / result!.length;
    expect(avgCorr).toBeLessThan(0.5);
  });

  it("uses default window of 60 when not specified", () => {
    const prices = Array.from({ length: 100 }, (_, i) => 100 + i);
    const a = makeCandles(prices);
    const b = makeCandles(prices);
    const result = computeRollingCorrelation(a, b); // default window=60
    expect(result).not.toBeNull();
    // 100 candles → 99 returns → 99 - 60 + 1 = 40 points
    expect(result!.length).toBe(40);
  });

  it("each point has a date string", () => {
    const prices = Array.from({ length: 50 }, (_, i) => 100 + i);
    const a = makeCandles(prices);
    const b = makeCandles(prices);
    const result = computeRollingCorrelation(a, b, { window: 10 });
    expect(result).not.toBeNull();
    for (const point of result!) {
      expect(point.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it("correlation values are bounded between -1 and 1", () => {
    const prices = Array.from({ length: 80 }, (_, i) => 100 + i + Math.sin(i) * 10);
    const a = makeCandles(prices);
    const b = makeCandles(prices.map((p, i) => p + Math.cos(i) * 20));
    const result = computeRollingCorrelation(a, b, { window: 20 });
    expect(result).not.toBeNull();
    for (const point of result!) {
      expect(point.correlation).toBeGreaterThanOrEqual(-1);
      expect(point.correlation).toBeLessThanOrEqual(1);
    }
  });

  it("handles series of different lengths by using the shorter", () => {
    const a = makeCandles(Array.from({ length: 80 }, (_, i) => 100 + i));
    const b = makeCandles(Array.from({ length: 60 }, (_, i) => 200 + i));
    const result = computeRollingCorrelation(a, b, { window: 20 });
    expect(result).not.toBeNull();
    // min(80,60) = 60 candles → 59 returns → 59 - 20 + 1 = 40 points
    expect(result!.length).toBe(40);
  });
});
