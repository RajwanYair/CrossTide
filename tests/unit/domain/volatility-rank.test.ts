import { describe, it, expect } from "vitest";
import {
  dailyReturns,
  standardDeviation,
  annualizedVolatility,
  dailyVolatility,
  rankByVolatility,
  classifyVolatility,
  getLeastVolatile,
} from "../../../src/domain/volatility-rank";

describe("volatility-rank", () => {
  it("dailyReturns computes percentage changes", () => {
    const prices = [100, 110, 105, 115];
    const returns = dailyReturns(prices);
    expect(returns).toHaveLength(3);
    expect(returns[0]).toBeCloseTo(0.1, 5);
    expect(returns[1]).toBeCloseTo(-0.04545, 3);
    expect(returns[2]).toBeCloseTo(0.09524, 3);
  });

  it("dailyReturns handles zero price safely", () => {
    const returns = dailyReturns([0, 100, 200]);
    expect(returns[0]).toBe(0);
  });

  it("standardDeviation computes correctly", () => {
    // Known example: [2, 4, 4, 4, 5, 5, 7, 9] → std ≈ 2.138
    const result = standardDeviation([2, 4, 4, 4, 5, 5, 7, 9]);
    expect(result).toBeCloseTo(2.138, 2);
  });

  it("standardDeviation returns 0 for insufficient data", () => {
    expect(standardDeviation([5])).toBe(0);
    expect(standardDeviation([])).toBe(0);
  });

  it("annualizedVolatility returns a sensible value", () => {
    // Stable stock: small daily moves
    const stable = Array.from({ length: 100 }, (_, i) => 100 + Math.sin(i * 0.1) * 2);
    const vol = annualizedVolatility(stable);
    expect(vol).toBeGreaterThan(0);
    expect(vol).toBeLessThan(100);
  });

  it("dailyVolatility is smaller than annualized", () => {
    const prices = Array.from({ length: 50 }, (_, i) => 100 + i * 0.5 + Math.sin(i) * 3);
    expect(dailyVolatility(prices)).toBeLessThan(annualizedVolatility(prices));
  });

  it("rankByVolatility ranks most volatile first", () => {
    const stable = Array.from({ length: 60 }, (_, i) => 100 + i * 0.1);
    const volatile = Array.from({ length: 60 }, (_, i) => 100 + Math.sin(i) * 20);

    const ranked = rankByVolatility([
      { ticker: "STABLE", prices: stable },
      { ticker: "VOLATILE", prices: volatile },
    ]);
    expect(ranked[0]!.ticker).toBe("VOLATILE");
    expect(ranked[0]!.rank).toBe(1);
    expect(ranked[1]!.ticker).toBe("STABLE");
    expect(ranked[1]!.rank).toBe(2);
  });

  it("classifyVolatility returns correct labels", () => {
    expect(classifyVolatility(5)).toBe("very low");
    expect(classifyVolatility(15)).toBe("low");
    expect(classifyVolatility(25)).toBe("moderate");
    expect(classifyVolatility(40)).toBe("high");
    expect(classifyVolatility(60)).toBe("very high");
  });

  it("getLeastVolatile returns sorted by lowest vol", () => {
    const rankings = [
      { ticker: "A", annualizedVol: 30, dailyVol: 1.9, rank: 1 },
      { ticker: "B", annualizedVol: 10, dailyVol: 0.6, rank: 2 },
      { ticker: "C", annualizedVol: 20, dailyVol: 1.3, rank: 3 },
    ];
    const least = getLeastVolatile(rankings, 2);
    expect(least[0]!.ticker).toBe("B");
    expect(least[1]!.ticker).toBe("C");
  });

  it("handles empty input", () => {
    expect(rankByVolatility([])).toEqual([]);
  });
});
