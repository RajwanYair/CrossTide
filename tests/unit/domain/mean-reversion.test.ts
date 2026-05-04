import { describe, it, expect } from "vitest";
import {
  zScore,
  deviationFromMa,
  analyzeReversion,
  scanForReversion,
  mostOversold,
  mostOverbought,
} from "../../../src/domain/mean-reversion";

describe("mean-reversion", () => {
  // Price series at its mean
  const atMean = Array.from({ length: 20 }, () => 100);
  // Price far above mean
  const overbought = [...Array.from({ length: 19 }, () => 100), 120];
  // Price far below mean
  const oversold = [...Array.from({ length: 19 }, () => 100), 80];

  it("zScore returns 0 for price at mean", () => {
    expect(zScore(atMean, 20)).toBe(0);
  });

  it("zScore positive for price above mean", () => {
    const prices = [...Array.from({ length: 19 }, () => 100), 110];
    expect(zScore(prices, 20)).toBeGreaterThan(0);
  });

  it("zScore negative for price below mean", () => {
    const prices = [...Array.from({ length: 19 }, () => 100), 90];
    expect(zScore(prices, 20)).toBeLessThan(0);
  });

  it("zScore returns 0 for insufficient data", () => {
    expect(zScore([100, 101], 20)).toBe(0);
  });

  it("deviationFromMa percent calculation", () => {
    const prices = [...Array.from({ length: 19 }, () => 100), 110];
    const dev = deviationFromMa(prices, 20);
    // Mean ≈ 100.5, current = 110, dev ≈ 9.45%
    expect(dev).toBeGreaterThan(0);
  });

  it("analyzeReversion identifies overbought", () => {
    const result = analyzeReversion("AAPL", overbought, 20, 2);
    expect(result.signal).toBe("overbought");
    expect(result.ticker).toBe("AAPL");
    expect(result.zScore).toBeGreaterThan(2);
  });

  it("analyzeReversion identifies oversold", () => {
    const result = analyzeReversion("MSFT", oversold, 20, 2);
    expect(result.signal).toBe("oversold");
    expect(result.zScore).toBeLessThan(-2);
  });

  it("analyzeReversion neutral when at mean", () => {
    const result = analyzeReversion("GOOG", atMean, 20, 2);
    expect(result.signal).toBe("neutral");
  });

  it("scanForReversion returns sorted by abs z-score", () => {
    const assets = [
      { ticker: "A", prices: overbought },
      { ticker: "B", prices: oversold },
      { ticker: "C", prices: atMean },
    ];
    const results = scanForReversion(assets, 20, 2);
    // "C" should be filtered out (neutral)
    expect(results.every((r) => r.signal !== "neutral")).toBe(true);
    // Sorted by abs z-score descending
    for (let i = 1; i < results.length; i++) {
      expect(Math.abs(results[i - 1]!.zScore)).toBeGreaterThanOrEqual(Math.abs(results[i]!.zScore));
    }
  });

  it("mostOversold returns only oversold", () => {
    const assets = [
      { ticker: "A", prices: overbought },
      { ticker: "B", prices: oversold },
    ];
    const results = mostOversold(assets, 20, 2);
    expect(results.every((r) => r.signal === "oversold")).toBe(true);
  });

  it("mostOverbought returns only overbought", () => {
    const assets = [
      { ticker: "A", prices: overbought },
      { ticker: "B", prices: oversold },
    ];
    const results = mostOverbought(assets, 20, 2);
    expect(results.every((r) => r.signal === "overbought")).toBe(true);
  });
});
