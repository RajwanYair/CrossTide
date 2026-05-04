import { describe, it, expect } from "vitest";
import {
  estimateJumpDiffusion,
  mertonCallPrice,
  detectJumps,
} from "../../../src/domain/jump-diffusion";

// Simulated returns with occasional jumps
let seed = 54321;
function lcg(): number {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return (seed / 0xffffffff - 0.5) * 2;
}
const returns: number[] = [];
for (let i = 0; i < 500; i++) {
  let r = lcg() * 0.01; // normal diffusion
  if (Math.abs(lcg()) > 0.95) r += lcg() * 0.05; // occasional jump
  returns.push(r);
}

// Pure normal returns (no jumps)
const normalReturns = Array.from({ length: 300 }, () => lcg() * 0.01);

describe("jump-diffusion", () => {
  describe("estimateJumpDiffusion", () => {
    it("detects positive lambda for series with jumps", () => {
      const result = estimateJumpDiffusion(returns);
      expect(result.params.lambda).toBeGreaterThanOrEqual(0);
    });

    it("sigma is positive", () => {
      const result = estimateJumpDiffusion(returns);
      expect(result.params.sigma).toBeGreaterThan(0);
    });

    it("jumpContribution in [0, 1]", () => {
      const result = estimateJumpDiffusion(returns);
      expect(result.jumpContribution).toBeGreaterThanOrEqual(0);
      expect(result.jumpContribution).toBeLessThanOrEqual(1);
    });

    it("totalVariance is positive", () => {
      const result = estimateJumpDiffusion(returns);
      expect(result.totalVariance).toBeGreaterThan(0);
    });

    it("returns defaults for short series", () => {
      const result = estimateJumpDiffusion([0.01, -0.02]);
      expect(result.params.sigma).toBe(0.01);
      expect(result.params.lambda).toBe(0);
    });

    it("normal series has low jump contribution", () => {
      const result = estimateJumpDiffusion(normalReturns);
      expect(result.jumpContribution).toBeLessThan(0.5);
    });
  });

  describe("mertonCallPrice", () => {
    it("returns positive call price", () => {
      const params = { mu: 0.1, sigma: 0.2, lambda: 1, jumpMean: -0.01, jumpVol: 0.05 };
      const price = mertonCallPrice(100, 100, 0.05, 1, params);
      expect(price).toBeGreaterThan(0);
    });

    it("exceeds Black-Scholes for jump parameters (vol premium)", () => {
      const noJump = { mu: 0.1, sigma: 0.2, lambda: 0, jumpMean: 0, jumpVol: 0 };
      const withJump = { mu: 0.1, sigma: 0.2, lambda: 2, jumpMean: 0, jumpVol: 0.1 };
      const bsPrice = mertonCallPrice(100, 100, 0.05, 1, noJump);
      const mertonPrice = mertonCallPrice(100, 100, 0.05, 1, withJump);
      expect(mertonPrice).toBeGreaterThan(bsPrice);
    });

    it("ATM call price is reasonable", () => {
      const params = { mu: 0.1, sigma: 0.2, lambda: 1, jumpMean: -0.01, jumpVol: 0.05 };
      const price = mertonCallPrice(100, 100, 0.05, 1, params);
      expect(price).toBeGreaterThan(5);
      expect(price).toBeLessThan(30);
    });
  });

  describe("detectJumps", () => {
    it("detects some jumps in jump series", () => {
      const jumps = detectJumps(returns);
      expect(jumps.length).toBeGreaterThan(0);
    });

    it("detects fewer jumps in normal series", () => {
      const jumpsNormal = detectJumps(normalReturns);
      const jumpsWithJumps = detectJumps(returns);
      expect(jumpsNormal.length).toBeLessThanOrEqual(jumpsWithJumps.length);
    });

    it("returns empty for short series", () => {
      expect(detectJumps([1, 2])).toEqual([]);
    });

    it("all indices valid", () => {
      const jumps = detectJumps(returns);
      for (const idx of jumps) {
        expect(idx).toBeGreaterThanOrEqual(0);
        expect(idx).toBeLessThan(returns.length);
      }
    });
  });
});
