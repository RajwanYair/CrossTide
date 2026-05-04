import { describe, it, expect } from "vitest";
import { hurstExponent, isTrending, isMeanReverting } from "../../../src/domain/hurst-exponent";

describe("hurst-exponent", () => {
  // Strong uptrend: H should be > 0.5
  const trending = Array.from({ length: 200 }, (_, i) => 100 + i * 0.5 + Math.sin(i * 0.1) * 2);

  // Mean-reverting: oscillating around a mean
  const meanReverting = Array.from({ length: 200 }, (_, i) => 100 + Math.sin(i * 0.5) * 5);

  // Random walk (cumulative sum of random ±1)
  const randomWalk: number[] = [100];
  let seed = 12345;
  for (let i = 1; i < 200; i++) {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    randomWalk.push(randomWalk[i - 1]! + (seed % 2 === 0 ? 0.5 : -0.5));
  }

  it("trending series has H > 0.5", () => {
    const result = hurstExponent(trending);
    expect(result.hurst).toBeGreaterThan(0.5);
    expect(result.interpretation).toBe("trending");
  });

  it("mean-reverting series has H < 0.5", () => {
    const result = hurstExponent(meanReverting);
    expect(result.hurst).toBeLessThan(0.5);
    expect(result.interpretation).toBe("mean-reverting");
  });

  it("Hurst is between 0 and 1", () => {
    const result = hurstExponent(trending);
    expect(result.hurst).toBeGreaterThanOrEqual(0);
    expect(result.hurst).toBeLessThanOrEqual(1);
  });

  it("returns 0.5 for insufficient data", () => {
    const result = hurstExponent([100, 101, 102]);
    expect(result.hurst).toBe(0.5);
    expect(result.confidence).toBe("low");
  });

  it("confidence is higher with more data", () => {
    const short = hurstExponent(trending.slice(0, 30));
    const long = hurstExponent(trending);
    // Longer data should have at least as good confidence
    const confOrder = { low: 0, medium: 1, high: 2 };
    expect(confOrder[long.confidence]).toBeGreaterThanOrEqual(confOrder[short.confidence]);
  });

  it("isTrending returns true for uptrend", () => {
    expect(isTrending(trending)).toBe(true);
  });

  it("isTrending returns false for mean-reverting", () => {
    expect(isTrending(meanReverting)).toBe(false);
  });

  it("isMeanReverting returns true for oscillating", () => {
    expect(isMeanReverting(meanReverting)).toBe(true);
  });

  it("isMeanReverting returns false for trending", () => {
    expect(isMeanReverting(trending)).toBe(false);
  });

  it("random walk produces valid Hurst value", () => {
    const result = hurstExponent(randomWalk);
    expect(result.hurst).toBeGreaterThanOrEqual(0);
    expect(result.hurst).toBeLessThanOrEqual(1);
  });

  it("handles flat prices", () => {
    const flat = Array.from({ length: 100 }, () => 100);
    const result = hurstExponent(flat);
    // Flat = no returns = degenerate case
    expect(result.hurst).toBeGreaterThanOrEqual(0);
    expect(result.hurst).toBeLessThanOrEqual(1);
  });
});
