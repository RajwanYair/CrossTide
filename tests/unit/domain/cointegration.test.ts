import { describe, it, expect } from "vitest";
import {
  ols,
  adfStatistic,
  engleGranger,
  halfLife,
  spreadZScore,
} from "../../../src/domain/cointegration";

describe("cointegration", () => {
  // Cointegrated pair: B = 2*A + noise (tight relationship)
  const n = 200;
  const seriesA = Array.from({ length: n }, (_, i) => 50 + i * 0.1 + Math.sin(i * 0.1) * 2);
  const seriesB = seriesA.map((a) => 2 * a + 3 + Math.sin(a) * 0.5);

  // Non-cointegrated: independent random walks
  const walkA = Array.from({ length: n }, (_, i) => 100 + i * 0.5);
  const walkB = Array.from({ length: n }, (_, i) => 80 - i * 0.3 + Math.sin(i * 0.7) * 10);

  it("ols computes regression", () => {
    const result = ols(seriesA, seriesB);
    expect(result.beta).toBeGreaterThan(1.5);
    expect(result.beta).toBeLessThan(2.5);
    expect(result.residuals).toHaveLength(n);
  });

  it("ols returns empty for short input", () => {
    const result = ols([1], [2]);
    expect(result.residuals).toEqual([]);
  });

  it("adfStatistic returns negative for stationary series", () => {
    // Mean-reverting series (sine wave)
    const stationary = Array.from({ length: 100 }, (_, i) => Math.sin(i * 0.3) * 5);
    const adf = adfStatistic(stationary);
    expect(adf).toBeLessThan(0);
  });

  it("adfStatistic returns near zero for short input", () => {
    expect(adfStatistic([1, 2])).toBe(0);
  });

  it("engleGranger detects cointegration in synthetic pair", () => {
    const result = engleGranger(seriesA, seriesB);
    expect(result.beta).toBeGreaterThan(1.5);
    expect(result.adfStat).toBeLessThan(0);
    expect(result.spread).toHaveLength(n);
  });

  it("engleGranger spread z-score is finite", () => {
    const result = engleGranger(seriesA, seriesB);
    const z = spreadZScore(result.spread);
    expect(Number.isFinite(z)).toBe(true);
  });

  it("halfLife returns positive for mean-reverting spread", () => {
    // Ornstein-Uhlenbeck-like: oscillating around 0
    const spread = Array.from({ length: 100 }, (_, i) => Math.sin(i * 0.2) * 3);
    const hl = halfLife(spread);
    expect(hl).toBeGreaterThan(0);
    expect(hl).toBeLessThan(100);
  });

  it("halfLife returns Infinity for trending spread", () => {
    const trending = Array.from({ length: 100 }, (_, i) => i * 2);
    const hl = halfLife(trending);
    expect(hl).toBe(Infinity);
  });

  it("spreadZScore returns 0 for short input", () => {
    expect(spreadZScore([5])).toBe(0);
  });

  it("spreadZScore computes correctly", () => {
    const spread = [0, 0, 0, 0, 10];
    const z = spreadZScore(spread);
    expect(z).toBeGreaterThan(1); // 10 is far above mean of 2
  });

  it("engleGranger returns halfLife", () => {
    const result = engleGranger(seriesA, seriesB);
    expect(result.halfLife).toBeGreaterThan(0);
  });
});
