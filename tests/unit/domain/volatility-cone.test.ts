import { describe, it, expect } from "vitest";
import {
  realizedVol,
  historicalVolDistribution,
  buildVolatilityCone,
  volPercentileRank,
} from "../../../src/domain/volatility-cone";

describe("volatility-cone", () => {
  // Simulated 200 days of price data with moderate vol
  const prices = Array.from(
    { length: 200 },
    (_, i) => 100 * Math.exp(0.0005 * i + 0.02 * Math.sin(i * 0.3)),
  );

  it("realizedVol computes annualized volatility", () => {
    const vol = realizedVol(prices, 20);
    expect(vol).toBeGreaterThan(0);
    expect(vol).toBeLessThan(200); // reasonable range for percent
  });

  it("realizedVol returns 0 for insufficient data", () => {
    expect(realizedVol([100, 101], 20)).toBe(0);
  });

  it("higher vol series produces higher realizedVol", () => {
    const calm = Array.from({ length: 50 }, (_, i) => 100 + i * 0.1);
    const wild = Array.from({ length: 50 }, (_, i) => 100 + i * 2 * (i % 2 === 0 ? 1 : -1));
    const volCalm = realizedVol(calm, 20);
    const volWild = realizedVol(wild, 20);
    expect(volWild).toBeGreaterThan(volCalm);
  });

  it("historicalVolDistribution returns sorted array", () => {
    const dist = historicalVolDistribution(prices, 20);
    expect(dist.length).toBeGreaterThan(0);
    for (let i = 1; i < dist.length; i++) {
      expect(dist[i]!).toBeGreaterThanOrEqual(dist[i - 1]!);
    }
  });

  it("buildVolatilityCone returns points for valid periods", () => {
    const result = buildVolatilityCone(prices, [10, 20, 30]);
    expect(result.cone.length).toBeGreaterThan(0);
  });

  it("cone points have ordered percentiles", () => {
    const result = buildVolatilityCone(prices, [10, 20]);
    for (const point of result.cone) {
      expect(point.min).toBeLessThanOrEqual(point.p25);
      expect(point.p25).toBeLessThanOrEqual(point.p50);
      expect(point.p50).toBeLessThanOrEqual(point.p75);
      expect(point.p75).toBeLessThanOrEqual(point.max);
    }
  });

  it("cone isElevated/isDepressed are mutually exclusive", () => {
    const result = buildVolatilityCone(prices, [10, 20]);
    expect(result.isElevated && result.isDepressed).toBe(false);
  });

  it("volPercentileRank is between 0 and 100", () => {
    const rank = volPercentileRank(prices, 20);
    expect(rank).toBeGreaterThanOrEqual(0);
    expect(rank).toBeLessThanOrEqual(100);
  });

  it("buildVolatilityCone skips periods with insufficient data", () => {
    const short = prices.slice(0, 25);
    const result = buildVolatilityCone(short, [10, 20, 60, 90]);
    // Only 10 and 20 should work with 25 data points
    expect(result.cone.every((p) => p.period <= 23)).toBe(true);
  });

  it("current vol is within min/max range", () => {
    const result = buildVolatilityCone(prices, [20]);
    if (result.cone.length > 0) {
      const point = result.cone[0]!;
      expect(point.current).toBeGreaterThanOrEqual(point.min);
      expect(point.current).toBeLessThanOrEqual(point.max);
    }
  });

  it("flat prices produce near-zero vol", () => {
    const flat = Array.from({ length: 50 }, () => 100);
    const vol = realizedVol(flat, 20);
    expect(vol).toBe(0);
  });
});
