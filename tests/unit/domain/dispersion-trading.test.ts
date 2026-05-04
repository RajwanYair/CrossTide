import { describe, it, expect } from "vitest";
import {
  impliedCorrelation,
  realizedCorrelation,
  dispersionAnalysis,
  indexVarianceFromConstituents,
  type ConstituentData,
} from "../../../src/domain/dispersion-trading";

let seed = 22222;
function lcg(): number {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return (seed / 0xffffffff - 0.5) * 2;
}

// Simulate correlated constituents
const n = 100;
const baseReturns = Array.from({ length: n }, () => lcg() * 0.02);
const constituents: ConstituentData[] = [
  { weight: 0.3, volatility: 0.25, returns: baseReturns.map((r) => r + lcg() * 0.01) },
  { weight: 0.25, volatility: 0.3, returns: baseReturns.map((r) => r * 0.8 + lcg() * 0.01) },
  { weight: 0.2, volatility: 0.2, returns: baseReturns.map((r) => r * 0.6 + lcg() * 0.015) },
  { weight: 0.15, volatility: 0.35, returns: baseReturns.map((r) => r * 0.5 + lcg() * 0.02) },
  { weight: 0.1, volatility: 0.28, returns: baseReturns.map((r) => r * 0.7 + lcg() * 0.012) },
];

describe("dispersion-trading", () => {
  describe("impliedCorrelation", () => {
    it("returns value in [-1, 1]", () => {
      const rho = impliedCorrelation(0.18, constituents);
      expect(rho).toBeGreaterThanOrEqual(-1);
      expect(rho).toBeLessThanOrEqual(1);
    });

    it("higher index vol → higher implied correlation", () => {
      const rhoLow = impliedCorrelation(0.1, constituents);
      const rhoHigh = impliedCorrelation(0.25, constituents);
      expect(rhoHigh).toBeGreaterThan(rhoLow);
    });

    it("returns 0 for empty constituents", () => {
      expect(impliedCorrelation(0.2, [])).toBe(0);
    });

    it("returns 0 for zero index vol", () => {
      expect(impliedCorrelation(0, constituents)).toBe(0);
    });
  });

  describe("realizedCorrelation", () => {
    it("positive for correlated constituents", () => {
      const corr = realizedCorrelation(constituents);
      expect(corr).toBeGreaterThan(0.2);
    });

    it("returns 0 for single constituent", () => {
      expect(realizedCorrelation([constituents[0]!])).toBe(0);
    });
  });

  describe("dispersionAnalysis", () => {
    it("returns all metrics", () => {
      const result = dispersionAnalysis(0.18, constituents);
      expect(Number.isFinite(result.impliedCorrelation)).toBe(true);
      expect(Number.isFinite(result.realizedCorrelation)).toBe(true);
      expect(Number.isFinite(result.dispersionSpread)).toBe(true);
    });

    it("signal is one of expected values", () => {
      const result = dispersionAnalysis(0.18, constituents);
      expect(["sell_correlation", "buy_correlation", "neutral"]).toContain(result.signal);
    });

    it("high index vol → sell_correlation signal", () => {
      const result = dispersionAnalysis(0.5, constituents, 0.05);
      expect(result.signal).toBe("sell_correlation");
    });

    it("neutral for empty", () => {
      const result = dispersionAnalysis(0.2, []);
      expect(result.signal).toBe("neutral");
    });
  });

  describe("indexVarianceFromConstituents", () => {
    it("positive variance for correlated constituents", () => {
      const corrMatrix = Array.from({ length: 5 }, (_, i) =>
        Array.from({ length: 5 }, (_, j) => (i === j ? 1 : 0.5)),
      );
      const variance = indexVarianceFromConstituents(constituents, corrMatrix);
      expect(variance).toBeGreaterThan(0);
    });

    it("zero correlation reduces variance", () => {
      const identity = Array.from({ length: 5 }, (_, i) =>
        Array.from({ length: 5 }, (_, j) => (i === j ? 1 : 0)),
      );
      const correlated = Array.from({ length: 5 }, (_, i) =>
        Array.from({ length: 5 }, (_, j) => (i === j ? 1 : 0.8)),
      );
      const varZero = indexVarianceFromConstituents(constituents, identity);
      const varCorr = indexVarianceFromConstituents(constituents, correlated);
      expect(varCorr).toBeGreaterThan(varZero);
    });
  });
});
