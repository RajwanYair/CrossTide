import { describe, it, expect } from "vitest";
import {
  pearsonCorrelation,
  computeReturns,
  interpretCorrelation,
  correlationCheck,
} from "../../../src/domain/correlation-check";

describe("correlation-check", () => {
  it("returns 1 for perfectly correlated series", () => {
    const xs = [1, 2, 3, 4, 5];
    const ys = [2, 4, 6, 8, 10];
    expect(pearsonCorrelation(xs, ys)).toBeCloseTo(1, 10);
  });

  it("returns -1 for perfectly inversely correlated series", () => {
    const xs = [1, 2, 3, 4, 5];
    const ys = [10, 8, 6, 4, 2];
    expect(pearsonCorrelation(xs, ys)).toBeCloseTo(-1, 10);
  });

  it("returns 0 for uncorrelated series", () => {
    const xs = [1, 2, 3, 4, 5];
    const ys = [5, 5, 5, 5, 5]; // constant — no correlation
    expect(pearsonCorrelation(xs, ys)).toBe(0);
  });

  it("handles series shorter than 2 elements", () => {
    expect(pearsonCorrelation([1], [2])).toBe(0);
    expect(pearsonCorrelation([], [])).toBe(0);
  });

  it("handles mismatched lengths by using shorter", () => {
    const xs = [1, 2, 3, 4, 5, 6];
    const ys = [2, 4, 6];
    expect(pearsonCorrelation(xs, ys)).toBeCloseTo(1, 10);
  });

  it("computeReturns calculates percentage changes", () => {
    const prices = [100, 110, 99, 105];
    const returns = computeReturns(prices);
    expect(returns).toHaveLength(3);
    expect(returns[0]).toBeCloseTo(0.1, 10);
    expect(returns[1]).toBeCloseTo(-0.1, 2);
    expect(returns[2]).toBeCloseTo(0.0606, 3);
  });

  it("computeReturns handles zero prices safely", () => {
    const prices = [0, 100, 200];
    const returns = computeReturns(prices);
    expect(returns[0]).toBe(0); // division by zero guarded
    expect(returns[1]).toBeCloseTo(1, 10);
  });

  it("interpretCorrelation returns expected labels", () => {
    expect(interpretCorrelation(0.05)).toBe("negligible");
    expect(interpretCorrelation(0.2)).toBe("weak positive");
    expect(interpretCorrelation(-0.5)).toBe("moderate negative");
    expect(interpretCorrelation(0.8)).toBe("strong positive");
    expect(interpretCorrelation(-0.95)).toBe("very strong negative");
  });

  it("correlationCheck uses returns not raw prices", () => {
    // Two series that move in lockstep (same % returns)
    const a = [100, 110, 121, 133.1];
    const b = [50, 55, 60.5, 66.55];
    const result = correlationCheck(a, b);
    expect(result.coefficient).toBeCloseTo(1, 5);
    expect(result.sampleSize).toBe(3);
    expect(result.interpretation).toBe("very strong positive");
  });

  it("correlationCheck with opposing returns", () => {
    // Alternating pattern: when a goes up, b goes down
    const a = [100, 110, 100, 110, 100];
    const b = [100, 90, 100, 90, 100];
    const result = correlationCheck(a, b);
    expect(result.coefficient).toBeLessThan(-0.9);
    expect(result.interpretation).toContain("negative");
  });
});
