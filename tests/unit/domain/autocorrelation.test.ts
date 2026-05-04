import { describe, it, expect } from "vitest";
import {
  autocorrelation,
  acf,
  partialAutocorrelation,
  pacf,
  ljungBox,
  autocorrelationAnalysis,
} from "../../../src/domain/autocorrelation";

// AR(1) process with positive autocorrelation using LCG noise
const n = 300;
const ar1: number[] = [0];
let seed = 12345;
function lcgNoise(): number {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return (seed / 0xffffffff - 0.5) * 2;
}
for (let i = 1; i < n; i++) {
  ar1.push(0.8 * ar1[i - 1]! + lcgNoise() * 0.3);
}

// White noise-like series (low autocorrelation)
let seed2 = 99999;
function lcgNoise2(): number {
  seed2 = (seed2 * 1664525 + 1013904223) >>> 0;
  return (seed2 / 0xffffffff - 0.5) * 2;
}
const random = Array.from({ length: n }, () => lcgNoise2());

describe("autocorrelation", () => {
  it("autocorrelation lag=1 is high for AR(1)", () => {
    const r = autocorrelation(ar1, 1);
    expect(r).toBeGreaterThan(0.5);
  });

  it("autocorrelation lag=1 is low for pseudo-random", () => {
    const r = autocorrelation(random, 1);
    expect(Math.abs(r)).toBeLessThan(0.3);
  });

  it("autocorrelation returns 0 for invalid lag", () => {
    expect(autocorrelation(ar1, 0)).toBe(0);
    expect(autocorrelation([1, 2], 5)).toBe(0);
  });

  it("acf returns correct length", () => {
    const result = acf(ar1, 10);
    expect(result).toHaveLength(10);
  });

  it("acf values decay for AR(1)", () => {
    const result = acf(ar1, 5);
    expect(Math.abs(result[0]!)).toBeGreaterThan(Math.abs(result[4]!));
  });

  it("partialAutocorrelation lag=1 matches acf lag=1", () => {
    const ac = autocorrelation(ar1, 1);
    const pac = partialAutocorrelation(ar1, 1);
    expect(pac).toBeCloseTo(ac);
  });

  it("pacf returns correct length", () => {
    const result = pacf(ar1, 10);
    expect(result).toHaveLength(10);
  });

  it("ljungBox detects serial correlation in AR(1)", () => {
    const result = ljungBox(ar1, 10);
    expect(result.qStat).toBeGreaterThan(0);
    expect(result.significant).toBe(true);
  });

  it("ljungBox returns 0 for short series", () => {
    const result = ljungBox([1, 2, 3], 10);
    expect(result.qStat).toBe(0);
  });

  it("autocorrelationAnalysis returns full summary", () => {
    const result = autocorrelationAnalysis(ar1, 10);
    expect(result.acf).toHaveLength(10);
    expect(result.pacf).toHaveLength(10);
    expect(result.ljungBoxQ).toBeGreaterThan(0);
    expect(result.isSeriallyCorrelated).toBe(true);
    expect(result.dominantLag).toBeGreaterThanOrEqual(1);
    expect(result.interpretation).toContain("momentum");
  });
});
