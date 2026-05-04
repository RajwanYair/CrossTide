import { describe, it, expect } from "vitest";
import {
  optimalRebalance,
  computeTurnover,
  breakEvenFrequency,
  cumulativeTurnover,
} from "../../../src/domain/optimal-turnover";

describe("optimal-turnover", () => {
  const current = [0.4, 0.3, 0.2, 0.1];
  const target = [0.25, 0.25, 0.25, 0.25];
  const alpha = [0.02, 0.01, 0.03, 0.015];
  const config = { costPerTrade: 0.005, noTradeZone: 0.02 };

  describe("computeTurnover", () => {
    it("zero for identical weights", () => {
      expect(computeTurnover([0.5, 0.5], [0.5, 0.5])).toBe(0);
    });

    it("correct for known difference", () => {
      expect(computeTurnover([1, 0], [0, 1])).toBe(1);
    });

    it("symmetric", () => {
      const t1 = computeTurnover(current, target);
      const t2 = computeTurnover(target, current);
      expect(t1).toBeCloseTo(t2);
    });
  });

  describe("optimalRebalance", () => {
    it("reduces turnover vs full rebalance", () => {
      const result = optimalRebalance(current, target, alpha, config);
      const fullTurnover = computeTurnover(current, target);
      expect(result.turnover).toBeLessThanOrEqual(fullTurnover + 1e-10);
    });

    it("weights sum to 1", () => {
      const result = optimalRebalance(current, target, alpha, config);
      const sum = result.optimalWeights.reduce((s, w) => s + w, 0);
      expect(sum).toBeCloseTo(1, 8);
    });

    it("respects maxTurnover constraint", () => {
      const result = optimalRebalance(current, target, alpha, {
        ...config,
        maxTurnover: 0.05,
      });
      expect(result.turnover).toBeLessThanOrEqual(0.05 + 1e-10);
    });

    it("no trade when alpha is zero and within zone", () => {
      const smallTarget = [0.41, 0.29, 0.2, 0.1];
      const zeroAlpha = [0, 0, 0, 0];
      const result = optimalRebalance(current, smallTarget, zeroAlpha, config);
      expect(result.turnover).toBeCloseTo(0, 5);
    });

    it("transaction cost is non-negative", () => {
      const result = optimalRebalance(current, target, alpha, config);
      expect(result.transactionCost).toBeGreaterThanOrEqual(0);
    });

    it("empty input returns empty result", () => {
      const result = optimalRebalance([], [], [], config);
      expect(result.optimalWeights).toHaveLength(0);
    });
  });

  describe("breakEvenFrequency", () => {
    it("higher cost → longer between rebalances", () => {
      const f1 = breakEvenFrequency(0.01, 0.001);
      const f2 = breakEvenFrequency(0.01, 0.01);
      expect(f2).toBeGreaterThan(f1);
    });

    it("returns Infinity for zero tracking", () => {
      expect(breakEvenFrequency(0, 0.01)).toBe(Infinity);
    });
  });

  describe("cumulativeTurnover", () => {
    it("sums turnover across periods", () => {
      const history = [
        [0.5, 0.5],
        [0.6, 0.4],
        [0.7, 0.3],
      ];
      const total = cumulativeTurnover(history);
      expect(total).toBeCloseTo(0.1 + 0.1);
    });

    it("zero for single snapshot", () => {
      expect(cumulativeTurnover([[0.5, 0.5]])).toBe(0);
    });
  });
});
