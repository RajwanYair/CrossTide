import { describe, it, expect } from "vitest";
import {
  riskBasedSize,
  atrBasedSize,
  fixedFractionalSize,
  kellyFraction,
  halfKellySize,
} from "../../../src/domain/position-sizing";

describe("position-sizing", () => {
  it("riskBasedSize: 1% of $10k risking $0.50 per share = 200 shares", () => {
    expect(
      riskBasedSize({
        accountEquity: 10000,
        riskPerTrade: 0.01,
        entry: 100,
        stopLoss: 99.5,
      }),
    ).toBe(200);
  });

  it("riskBasedSize returns 0 when stop equals entry", () => {
    expect(
      riskBasedSize({
        accountEquity: 10000,
        riskPerTrade: 0.01,
        entry: 100,
        stopLoss: 100,
      }),
    ).toBe(0);
  });

  it("riskBasedSize handles zero or negative equity", () => {
    expect(
      riskBasedSize({
        accountEquity: 0,
        riskPerTrade: 0.01,
        entry: 100,
        stopLoss: 99,
      }),
    ).toBe(0);
  });

  it("atrBasedSize uses 2x ATR by default", () => {
    expect(atrBasedSize({ accountEquity: 10000, riskPerTrade: 0.01, atr: 1 })).toBe(50);
  });

  it("atrBasedSize respects multiplier", () => {
    expect(
      atrBasedSize({
        accountEquity: 10000,
        riskPerTrade: 0.01,
        atr: 1,
        atrMultiplier: 1,
      }),
    ).toBe(100);
  });

  it("atrBasedSize returns 0 for non-positive atr", () => {
    expect(atrBasedSize({ accountEquity: 1000, riskPerTrade: 0.01, atr: 0 })).toBe(0);
  });

  it("fixedFractionalSize", () => {
    expect(fixedFractionalSize(10000, 0.1, 50)).toBe(20);
  });

  it("fixedFractionalSize handles bad inputs", () => {
    expect(fixedFractionalSize(0, 0.1, 50)).toBe(0);
    expect(fixedFractionalSize(10000, 0, 50)).toBe(0);
    expect(fixedFractionalSize(10000, 0.1, 0)).toBe(0);
  });

  it("kellyFraction sample", () => {
    // 60% wins, 1:1 W/L → f = 0.6 - 0.4/1 = 0.2
    expect(kellyFraction({ winRate: 0.6, avgWin: 1, avgLoss: 1 })).toBeCloseTo(0.2, 5);
  });

  it("kellyFraction returns 0 for negative edge", () => {
    expect(kellyFraction({ winRate: 0.4, avgWin: 1, avgLoss: 1 })).toBe(0);
  });

  it("kellyFraction caps at 1", () => {
    const f = kellyFraction({ winRate: 0.99, avgWin: 100, avgLoss: 1 });
    expect(f).toBeLessThanOrEqual(1);
  });

  it("halfKellySize is half the kelly position", () => {
    const shares = halfKellySize({ winRate: 0.6, avgWin: 1, avgLoss: 1 }, 10000, 100);
    // Kelly fraction = 0.2, half = 0.1, equity 10k, price 100 → 10 shares
    expect(shares).toBeCloseTo(10, 5);
  });

  it("halfKellySize handles bad inputs", () => {
    expect(halfKellySize({ winRate: 0.6, avgWin: 1, avgLoss: 1 }, 0, 100)).toBe(0);
  });
});
