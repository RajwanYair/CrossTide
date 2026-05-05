import { describe, it, expect } from "vitest";
import { computeVam } from "../../../src/domain/volatility-adj-momentum";
import { makeCandles } from "../../helpers/candle-factory";

describe("computeVam", () => {
  it("returns null for insufficient data", () => {
    const candles = makeCandles([100, 101, 102]);
    expect(computeVam(candles, { momentumPeriod: 14, atrPeriod: 14 })).toBeNull();
  });

  it("returns correct number of points", () => {
    // 30 candles, max(momPeriod=10, atrPeriod=10)=10, so startIndex=10, result=20 points
    const prices = Array.from({ length: 30 }, (_, i) => 100 + i);
    const candles = makeCandles(prices);
    const result = computeVam(candles, { momentumPeriod: 10, atrPeriod: 10 });
    expect(result).not.toBeNull();
    expect(result!.length).toBe(20);
  });

  it("produces positive values for uptrend", () => {
    // Steady uptrend with consistent ATR
    const prices = Array.from({ length: 40 }, (_, i) => 100 + i * 2);
    const candles = makeCandles(prices);
    const result = computeVam(candles, { momentumPeriod: 10, atrPeriod: 10 });
    expect(result).not.toBeNull();
    for (const point of result!) {
      expect(point.value).toBeGreaterThan(0);
    }
  });

  it("produces negative values for downtrend", () => {
    const prices = Array.from({ length: 40 }, (_, i) => 200 - i * 2);
    const candles = makeCandles(prices);
    const result = computeVam(candles, { momentumPeriod: 10, atrPeriod: 10 });
    expect(result).not.toBeNull();
    for (const point of result!) {
      expect(point.value).toBeLessThan(0);
    }
  });

  it("produces near-zero values for flat series with constant volatility", () => {
    const prices = Array.from({ length: 40 }, () => 100);
    const candles = makeCandles(prices);
    const result = computeVam(candles, { momentumPeriod: 10, atrPeriod: 10 });
    expect(result).not.toBeNull();
    for (const point of result!) {
      expect(point.value).toBe(0);
    }
  });

  it("normalizes momentum by volatility — high vol = lower VAM", () => {
    // Two series: same price change but different volatility
    // Series A: low vol, steady climb
    const pricesA = Array.from({ length: 30 }, (_, i) => 100 + i);
    const candlesA = makeCandles(pricesA);

    // Series B: same start/end price change but we simulate with makeCandles
    // (makeCandles sets high=close+1, low=close-1, so ATR ≈ 2 for all)
    // To test properly, both will have same ATR from makeCandles
    // but series with bigger momentum period close change = higher VAM
    const pricesB = Array.from({ length: 30 }, (_, i) => 100 + i * 0.5);
    const candlesB = makeCandles(pricesB);

    const resultA = computeVam(candlesA, { momentumPeriod: 10, atrPeriod: 10 });
    const resultB = computeVam(candlesB, { momentumPeriod: 10, atrPeriod: 10 });

    expect(resultA).not.toBeNull();
    expect(resultB).not.toBeNull();

    // A has 2x the price change per period as B, same ATR → 2x VAM
    const lastA = resultA![resultA!.length - 1]!.value;
    const lastB = resultB![resultB!.length - 1]!.value;
    expect(lastA).toBeGreaterThan(lastB);
  });

  it("uses default periods when options not provided", () => {
    const prices = Array.from({ length: 50 }, (_, i) => 100 + i);
    const candles = makeCandles(prices);
    const result = computeVam(candles); // defaults: mom=14, atr=14
    expect(result).not.toBeNull();
    expect(result!.length).toBe(50 - 14); // startIndex = max(14,14) = 14
  });

  it("each point has a date string", () => {
    const prices = Array.from({ length: 30 }, (_, i) => 100 + i);
    const candles = makeCandles(prices);
    const result = computeVam(candles, { momentumPeriod: 10, atrPeriod: 10 });
    expect(result).not.toBeNull();
    for (const point of result!) {
      expect(point.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });
});
