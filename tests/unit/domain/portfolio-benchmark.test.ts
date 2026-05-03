/**
 * Portfolio benchmark comparison tests.
 */
import { describe, it, expect } from "vitest";
import {
  computeBenchmarkComparison,
  buildReturnSeries,
  BENCHMARK_OPTIONS,
  DEFAULT_BENCHMARK,
} from "../../../src/domain/portfolio-benchmark";

describe("portfolio-benchmark", () => {
  describe("computeBenchmarkComparison", () => {
    it("computes positive alpha when portfolio outperforms", () => {
      const result = computeBenchmarkComparison(10000, 12000, 400, 440);
      // Portfolio: +20%, Benchmark: +10% → alpha: +10%
      expect(result.portfolioReturn).toBeCloseTo(20);
      expect(result.benchmarkReturn).toBeCloseTo(10);
      expect(result.alpha).toBeCloseTo(10);
      expect(result.outperformed).toBe(true);
    });

    it("computes negative alpha when benchmark outperforms", () => {
      const result = computeBenchmarkComparison(10000, 10500, 400, 460);
      // Portfolio: +5%, Benchmark: +15% → alpha: -10%
      expect(result.portfolioReturn).toBeCloseTo(5);
      expect(result.benchmarkReturn).toBeCloseTo(15);
      expect(result.alpha).toBeCloseTo(-10);
      expect(result.outperformed).toBe(false);
    });

    it("handles zero cost basis gracefully", () => {
      const result = computeBenchmarkComparison(0, 5000, 400, 440);
      expect(result.portfolioReturn).toBe(0);
      expect(result.alpha).toBeCloseTo(-10);
    });

    it("uses specified benchmark ticker", () => {
      const result = computeBenchmarkComparison(10000, 11000, 300, 330, "QQQ");
      expect(result.benchmarkTicker).toBe("QQQ");
    });

    it("defaults to SPY benchmark", () => {
      const result = computeBenchmarkComparison(10000, 11000, 400, 440);
      expect(result.benchmarkTicker).toBe("SPY");
    });
  });

  describe("buildReturnSeries", () => {
    it("builds normalized return series from daily returns", () => {
      const pReturns = [0.01, 0.02, -0.005]; // +1%, +2%, -0.5%
      const bReturns = [0.005, 0.005, 0.005]; // +0.5% each day
      const dates = ["2025-01-01", "2025-01-02", "2025-01-03"];

      const series = buildReturnSeries(pReturns, bReturns, dates);

      expect(series).toHaveLength(3);
      expect(series[0]!.date).toBe("2025-01-01");
      // Day 1: 10000 * 1.01 = 10100
      expect(series[0]!.portfolioValue).toBeCloseTo(10100, 0);
      // Day 1 bench: 10000 * 1.005 = 10050
      expect(series[0]!.benchmarkValue).toBeCloseTo(10050, 0);
    });

    it("uses custom base value", () => {
      const series = buildReturnSeries([0.1], [0.05], ["2025-01-01"], 1000);
      expect(series[0]!.portfolioValue).toBeCloseTo(1100, 0);
      expect(series[0]!.benchmarkValue).toBeCloseTo(1050, 0);
    });

    it("handles empty arrays", () => {
      expect(buildReturnSeries([], [], [])).toEqual([]);
    });
  });

  describe("constants", () => {
    it("provides benchmark options", () => {
      expect(BENCHMARK_OPTIONS.length).toBeGreaterThanOrEqual(5);
      expect(BENCHMARK_OPTIONS[0]!.ticker).toBe("SPY");
    });

    it("default benchmark is SPY", () => {
      expect(DEFAULT_BENCHMARK).toBe("SPY");
    });
  });
});
