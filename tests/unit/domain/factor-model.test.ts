import { describe, it, expect } from "vitest";
import { famaFrench3Factor, factorAttribution, capmBeta } from "../../../src/domain/factor-model";

// Simulated factor data
let seed = 44444;
function lcg(): number {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return (seed / 0xffffffff - 0.5) * 2;
}

const n = 200;
const marketExcess: number[] = [];
const smb: number[] = [];
const hml: number[] = [];
const excessReturns: number[] = [];

// Generate factors
for (let i = 0; i < n; i++) {
  marketExcess.push(lcg() * 0.03);
  smb.push(lcg() * 0.02);
  hml.push(lcg() * 0.02);
  // Portfolio = 0.001 + 1.2*mkt + 0.5*smb - 0.3*hml + noise
  excessReturns.push(
    0.001 + 1.2 * marketExcess[i]! + 0.5 * smb[i]! - 0.3 * hml[i]! + lcg() * 0.005,
  );
}

describe("factor-model", () => {
  describe("famaFrench3Factor", () => {
    it("estimates market beta close to 1.2", () => {
      const result = famaFrench3Factor(excessReturns, marketExcess, smb, hml);
      expect(result.betaMarket).toBeGreaterThan(1.0);
      expect(result.betaMarket).toBeLessThan(1.4);
    });

    it("estimates SMB beta close to 0.5", () => {
      const result = famaFrench3Factor(excessReturns, marketExcess, smb, hml);
      expect(result.betaSMB).toBeGreaterThan(0.3);
      expect(result.betaSMB).toBeLessThan(0.7);
    });

    it("estimates HML beta close to -0.3", () => {
      const result = famaFrench3Factor(excessReturns, marketExcess, smb, hml);
      expect(result.betaHML).toBeGreaterThan(-0.5);
      expect(result.betaHML).toBeLessThan(-0.1);
    });

    it("R² is high for well-specified model", () => {
      const result = famaFrench3Factor(excessReturns, marketExcess, smb, hml);
      expect(result.rSquared).toBeGreaterThan(0.8);
    });

    it("alpha close to 0.001", () => {
      const result = famaFrench3Factor(excessReturns, marketExcess, smb, hml);
      expect(result.alpha).toBeGreaterThan(0);
      expect(result.alpha).toBeLessThan(0.005);
    });

    it("returns defaults for short series", () => {
      const result = famaFrench3Factor([0.01], [0.02], [0.01], [0.01]);
      expect(result.betaMarket).toBe(1);
    });

    it("residualVol is low for good fit", () => {
      const result = famaFrench3Factor(excessReturns, marketExcess, smb, hml);
      expect(result.residualVol).toBeLessThan(0.01);
    });
  });

  describe("factorAttribution", () => {
    it("market contribution dominates", () => {
      const result = factorAttribution(excessReturns, marketExcess, smb, hml);
      expect(Math.abs(result.marketContribution)).toBeGreaterThan(0);
    });

    it("returns all components", () => {
      const result = factorAttribution(excessReturns, marketExcess, smb, hml);
      expect(Number.isFinite(result.smbContribution)).toBe(true);
      expect(Number.isFinite(result.hmlContribution)).toBe(true);
      expect(Number.isFinite(result.alphaContribution)).toBe(true);
    });
  });

  describe("capmBeta", () => {
    it("estimates beta close to 1.2", () => {
      const beta = capmBeta(excessReturns, marketExcess);
      expect(beta).toBeGreaterThan(1.0);
      expect(beta).toBeLessThan(1.5);
    });

    it("returns 1 for short series", () => {
      expect(capmBeta([0.01], [0.02])).toBe(1);
    });

    it("beta = 1 for identical series", () => {
      const same = [0.01, -0.02, 0.015, -0.005, 0.02];
      expect(capmBeta(same, same)).toBeCloseTo(1);
    });
  });
});
