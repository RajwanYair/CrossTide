import { describe, it, expect } from "vitest";
import {
  fitClayton,
  fitGumbel,
  fitGaussian,
  dependenceAnalysis,
  toUniform,
  kendallTau,
} from "../../../src/domain/copula";

let seed = 77777;
function lcg(): number {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 0xffffffff;
}

// Generate correlated uniform pairs
const n = 200;
const u: number[] = [];
const v: number[] = [];
for (let i = 0; i < n; i++) {
  const x = lcg();
  // Create positive dependence: v = mix of x + noise
  const noise = lcg() * 0.3;
  u.push(x);
  v.push(Math.max(0.001, Math.min(0.999, 0.7 * x + noise)));
}

// Independent uniforms
const uIndep = Array.from({ length: 100 }, () => lcg());
const vIndep = Array.from({ length: 100 }, () => lcg());

describe("copula", () => {
  describe("kendallTau", () => {
    it("positive for correlated pairs", () => {
      expect(kendallTau(u, v)).toBeGreaterThan(0.2);
    });

    it("near zero for independent pairs", () => {
      const tau = kendallTau(uIndep, vIndep);
      expect(Math.abs(tau)).toBeLessThan(0.15);
    });

    it("perfect for identical series", () => {
      const same = [0.1, 0.3, 0.5, 0.7, 0.9];
      expect(kendallTau(same, same)).toBeCloseTo(1);
    });

    it("returns 0 for short series", () => {
      expect(kendallTau([0.5], [0.5])).toBe(0);
    });
  });

  describe("fitClayton", () => {
    it("theta > 0 for positive dependence", () => {
      const fit = fitClayton(u, v);
      expect(fit.theta).toBeGreaterThan(0);
    });

    it("lower tail dependence > 0", () => {
      const fit = fitClayton(u, v);
      expect(fit.lowerTailDep).toBeGreaterThan(0);
    });

    it("upper tail dependence is 0", () => {
      const fit = fitClayton(u, v);
      expect(fit.upperTailDep).toBe(0);
    });
  });

  describe("fitGumbel", () => {
    it("theta >= 1 for positive dependence", () => {
      const fit = fitGumbel(u, v);
      expect(fit.theta).toBeGreaterThanOrEqual(1);
    });

    it("upper tail dependence > 0", () => {
      const fit = fitGumbel(u, v);
      expect(fit.upperTailDep).toBeGreaterThan(0);
    });
  });

  describe("fitGaussian", () => {
    it("theta (rho) positive for positive dependence", () => {
      const fit = fitGaussian(u, v);
      expect(fit.theta).toBeGreaterThan(0);
    });

    it("no tail dependence", () => {
      const fit = fitGaussian(u, v);
      expect(fit.lowerTailDep).toBe(0);
      expect(fit.upperTailDep).toBe(0);
    });
  });

  describe("dependenceAnalysis", () => {
    it("selects a best fit copula", () => {
      const result = dependenceAnalysis(u, v);
      expect(["clayton", "gumbel", "gaussian"]).toContain(result.bestFit.type);
    });

    it("returns 3 fits", () => {
      const result = dependenceAnalysis(u, v);
      expect(result.fits).toHaveLength(3);
    });

    it("empirical tail dep in [0, 1]", () => {
      const result = dependenceAnalysis(u, v);
      expect(result.empiricalTailDep.lower).toBeGreaterThanOrEqual(0);
      expect(result.empiricalTailDep.upper).toBeLessThanOrEqual(1);
    });
  });

  describe("toUniform", () => {
    it("outputs values in (0, 1)", () => {
      const data = [10, 5, 20, 15, 3];
      const result = toUniform(data);
      for (const val of result) {
        expect(val).toBeGreaterThan(0);
        expect(val).toBeLessThan(1);
      }
    });

    it("preserves rank ordering", () => {
      const data = [10, 5, 20, 15, 3];
      const result = toUniform(data);
      // min value (3) should get lowest rank
      expect(result[4]).toBeLessThan(result[1]!);
      // max value (20) should get highest rank
      expect(result[2]).toBeGreaterThan(result[3]!);
    });
  });
});
