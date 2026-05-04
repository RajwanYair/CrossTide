import { describe, it, expect } from "vitest";
import {
  inverseVolWeights,
  riskContributions,
  riskParityAllocate,
  equalWeight,
  compareAllocations,
} from "../../../src/domain/risk-parity";

describe("risk-parity", () => {
  const vols = [0.15, 0.25, 0.1]; // 15%, 25%, 10% annualized

  it("inverseVolWeights sums to 1", () => {
    const weights = inverseVolWeights(vols);
    const sum = weights.reduce((s, w) => s + w, 0);
    expect(sum).toBeCloseTo(1);
  });

  it("lower vol gets higher weight", () => {
    const weights = inverseVolWeights(vols);
    // Asset 2 (10% vol) should have highest weight
    expect(weights[2]!).toBeGreaterThan(weights[0]!);
    expect(weights[0]!).toBeGreaterThan(weights[1]!);
  });

  it("inverseVolWeights empty returns empty", () => {
    expect(inverseVolWeights([])).toEqual([]);
  });

  it("inverseVolWeights all-zero vols returns equal", () => {
    const weights = inverseVolWeights([0, 0, 0]);
    expect(weights).toEqual([1 / 3, 1 / 3, 1 / 3]);
  });

  it("riskContributions are roughly equal", () => {
    const weights = inverseVolWeights(vols);
    const contribs = riskContributions(weights, vols);
    // In inverse-vol weighting, contributions should be approximately equal
    expect(contribs[0]).toBeCloseTo(contribs[1], 1);
    expect(contribs[1]).toBeCloseTo(contribs[2], 1);
  });

  it("riskContributions sum to 1", () => {
    const weights = inverseVolWeights(vols);
    const contribs = riskContributions(weights, vols);
    const sum = contribs.reduce((s, c) => s + c, 0);
    expect(sum).toBeCloseTo(1);
  });

  it("riskParityAllocate returns full result", () => {
    const result = riskParityAllocate({ volatilities: vols, labels: ["SPY", "QQQ", "BND"] });
    expect(result.weights).toHaveLength(3);
    expect(result.labels).toEqual(["SPY", "QQQ", "BND"]);
    expect(result.portfolioVol).toBeGreaterThan(0);
  });

  it("riskParityAllocate uses default labels", () => {
    const result = riskParityAllocate({ volatilities: vols });
    expect(result.labels[0]).toBe("Asset 1");
  });

  it("equalWeight distributes evenly", () => {
    const weights = equalWeight(4);
    expect(weights).toEqual([0.25, 0.25, 0.25, 0.25]);
  });

  it("equalWeight zero returns empty", () => {
    expect(equalWeight(0)).toEqual([]);
  });

  it("compareAllocations risk parity has lower vol", () => {
    const result = compareAllocations(vols);
    // Risk parity overweights low-vol, so portfolio vol should be lower
    expect(result.riskParityVol).toBeLessThanOrEqual(result.equalWtVol);
  });
});
