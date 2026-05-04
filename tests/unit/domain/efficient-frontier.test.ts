import { describe, it, expect } from "vitest";
import {
  assetStatsFromReturns,
  covarianceMatrix,
  portfolioVolatility,
  portfolioReturn,
  efficientFrontier,
} from "../../../src/domain/efficient-frontier";

describe("efficient-frontier", () => {
  const returnsA = Array.from({ length: 252 }, (_, i) => 0.0005 + Math.sin(i * 0.1) * 0.01);
  const returnsB = Array.from({ length: 252 }, (_, i) => 0.0003 + Math.cos(i * 0.1) * 0.008);
  const returnsC = Array.from({ length: 252 }, (_, i) => 0.0001 + Math.sin(i * 0.2) * 0.005);

  it("assetStatsFromReturns computes stats", () => {
    const stats = assetStatsFromReturns("AAPL", returnsA);
    expect(stats.ticker).toBe("AAPL");
    expect(stats.expectedReturn).not.toBe(0);
    expect(stats.volatility).toBeGreaterThan(0);
  });

  it("assetStatsFromReturns empty returns zeros", () => {
    const stats = assetStatsFromReturns("X", []);
    expect(stats.expectedReturn).toBe(0);
    expect(stats.volatility).toBe(0);
  });

  it("covarianceMatrix has correct dimensions", () => {
    const cov = covarianceMatrix([returnsA, returnsB, returnsC]);
    expect(cov).toHaveLength(3);
    expect(cov[0]).toHaveLength(3);
  });

  it("covarianceMatrix is symmetric", () => {
    const cov = covarianceMatrix([returnsA, returnsB]);
    expect(cov[0]![1]).toBeCloseTo(cov[1]![0]!);
  });

  it("covarianceMatrix diagonal is positive", () => {
    const cov = covarianceMatrix([returnsA, returnsB]);
    expect(cov[0]![0]).toBeGreaterThan(0);
    expect(cov[1]![1]).toBeGreaterThan(0);
  });

  it("portfolioVolatility computes correctly", () => {
    const cov = covarianceMatrix([returnsA, returnsB]);
    const vol = portfolioVolatility([0.6, 0.4], cov);
    expect(vol).toBeGreaterThan(0);
  });

  it("portfolioReturn computes weighted sum", () => {
    const r = portfolioReturn([0.5, 0.5], [0.1, 0.2]);
    expect(r).toBeCloseTo(0.15);
  });

  it("efficientFrontier generates portfolios", () => {
    const assets = [
      assetStatsFromReturns("A", returnsA),
      assetStatsFromReturns("B", returnsB),
      assetStatsFromReturns("C", returnsC),
    ];
    const cov = covarianceMatrix([returnsA, returnsB, returnsC]);
    const result = efficientFrontier(assets, cov, 500);
    expect(result.portfolios).toHaveLength(500);
  });

  it("efficientFrontier finds maxSharpe", () => {
    const assets = [assetStatsFromReturns("A", returnsA), assetStatsFromReturns("B", returnsB)];
    const cov = covarianceMatrix([returnsA, returnsB]);
    const result = efficientFrontier(assets, cov, 1000, 0.02);
    expect(result.maxSharpe.sharpeRatio).toBeGreaterThan(-Infinity);
    expect(Object.keys(result.maxSharpe.weights)).toHaveLength(2);
  });

  it("efficientFrontier minVariance has lowest vol", () => {
    const assets = [assetStatsFromReturns("A", returnsA), assetStatsFromReturns("B", returnsB)];
    const cov = covarianceMatrix([returnsA, returnsB]);
    const result = efficientFrontier(assets, cov, 1000);
    const allVols = result.portfolios.map((p) => p.volatility);
    expect(result.minVariance.volatility).toBe(Math.min(...allVols));
  });

  it("efficientFrontier weights sum to 1", () => {
    const assets = [
      assetStatsFromReturns("A", returnsA),
      assetStatsFromReturns("B", returnsB),
      assetStatsFromReturns("C", returnsC),
    ];
    const cov = covarianceMatrix([returnsA, returnsB, returnsC]);
    const result = efficientFrontier(assets, cov, 100);
    const wSum = Object.values(result.portfolios[0]!.weights).reduce((s, w) => s + w, 0);
    expect(wSum).toBeCloseTo(1);
  });
});
