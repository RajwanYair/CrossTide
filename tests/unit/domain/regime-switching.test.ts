import { describe, it, expect } from "vitest";
import {
  estimateRegimeParams,
  hamiltonFilter,
  kimSmoother,
  regimeSwitching,
} from "../../../src/domain/regime-switching";

// Two-regime synthetic data: bear (negative mean) then bull (positive mean)
let seed = 77777;
function lcg(): number {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return (seed / 0xffffffff - 0.5) * 2;
}

const returns: number[] = [];
// 100 bear observations (mean=-0.02, vol=0.03)
for (let i = 0; i < 100; i++) returns.push(-0.02 + lcg() * 0.03);
// 100 bull observations (mean=0.01, vol=0.01)
for (let i = 0; i < 100; i++) returns.push(0.01 + lcg() * 0.01);
// 100 bear again
for (let i = 0; i < 100; i++) returns.push(-0.015 + lcg() * 0.025);

describe("regime-switching", () => {
  describe("estimateRegimeParams", () => {
    it("identifies two distinct means", () => {
      const params = estimateRegimeParams(returns);
      expect(Math.abs(params.mu[1] - params.mu[0])).toBeGreaterThan(0.01);
    });

    it("state 0 has lower mean (bear)", () => {
      const params = estimateRegimeParams(returns);
      expect(params.mu[0]).toBeLessThan(params.mu[1]);
    });

    it("both sigmas positive", () => {
      const params = estimateRegimeParams(returns);
      expect(params.sigma[0]).toBeGreaterThan(0);
      expect(params.sigma[1]).toBeGreaterThan(0);
    });

    it("transition probs sum to 1 per row", () => {
      const params = estimateRegimeParams(returns);
      expect(params.transition[0][0] + params.transition[0][1]).toBeCloseTo(1);
      expect(params.transition[1][0] + params.transition[1][1]).toBeCloseTo(1);
    });

    it("returns defaults for short series", () => {
      const params = estimateRegimeParams([0.01, -0.01]);
      expect(params.transition[0][0]).toBe(0.9);
    });
  });

  describe("hamiltonFilter", () => {
    it("returns correct length", () => {
      const params = estimateRegimeParams(returns);
      const probs = hamiltonFilter(returns, params);
      expect(probs).toHaveLength(300);
    });

    it("probabilities in [0, 1]", () => {
      const params = estimateRegimeParams(returns);
      const probs = hamiltonFilter(returns, params);
      for (const p of probs) {
        expect(p).toBeGreaterThanOrEqual(0);
        expect(p).toBeLessThanOrEqual(1);
      }
    });

    it("bull regime detected in middle section", () => {
      const params = estimateRegimeParams(returns);
      const probs = hamiltonFilter(returns, params);
      // Middle 100 observations should have higher bull probability
      const midAvg = probs.slice(120, 180).reduce((s, p) => s + p, 0) / 60;
      const endAvg = probs.slice(250, 290).reduce((s, p) => s + p, 0) / 40;
      expect(midAvg).toBeGreaterThan(endAvg);
    });
  });

  describe("kimSmoother", () => {
    it("returns correct length", () => {
      const params = estimateRegimeParams(returns);
      const filtered = hamiltonFilter(returns, params);
      const smoothed = kimSmoother(filtered, params);
      expect(smoothed).toHaveLength(300);
    });

    it("smoothed probs in [0, 1]", () => {
      const params = estimateRegimeParams(returns);
      const filtered = hamiltonFilter(returns, params);
      const smoothed = kimSmoother(filtered, params);
      for (const p of smoothed) {
        expect(p).toBeGreaterThanOrEqual(0);
        expect(p).toBeLessThanOrEqual(1);
      }
    });

    it("empty input returns empty", () => {
      const params = estimateRegimeParams(returns);
      expect(kimSmoother([], params)).toEqual([]);
    });
  });

  describe("regimeSwitching", () => {
    it("returns full result", () => {
      const result = regimeSwitching(returns);
      expect(result.params.mu).toHaveLength(2);
      expect(result.filteredProbs).toHaveLength(300);
      expect(result.smoothedProbs).toHaveLength(300);
      expect(result.regimeLabel).toHaveLength(300);
    });

    it("current regime is 0 or 1", () => {
      const result = regimeSwitching(returns);
      expect([0, 1]).toContain(result.currentRegime);
    });

    it("labels are bull or bear", () => {
      const result = regimeSwitching(returns);
      for (const label of result.regimeLabel) {
        expect(["bull", "bear"]).toContain(label);
      }
    });
  });
});
