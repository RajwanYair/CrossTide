import { describe, it, expect } from "vitest";
import { maxDiversification } from "../../../src/domain/max-diversification";

/** Generate a deterministic return series for testing. */
function makeReturns(seed: number, length: number, vol: number): number[] {
  const returns: number[] = [];
  let state = seed;
  for (let i = 0; i < length; i++) {
    // Simple deterministic pseudo-random using LCG
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    const normal = (state / 0x7fffffff - 0.5) * 2;
    returns.push(normal * vol);
  }
  return returns;
}

describe("maxDiversification", () => {
  it("returns null for fewer than 2 assets", () => {
    expect(maxDiversification([makeReturns(1, 100, 0.01)])).toBeNull();
  });

  it("returns null for insufficient data points", () => {
    expect(maxDiversification([makeReturns(1, 5, 0.01), makeReturns(2, 5, 0.01)])).toBeNull();
  });

  it("returns null for mismatched series lengths", () => {
    expect(maxDiversification([makeReturns(1, 100, 0.01), makeReturns(2, 50, 0.01)])).toBeNull();
  });

  it("returns valid weights that sum to 1", () => {
    const result = maxDiversification([
      makeReturns(1, 200, 0.01),
      makeReturns(2, 200, 0.02),
      makeReturns(3, 200, 0.015),
    ]);
    expect(result).not.toBeNull();
    const weightSum = result!.weights.reduce((s, w) => s + w, 0);
    expect(weightSum).toBeCloseTo(1, 2);
  });

  it("all weights are non-negative", () => {
    const result = maxDiversification([
      makeReturns(10, 200, 0.01),
      makeReturns(20, 200, 0.02),
      makeReturns(30, 200, 0.015),
    ]);
    expect(result).not.toBeNull();
    for (const w of result!.weights) {
      expect(w).toBeGreaterThanOrEqual(0);
    }
  });

  it("diversification ratio is >= 1", () => {
    const result = maxDiversification([makeReturns(42, 200, 0.01), makeReturns(84, 200, 0.02)]);
    expect(result).not.toBeNull();
    expect(result!.diversificationRatio).toBeGreaterThanOrEqual(1);
  });

  it("portfolio volatility is less than weighted average volatility", () => {
    const result = maxDiversification([
      makeReturns(7, 200, 0.01),
      makeReturns(14, 200, 0.02),
      makeReturns(21, 200, 0.015),
    ]);
    expect(result).not.toBeNull();
    expect(result!.portfolioVolatility).toBeLessThanOrEqual(result!.weightedAvgVolatility + 0.001);
  });

  it("returns correct number of weights", () => {
    const result = maxDiversification([
      makeReturns(1, 200, 0.01),
      makeReturns(2, 200, 0.02),
      makeReturns(3, 200, 0.015),
      makeReturns(4, 200, 0.012),
    ]);
    expect(result).not.toBeNull();
    expect(result!.weights.length).toBe(4);
  });

  it("assigns higher weight to lower-vol assets when uncorrelated", () => {
    // Asset 1: low vol, Asset 2: high vol, uncorrelated
    const lowVol = makeReturns(100, 200, 0.005);
    const highVol = makeReturns(999, 200, 0.04);
    const result = maxDiversification([lowVol, highVol]);
    expect(result).not.toBeNull();
    // Lower vol asset should get higher weight for diversification
    expect(result!.weights[0]!).toBeGreaterThan(result!.weights[1]!);
  });
});
