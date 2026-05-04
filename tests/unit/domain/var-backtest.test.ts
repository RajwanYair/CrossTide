import { describe, it, expect } from "vitest";
import { kupiecTest, christoffersenTest, varBacktest } from "../../../src/domain/var-backtest";

let seed = 99999;
function lcg(): number {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return (seed / 0xffffffff - 0.5) * 2;
}

// Generate returns and a correctly calibrated 99% VaR
const n = 1000;
const returns: number[] = [];
const varGood: number[] = []; // ~1% violation rate
const varBad: number[] = []; // too tight → many violations

for (let i = 0; i < n; i++) {
  const r = lcg() * 0.02;
  returns.push(r);
  // Good VaR: ~5% violation rate for 95% VaR
  // uniform[-0.02,0.02]: 5th percentile = -0.02 + 0.05*0.04 = -0.018
  varGood.push(-0.018);
  // Bad VaR: too tight, causes many violations
  varBad.push(-0.005); // too high → many exceed this
}

// Clustered violations (violations come in bursts)
const returnsClustered: number[] = [];
const varClustered: number[] = [];
for (let i = 0; i < 500; i++) {
  const inBurst = i >= 100 && i < 120; // 20-period burst
  const r = inBurst ? -0.05 : lcg() * 0.01;
  returnsClustered.push(r);
  varClustered.push(-0.03);
}

describe("var-backtest", () => {
  describe("kupiecTest", () => {
    it("does not reject a well-calibrated model", () => {
      const result = kupiecTest(returns, varGood, 0.95);
      expect(result.reject).toBe(false);
    });

    it("rejects model with too many violations", () => {
      const result = kupiecTest(returns, varBad, 0.95);
      expect(result.reject).toBe(true);
    });

    it("violation rate close to alpha for good model", () => {
      const result = kupiecTest(returns, varGood, 0.95);
      expect(result.violationRate).toBeLessThan(0.1);
    });

    it("violation rate high for bad model", () => {
      const result = kupiecTest(returns, varBad, 0.95);
      expect(result.violationRate).toBeGreaterThan(0.1);
    });

    it("p-value in [0, 1]", () => {
      const result = kupiecTest(returns, varGood, 0.95);
      expect(result.pValue).toBeGreaterThanOrEqual(0);
      expect(result.pValue).toBeLessThanOrEqual(1);
    });

    it("expected violations computed correctly", () => {
      const result = kupiecTest(returns, varGood, 0.95);
      expect(result.expected).toBeCloseTo(n * 0.05);
    });
  });

  describe("christoffersenTest", () => {
    it("independent violations not rejected", () => {
      const result = christoffersenTest(returns, varGood, 0.95);
      expect(result.independencePValue).toBeGreaterThan(0.01);
    });

    it("p-values in [0, 1]", () => {
      const result = christoffersenTest(returns, varGood, 0.95);
      expect(result.independencePValue).toBeGreaterThanOrEqual(0);
      expect(result.independencePValue).toBeLessThanOrEqual(1);
      expect(result.conditionalCoveragePValue).toBeGreaterThanOrEqual(0);
      expect(result.conditionalCoveragePValue).toBeLessThanOrEqual(1);
    });
  });

  describe("varBacktest", () => {
    it("good model is adequate", () => {
      const result = varBacktest(returns, varGood, 0.95);
      expect(result.summary).toBe("adequate");
    });

    it("bad model has too many violations", () => {
      const result = varBacktest(returns, varBad, 0.95);
      expect(result.summary).toBe("violations_too_many");
    });

    it("returns kupiec and christoffersen results", () => {
      const result = varBacktest(returns, varGood, 0.95);
      expect(result.kupiec).toBeDefined();
      expect(result.christoffersen).toBeDefined();
    });
  });
});
