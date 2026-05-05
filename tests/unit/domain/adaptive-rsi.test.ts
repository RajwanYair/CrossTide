import { describe, it, expect } from "vitest";
import { makeCandles } from "../../helpers/candle-factory";
import { computeAdaptiveRsi } from "../../../src/domain/adaptive-rsi";

describe("computeAdaptiveRsi", () => {
  it("returns null when insufficient data", () => {
    const candles = makeCandles(Array.from({ length: 30 }, (_, i) => 100 + i * 0.1));
    expect(computeAdaptiveRsi(candles)).toBeNull(); // needs 28 + 10 = 38
  });

  it("returns null for invalid parameters", () => {
    const candles = makeCandles(Array.from({ length: 100 }, (_, i) => 100 + i * 0.1));
    expect(computeAdaptiveRsi(candles, { minPeriod: 1 })).toBeNull();
    expect(computeAdaptiveRsi(candles, { minPeriod: 10, maxPeriod: 5 })).toBeNull();
    expect(computeAdaptiveRsi(candles, { erPeriod: 1 })).toBeNull();
  });

  it("returns correct number of data points", () => {
    const candles = makeCandles(Array.from({ length: 100 }, (_, i) => 100 + i * 0.1));
    const result = computeAdaptiveRsi(candles);
    expect(result).not.toBeNull();
    // required = 28 + 10 = 38, output starts at index 37 → length = 100 - 38 + 1 = 63
    // Actually: indices 37..99 → 63 points
    expect(result!.length).toBe(100 - 38 + 1);
  });

  it("each point has date, rsi, and effectivePeriod", () => {
    const candles = makeCandles(Array.from({ length: 60 }, (_, i) => 100 + i * 0.1));
    const result = computeAdaptiveRsi(candles)!;
    for (const pt of result) {
      expect(pt).toHaveProperty("date");
      expect(pt).toHaveProperty("rsi");
      expect(pt).toHaveProperty("effectivePeriod");
      expect(pt.rsi).toBeGreaterThanOrEqual(0);
      expect(pt.rsi).toBeLessThanOrEqual(100);
    }
  });

  it("effectivePeriod stays between minPeriod and maxPeriod", () => {
    const prices = Array.from({ length: 100 }, (_, i) => 100 + Math.sin(i * 0.5) * 10);
    const candles = makeCandles(prices);
    const result = computeAdaptiveRsi(candles, { minPeriod: 8, maxPeriod: 20 })!;
    for (const pt of result) {
      expect(pt.effectivePeriod).toBeGreaterThanOrEqual(8);
      expect(pt.effectivePeriod).toBeLessThanOrEqual(20);
    }
  });

  it("trending market produces shorter effective periods", () => {
    // Strong uptrend — efficiency ratio should be high → shorter periods
    const trending = makeCandles(Array.from({ length: 80 }, (_, i) => 100 + i * 2));
    const result = computeAdaptiveRsi(trending)!;
    const avgPeriod = result.reduce((s, p) => s + p.effectivePeriod, 0) / result.length;
    // Trending → closer to minPeriod (6)
    expect(avgPeriod).toBeLessThan(10);
  });

  it("choppy market produces longer effective periods", () => {
    // Alternating up/down — efficiency ratio should be low → longer periods
    const choppy = makeCandles(Array.from({ length: 80 }, (_, i) => 100 + (i % 2 === 0 ? 5 : -5)));
    const result = computeAdaptiveRsi(choppy)!;
    const avgPeriod = result.reduce((s, p) => s + p.effectivePeriod, 0) / result.length;
    // Choppy → closer to maxPeriod (28)
    expect(avgPeriod).toBeGreaterThan(20);
  });

  it("strong uptrend produces RSI > 50", () => {
    const candles = makeCandles(Array.from({ length: 80 }, (_, i) => 100 + i * 1.5));
    const result = computeAdaptiveRsi(candles)!;
    const lastRsi = result[result.length - 1]!.rsi;
    expect(lastRsi).toBeGreaterThan(50);
  });

  it("strong downtrend produces RSI < 50", () => {
    const candles = makeCandles(Array.from({ length: 80 }, (_, i) => 200 - i * 1.5));
    const result = computeAdaptiveRsi(candles)!;
    const lastRsi = result[result.length - 1]!.rsi;
    expect(lastRsi).toBeLessThan(50);
  });

  it("respects custom options", () => {
    const candles = makeCandles(Array.from({ length: 60 }, (_, i) => 100 + i * 0.5));
    const result = computeAdaptiveRsi(candles, { minPeriod: 4, maxPeriod: 14, erPeriod: 5 })!;
    expect(result).not.toBeNull();
    expect(result.length).toBeGreaterThan(0);
    for (const pt of result) {
      expect(pt.effectivePeriod).toBeGreaterThanOrEqual(4);
      expect(pt.effectivePeriod).toBeLessThanOrEqual(14);
    }
  });
});
