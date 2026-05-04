import { describe, it, expect } from "vitest";
import {
  amihudIlliquidity,
  rollSpread,
  turnoverRatio,
  kyleLambda,
  liquidityScore,
  liquidityAnalysis,
} from "../../../src/domain/liquidity-metrics";

// Simulated market data
let seed = 88888;
function lcg(): number {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 0xffffffff;
}

const n = 100;
const prices: number[] = [100];
const returns: number[] = [];
const volumes: number[] = [];
for (let i = 1; i < n; i++) {
  const ret = (lcg() - 0.5) * 0.04;
  prices.push(prices[i - 1]! * (1 + ret));
  returns.push(ret);
  volumes.push(Math.floor(lcg() * 1000000) + 100000);
}

describe("liquidity-metrics", () => {
  describe("amihudIlliquidity", () => {
    it("returns positive value", () => {
      expect(amihudIlliquidity(returns, volumes, prices.slice(1))).toBeGreaterThan(0);
    });

    it("returns 0 for empty arrays", () => {
      expect(amihudIlliquidity([], [], [])).toBe(0);
    });

    it("higher for low volume", () => {
      const lowVol = volumes.map((v) => v / 100);
      const highLiq = amihudIlliquidity(returns, volumes, prices.slice(1));
      const lowLiq = amihudIlliquidity(returns, lowVol, prices.slice(1));
      expect(lowLiq).toBeGreaterThan(highLiq);
    });
  });

  describe("rollSpread", () => {
    it("returns non-negative", () => {
      expect(rollSpread(prices)).toBeGreaterThanOrEqual(0);
    });

    it("returns 0 for short series", () => {
      expect(rollSpread([1, 2])).toBe(0);
    });

    it("returns positive for bid-ask bounce pattern", () => {
      // Alternating pattern simulates bid-ask bounce
      const bounce = Array.from({ length: 100 }, (_, i) => 100 + (i % 2 === 0 ? 0.5 : -0.5));
      expect(rollSpread(bounce)).toBeGreaterThan(0);
    });
  });

  describe("turnoverRatio", () => {
    it("positive for valid inputs", () => {
      expect(turnoverRatio(volumes, 1e8)).toBeGreaterThan(0);
    });

    it("returns 0 for zero shares outstanding", () => {
      expect(turnoverRatio(volumes, 0)).toBe(0);
    });

    it("returns 0 for empty volumes", () => {
      expect(turnoverRatio([], 1e8)).toBe(0);
    });
  });

  describe("kyleLambda", () => {
    it("returns finite value", () => {
      const lambda = kyleLambda(returns, volumes);
      expect(Number.isFinite(lambda)).toBe(true);
    });

    it("returns 0 for short series", () => {
      expect(kyleLambda([0.01], [1000])).toBe(0);
    });

    it("positive (price moves with volume)", () => {
      expect(kyleLambda(returns, volumes)).toBeGreaterThan(0);
    });
  });

  describe("liquidityScore", () => {
    it("returns value in [0, 1]", () => {
      const score = liquidityScore(returns, volumes, prices.slice(1));
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(1);
    });
  });

  describe("liquidityAnalysis", () => {
    it("returns all metrics", () => {
      const result = liquidityAnalysis(returns, volumes, prices.slice(1));
      expect(result.amihudIlliquidity).toBeGreaterThan(0);
      expect(result.turnoverRatio).toBeGreaterThan(0);
      expect(result.volumeWeightedLiquidity).toBeGreaterThan(0);
      expect(Number.isFinite(result.kyleSlambda)).toBe(true);
    });
  });
});
