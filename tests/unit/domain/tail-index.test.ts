import { describe, it, expect } from "vitest";
import {
  hillEstimator,
  peaksOverThreshold,
  meanExcessFunction,
  gpdRiskMeasures,
} from "../../../src/domain/tail-index";

let seed = 11111;
function lcg(): number {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 0xffffffff;
}

// Generate Pareto-distributed data (heavy tail with α=2)
function pareto(alpha: number): number {
  return Math.pow(1 - lcg(), -1 / alpha) - 1;
}
const paretoSample = Array.from({ length: 1000 }, () => pareto(2));

// Normal-like data for comparison
function boxMuller(): number {
  const u1 = lcg() || 0.0001;
  const u2 = lcg();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}
const normalSample = Array.from({ length: 1000 }, () => Math.abs(boxMuller()));

describe("tail-index", () => {
  describe("hillEstimator", () => {
    it("detects heavy tail for Pareto data", () => {
      const result = hillEstimator(paretoSample);
      // True α=2, so ξ=0.5; Hill should estimate ξ > 0.2
      expect(result.hillEstimator).toBeGreaterThan(0.2);
      expect(result.hillEstimator).toBeLessThan(1.5);
    });

    it("tail index inversely related to shape", () => {
      const result = hillEstimator(paretoSample);
      expect(result.tailIndex).toBeCloseTo(1 / result.hillEstimator, 8);
    });

    it("threshold is positive for positive data", () => {
      const result = hillEstimator(paretoSample);
      expect(result.threshold).toBeGreaterThan(0);
    });

    it("normal data has lighter tail than Pareto", () => {
      const normalHill = hillEstimator(normalSample);
      const paretoHill = hillEstimator(paretoSample);
      expect(paretoHill.hillEstimator).toBeGreaterThan(normalHill.hillEstimator);
    });

    it("returns empty for insufficient data", () => {
      const result = hillEstimator([1, 2, 3]);
      expect(result.hillEstimator).toBe(0);
    });

    it("custom k parameter works", () => {
      const result = hillEstimator(paretoSample, 50);
      expect(result.nExceedances).toBe(50);
    });
  });

  describe("peaksOverThreshold", () => {
    it("fits GPD with positive shape for heavy tails", () => {
      const pot = peaksOverThreshold(paretoSample, 0.9);
      expect(pot.shape).toBeGreaterThan(0);
    });

    it("exceedances are above threshold", () => {
      const pot = peaksOverThreshold(paretoSample, 0.9);
      for (const e of pot.exceedances) expect(e).toBeGreaterThan(0);
    });

    it("mean excess is positive", () => {
      const pot = peaksOverThreshold(paretoSample, 0.9);
      expect(pot.meanExcess).toBeGreaterThan(0);
    });

    it("scale is positive", () => {
      const pot = peaksOverThreshold(paretoSample, 0.9);
      expect(pot.scale).toBeGreaterThan(0);
    });
  });

  describe("meanExcessFunction", () => {
    it("returns multiple points", () => {
      const mef = meanExcessFunction(paretoSample);
      expect(mef.length).toBeGreaterThan(10);
    });

    it("thresholds are increasing", () => {
      const mef = meanExcessFunction(paretoSample);
      for (let i = 1; i < mef.length; i++) {
        expect(mef[i]!.threshold).toBeGreaterThanOrEqual(mef[i - 1]!.threshold);
      }
    });

    it("mean excess is positive for positive data", () => {
      const mef = meanExcessFunction(paretoSample);
      for (const point of mef) expect(point.meanExcess).toBeGreaterThan(0);
    });
  });

  describe("gpdRiskMeasures", () => {
    it("VaR at 99% exceeds threshold", () => {
      const pot = peaksOverThreshold(paretoSample, 0.9);
      const risk = gpdRiskMeasures(pot, paretoSample.length, 0.99);
      expect(risk.var).toBeGreaterThan(pot.threshold);
    });

    it("ES exceeds VaR", () => {
      const pot = peaksOverThreshold(paretoSample, 0.9);
      const risk = gpdRiskMeasures(pot, paretoSample.length, 0.99);
      expect(risk.es).toBeGreaterThan(risk.var);
    });

    it("higher confidence → higher VaR", () => {
      const pot = peaksOverThreshold(paretoSample, 0.9);
      const r95 = gpdRiskMeasures(pot, paretoSample.length, 0.95);
      const r99 = gpdRiskMeasures(pot, paretoSample.length, 0.99);
      expect(r99.var).toBeGreaterThan(r95.var);
    });
  });
});
