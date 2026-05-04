import { describe, it, expect } from "vitest";
import {
  estimateOU,
  ouAnalysis,
  simulateOU,
  expectedTimeToMean,
} from "../../../src/domain/ornstein-uhlenbeck";

// Generate a mean-reverting series: X(t+1) = X(t) + 0.5*(10 - X(t)) + noise
let seed = 11111;
function lcg(): number {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return (seed / 0xffffffff - 0.5) * 2;
}
const ouSeries: number[] = [15]; // Start away from mean (10)
for (let i = 1; i < 500; i++) {
  const x = ouSeries[i - 1]!;
  ouSeries.push(x + 0.5 * (10 - x) + lcg() * 1.5);
}

// Random walk (no mean reversion)
const rwSeries: number[] = [100];
for (let i = 1; i < 200; i++) {
  rwSeries.push(rwSeries[i - 1]! + lcg() * 2);
}

describe("ornstein-uhlenbeck", () => {
  describe("estimateOU", () => {
    it("detects mean-reversion (theta > 0)", () => {
      const params = estimateOU(ouSeries);
      expect(params.theta).toBeGreaterThan(0);
    });

    it("estimates mu close to 10", () => {
      const params = estimateOU(ouSeries);
      expect(params.mu).toBeGreaterThan(8);
      expect(params.mu).toBeLessThan(12);
    });

    it("sigma is positive", () => {
      const params = estimateOU(ouSeries);
      expect(params.sigma).toBeGreaterThan(0);
    });

    it("halfLife is finite for OU series", () => {
      const params = estimateOU(ouSeries);
      expect(params.halfLife).toBeLessThan(100);
    });

    it("random walk has low/zero theta", () => {
      const params = estimateOU(rwSeries);
      expect(params.theta).toBeLessThan(0.1);
    });

    it("returns defaults for short series", () => {
      const params = estimateOU([1, 2, 3]);
      expect(params.theta).toBe(0);
      expect(params.halfLife).toBe(Infinity);
    });
  });

  describe("ouAnalysis", () => {
    it("isStationary true for OU series", () => {
      const result = ouAnalysis(ouSeries);
      expect(result.isStationary).toBe(true);
    });

    it("rSquared positive for OU series", () => {
      const result = ouAnalysis(ouSeries);
      expect(result.rSquared).toBeGreaterThan(0);
    });

    it("residuals have correct length", () => {
      const result = ouAnalysis(ouSeries);
      expect(result.residuals).toHaveLength(ouSeries.length - 1);
    });
  });

  describe("simulateOU", () => {
    it("expected path converges to mu", () => {
      const params = { theta: 0.5, mu: 10, sigma: 1, halfLife: Math.log(2) / 0.5 };
      const path = simulateOU(params, 20, 50);
      // Should converge toward mu=10
      expect(path[50]).toBeCloseTo(10, 0);
    });

    it("returns correct length", () => {
      const params = { theta: 0.3, mu: 5, sigma: 1, halfLife: Math.log(2) / 0.3 };
      const path = simulateOU(params, 8, 20);
      expect(path).toHaveLength(21); // start + 20 steps
    });
  });

  describe("expectedTimeToMean", () => {
    it("returns 0 when already at mean", () => {
      const params = { theta: 0.5, mu: 10, sigma: 1, halfLife: Math.log(2) / 0.5 };
      expect(expectedTimeToMean(params, 10)).toBe(0);
    });

    it("returns Infinity when theta = 0", () => {
      const params = { theta: 0, mu: 10, sigma: 1, halfLife: Infinity };
      expect(expectedTimeToMean(params, 15)).toBe(Infinity);
    });

    it("farther from mean = longer time", () => {
      const params = { theta: 0.5, mu: 10, sigma: 1, halfLife: Math.log(2) / 0.5 };
      const t1 = expectedTimeToMean(params, 12);
      const t2 = expectedTimeToMean(params, 20);
      expect(t2).toBeGreaterThan(t1);
    });
  });
});
