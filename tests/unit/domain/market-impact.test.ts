import { describe, it, expect } from "vitest";
import {
  optimalExecution,
  squareRootImpact,
  vwapParticipation,
} from "../../../src/domain/market-impact";

describe("market-impact", () => {
  const defaultParams = {
    totalShares: 100000,
    dailyVolume: 5000000,
    volatility: 0.02,
    spread: 0.02,
    riskAversion: 1e-6,
  };

  describe("optimalExecution", () => {
    it("returns correct number of periods", () => {
      const result = optimalExecution(defaultParams, 10);
      expect(result.periods).toBe(10);
      expect(result.tradeList).toHaveLength(10);
    });

    it("trade list sums to total shares (approximately)", () => {
      const result = optimalExecution(defaultParams, 10);
      const total = result.tradeList.reduce((s, n) => s + n, 0);
      expect(total).toBeCloseTo(defaultParams.totalShares, -1);
    });

    it("all trades are non-negative", () => {
      const result = optimalExecution(defaultParams, 10);
      for (const n of result.tradeList) expect(n).toBeGreaterThanOrEqual(0);
    });

    it("expected cost is positive", () => {
      const result = optimalExecution(defaultParams, 10);
      expect(result.expectedCost).toBeGreaterThan(0);
    });

    it("higher risk aversion = front-loaded trades", () => {
      const lowRisk = optimalExecution({ ...defaultParams, riskAversion: 1e-8 }, 10);
      const highRisk = optimalExecution({ ...defaultParams, riskAversion: 1e-4 }, 10);
      // Higher risk aversion → more urgency → first trade larger
      expect(highRisk.tradeList[0]!).toBeGreaterThan(lowRisk.tradeList[0]!);
    });

    it("returns empty for zero shares", () => {
      const result = optimalExecution({ ...defaultParams, totalShares: 0 });
      expect(result.tradeList).toEqual([]);
    });

    it("participationRate is reasonable", () => {
      const result = optimalExecution(defaultParams, 10);
      expect(result.participationRate).toBeGreaterThan(0);
      expect(result.participationRate).toBeLessThan(1);
    });
  });

  describe("squareRootImpact", () => {
    it("returns positive for valid inputs", () => {
      expect(squareRootImpact(100000, 5000000, 0.02)).toBeGreaterThan(0);
    });

    it("larger order = larger impact", () => {
      const small = squareRootImpact(10000, 5000000, 0.02);
      const large = squareRootImpact(1000000, 5000000, 0.02);
      expect(large).toBeGreaterThan(small);
    });

    it("returns 0 for zero volume", () => {
      expect(squareRootImpact(100000, 0, 0.02)).toBe(0);
    });
  });

  describe("vwapParticipation", () => {
    it("returns valid participation rate", () => {
      const rate = vwapParticipation(100000, 5000000, 2);
      expect(rate).toBeGreaterThan(0);
      expect(rate).toBeLessThan(1);
    });

    it("returns 0 for zero volume", () => {
      expect(vwapParticipation(100000, 0, 2)).toBe(0);
    });

    it("faster execution = higher participation", () => {
      const slow = vwapParticipation(100000, 5000000, 6);
      const fast = vwapParticipation(100000, 5000000, 1);
      expect(fast).toBeGreaterThan(slow);
    });
  });
});
