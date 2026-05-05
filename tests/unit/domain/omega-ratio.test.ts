import { describe, it, expect } from "vitest";
import { computeOmega, omegaFromReturns } from "../../../src/domain/omega-ratio";
import { makeCandles } from "../../helpers/candle-factory";

describe("computeOmega", () => {
  it("returns null for insufficient data", () => {
    const candles = makeCandles([100]);
    expect(computeOmega(candles)).toBeNull();
  });

  it("returns omega > 1 for consistently rising prices", () => {
    const prices = Array.from({ length: 60 }, (_, i) => 100 + i * 2);
    const result = computeOmega(makeCandles(prices));
    expect(result).not.toBeNull();
    expect(result!.omega).toBeGreaterThan(1);
    expect(result!.totalGain).toBeGreaterThan(0);
  });

  it("returns omega < 1 for consistently falling prices", () => {
    const prices = Array.from({ length: 60 }, (_, i) => 200 - i * 2);
    const result = computeOmega(makeCandles(prices));
    expect(result).not.toBeNull();
    expect(result!.omega).toBeLessThan(1);
    expect(result!.totalLoss).toBeGreaterThan(0);
  });

  it("returns Infinity when all returns are above threshold", () => {
    // Strictly rising prices → all positive returns, zero loss
    const prices = [100, 110, 120, 130, 140];
    const result = computeOmega(makeCandles(prices));
    expect(result).not.toBeNull();
    expect(result!.omega).toBe(Infinity);
    expect(result!.totalLoss).toBe(0);
  });

  it("supports custom threshold", () => {
    const prices = Array.from({ length: 60 }, (_, i) => 100 + i);
    // With a high threshold, fewer returns qualify as "gains"
    const resultLow = computeOmega(makeCandles(prices), { threshold: 0 });
    const resultHigh = computeOmega(makeCandles(prices), { threshold: 0.02 });
    expect(resultLow).not.toBeNull();
    expect(resultHigh).not.toBeNull();
    expect(resultLow!.omega).toBeGreaterThan(resultHigh!.omega);
  });

  it("reports correct observation count", () => {
    const prices = [100, 101, 102, 103, 104];
    const result = computeOmega(makeCandles(prices));
    expect(result).not.toBeNull();
    expect(result!.observations).toBe(4);
  });

  it("returns 1 when no returns (all same price)", () => {
    const prices = [100, 100, 100, 100];
    const result = computeOmega(makeCandles(prices));
    expect(result).not.toBeNull();
    // All returns are 0, threshold is 0: no gain, no loss
    expect(result!.omega).toBe(1);
  });
});

describe("omegaFromReturns", () => {
  it("returns null for empty array", () => {
    expect(omegaFromReturns([])).toBeNull();
  });

  it("returns correct omega for mixed returns", () => {
    const returns = [0.01, -0.02, 0.03, -0.01, 0.02, -0.005];
    const result = omegaFromReturns(returns);
    expect(result).not.toBeNull();
    expect(result!).toBeGreaterThan(0);
  });

  it("returns Infinity for all positive returns", () => {
    expect(omegaFromReturns([0.01, 0.02, 0.03])).toBe(Infinity);
  });

  it("returns 0 for all negative returns", () => {
    expect(omegaFromReturns([-0.01, -0.02, -0.03])).toBe(0);
  });

  it("respects threshold parameter", () => {
    const returns = [0.01, 0.02, 0.03, 0.04, 0.05];
    // With threshold=0.04, only 0.05 is a "gain" (excess=0.01)
    // Losses: 0.01-0.04=-0.03, 0.02-0.04=-0.02, 0.03-0.04=-0.01, 0.04-0.04=0
    // totalLoss = 0.06, totalGain = 0.01 → omega = 0.167
    const result = omegaFromReturns(returns, 0.04);
    expect(result).not.toBeNull();
    expect(result!).toBeLessThan(1);
  });
});
