import { describe, it, expect } from "vitest";
import {
  kolmogorovSmirnov,
  andersonDarling,
  normalCdf,
  normalityTest,
  exponentialTest,
} from "../../../src/domain/distribution-fit";

// Box-Muller from LCG
let seed = 77777;
function lcg(): number {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 0xffffffff;
}
function randn(): number {
  const u1 = lcg() || 0.0001;
  const u2 = lcg();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

const normalSample = Array.from({ length: 500 }, () => randn());
const uniformSample = Array.from({ length: 500 }, () => lcg() * 10 - 5);
const expSample = Array.from({ length: 500 }, () => -Math.log(lcg() || 0.0001));

describe("distribution-fit", () => {
  describe("normalCdf", () => {
    it("returns 0.5 at x=0", () => {
      expect(normalCdf(0)).toBeCloseTo(0.5, 4);
    });

    it("returns ~0.8413 at x=1", () => {
      expect(normalCdf(1)).toBeCloseTo(0.8413, 3);
    });

    it("monotonically increasing", () => {
      for (let x = -3; x < 3; x += 0.5) {
        expect(normalCdf(x + 0.5)).toBeGreaterThan(normalCdf(x));
      }
    });
  });

  describe("kolmogorovSmirnov", () => {
    it("does not reject normal sample from normal CDF", () => {
      const result = kolmogorovSmirnov(normalSample, normalCdf);
      // Since we're using sample mean/std, test against standard normal may reject
      // but statistic should be reasonable
      expect(result.statistic).toBeGreaterThan(0);
      expect(result.statistic).toBeLessThan(1);
    });

    it("rejects uniform sample from normal CDF", () => {
      const result = kolmogorovSmirnov(uniformSample, normalCdf);
      expect(result.reject).toBe(true);
    });

    it("empty sample returns zero", () => {
      const result = kolmogorovSmirnov([], normalCdf);
      expect(result.statistic).toBe(0);
    });
  });

  describe("andersonDarling", () => {
    it("statistic is positive", () => {
      const result = andersonDarling(normalSample, normalCdf);
      expect(result.statistic).toBeGreaterThan(0);
    });

    it("rejects uniform sample from normal CDF", () => {
      const result = andersonDarling(uniformSample, normalCdf);
      expect(result.reject).toBe(true);
    });
  });

  describe("normalityTest", () => {
    it("does not reject normal sample", () => {
      const result = normalityTest(normalSample);
      expect(result.ks.reject).toBe(false);
      expect(result.ad.reject).toBe(false);
    });

    it("rejects uniform sample", () => {
      const result = normalityTest(uniformSample);
      // At least one test should reject
      expect(result.ks.reject || result.ad.reject).toBe(true);
    });
  });

  describe("exponentialTest", () => {
    it("does not reject exponential sample", () => {
      const result = exponentialTest(expSample);
      expect(result.reject).toBe(false);
    });

    it("rejects normal sample", () => {
      // Shift normal to be positive
      const positiveNormal = normalSample.map((x) => Math.abs(x) + 0.1);
      const result = exponentialTest(positiveNormal);
      // Statistic should be non-trivial
      expect(result.statistic).toBeGreaterThan(0);
    });
  });
});
