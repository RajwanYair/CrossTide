import { describe, it, expect } from "vitest";
import { computeTrendStrength } from "../../../src/domain/trend-strength";
import { makeCandles } from "../../helpers/candle-factory";

describe("computeTrendStrength", () => {
  it("returns null for insufficient data", () => {
    const candles = makeCandles([100, 101, 102, 103, 104]);
    expect(computeTrendStrength(candles)).toBeNull();
  });

  it("returns points with correct structure", () => {
    const prices = Array.from({ length: 50 }, (_, i) => 100 + i);
    const candles = makeCandles(prices);
    const result = computeTrendStrength(candles);
    expect(result).not.toBeNull();
    expect(result!.length).toBeGreaterThan(0);

    const point = result![0]!;
    expect(point).toHaveProperty("date");
    expect(point).toHaveProperty("strength");
    expect(point).toHaveProperty("direction");
    expect(point.strength).toBeGreaterThanOrEqual(0);
    expect(point.strength).toBeLessThanOrEqual(100);
    expect([-1, 0, 1]).toContain(point.direction);
  });

  it("detects bullish trend in uptrend", () => {
    const prices = Array.from({ length: 60 }, (_, i) => 100 + i * 2);
    const candles = makeCandles(prices);
    const result = computeTrendStrength(candles);
    expect(result).not.toBeNull();

    // Most points should be bullish direction
    const bullish = result!.filter((p) => p.direction === 1);
    expect(bullish.length).toBeGreaterThan(result!.length / 2);
  });

  it("detects bearish trend in downtrend", () => {
    const prices = Array.from({ length: 60 }, (_, i) => 200 - i * 2);
    const candles = makeCandles(prices);
    const result = computeTrendStrength(candles);
    expect(result).not.toBeNull();

    // Most points should be bearish direction
    const bearish = result!.filter((p) => p.direction === -1);
    expect(bearish.length).toBeGreaterThan(result!.length / 2);
  });

  it("shows low strength for flat/ranging market", () => {
    // Alternating prices → low ADX, low consistency, low MA distance
    const prices = Array.from({ length: 60 }, (_, i) => 100 + (i % 2 === 0 ? 1 : -1));
    const candles = makeCandles(prices);
    const result = computeTrendStrength(candles);
    expect(result).not.toBeNull();

    const avgStrength = result!.reduce((s, p) => s + p.strength, 0) / result!.length;
    // Flat market should have relatively low strength
    expect(avgStrength).toBeLessThan(60);
  });

  it("shows high strength for strong trend", () => {
    // Consistent 3% daily gains → strong ADX, alignment, consistency
    const prices = Array.from({ length: 60 }, (_, i) => 100 * Math.pow(1.03, i));
    const candles = makeCandles(prices);
    const result = computeTrendStrength(candles);
    expect(result).not.toBeNull();

    // Last points should have high strength
    const lastPoints = result!.slice(-5);
    const avgStrength = lastPoints.reduce((s, p) => s + p.strength, 0) / lastPoints.length;
    expect(avgStrength).toBeGreaterThan(40);
  });

  it("respects custom period options", () => {
    const prices = Array.from({ length: 80 }, (_, i) => 100 + i);
    const candles = makeCandles(prices);
    const resultDefault = computeTrendStrength(candles);
    const resultCustom = computeTrendStrength(candles, {
      adxPeriod: 10,
      maPeriod: 10,
      consistencyPeriod: 10,
    });
    expect(resultDefault).not.toBeNull();
    expect(resultCustom).not.toBeNull();
    // Custom with shorter periods should produce more points
    expect(resultCustom!.length).toBeGreaterThan(resultDefault!.length);
  });

  it("strength values are integers 0-100", () => {
    const prices = Array.from({ length: 60 }, (_, i) => 100 + i);
    const candles = makeCandles(prices);
    const result = computeTrendStrength(candles);
    expect(result).not.toBeNull();
    for (const point of result!) {
      expect(Number.isInteger(point.strength)).toBe(true);
      expect(point.strength).toBeGreaterThanOrEqual(0);
      expect(point.strength).toBeLessThanOrEqual(100);
    }
  });
});
