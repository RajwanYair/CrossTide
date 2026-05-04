import { describe, it, expect } from "vitest";
import {
  eulerDecomposition,
  riskParityWeights,
  incrementalVaR,
} from "../../../src/domain/risk-contribution";

// Simple 3-asset covariance matrix
const cov3 = [
  [0.04, 0.006, 0.002],
  [0.006, 0.09, 0.009],
  [0.002, 0.009, 0.01],
];

const equalWeights = [1 / 3, 1 / 3, 1 / 3];

describe("risk-contribution", () => {
  describe("eulerDecomposition", () => {
    it("component risks sum to portfolio risk", () => {
      const result = eulerDecomposition(equalWeights, cov3);
      const sumRC = result.componentRisk.reduce((s, c) => s + c, 0);
      expect(sumRC).toBeCloseTo(result.portfolioRisk, 8);
    });

    it("percent contributions sum to 1", () => {
      const result = eulerDecomposition(equalWeights, cov3);
      const sumPct = result.percentContribution.reduce((s, p) => s + p, 0);
      expect(sumPct).toBeCloseTo(1, 8);
    });

    it("higher vol asset has higher marginal risk", () => {
      const result = eulerDecomposition(equalWeights, cov3);
      // Asset 1 has highest variance (0.09)
      expect(result.marginalRisk[1]).toBeGreaterThan(result.marginalRisk[2]!);
    });

    it("portfolio risk equals sqrt(w'Σw)", () => {
      const w = [0.5, 0.3, 0.2];
      const result = eulerDecomposition(w, cov3);
      let expected = 0;
      for (let i = 0; i < 3; i++)
        for (let j = 0; j < 3; j++) expected += w[i]! * cov3[i]![j]! * w[j]!;
      expect(result.portfolioRisk).toBeCloseTo(Math.sqrt(expected), 8);
    });

    it("empty input returns empty", () => {
      const result = eulerDecomposition([], []);
      expect(result.portfolioRisk).toBe(0);
    });
  });

  describe("riskParityWeights", () => {
    it("achieves approximately equal risk contribution", () => {
      const weights = riskParityWeights(cov3);
      const decomp = eulerDecomposition(weights, cov3);
      const target = 1 / 3;
      for (const pct of decomp.percentContribution) {
        expect(pct).toBeCloseTo(target, 2);
      }
    });

    it("weights sum to 1", () => {
      const weights = riskParityWeights(cov3);
      expect(weights.reduce((s, w) => s + w, 0)).toBeCloseTo(1, 8);
    });

    it("lower vol asset gets higher weight", () => {
      const weights = riskParityWeights(cov3);
      // Asset 2 has lowest vol (0.01), should get highest weight
      expect(weights[2]).toBeGreaterThan(weights[1]!);
    });

    it("all weights positive", () => {
      const weights = riskParityWeights(cov3);
      for (const w of weights) expect(w).toBeGreaterThan(0);
    });
  });

  describe("incrementalVaR", () => {
    it("all components have correct sign", () => {
      const ivar = incrementalVaR(equalWeights, cov3, 0.95);
      for (const v of ivar) expect(v).toBeGreaterThan(0);
    });

    it("sums to parametric VaR", () => {
      const w = [0.4, 0.35, 0.25];
      const ivar = incrementalVaR(w, cov3, 0.95);
      const decomp = eulerDecomposition(w, cov3);
      const zAlpha = 1.645; // ~95%
      const expectedVaR = zAlpha * decomp.portfolioRisk;
      const sumIVaR = ivar.reduce((s, v) => s + v, 0);
      expect(sumIVaR).toBeCloseTo(expectedVaR, 2);
    });
  });
});
