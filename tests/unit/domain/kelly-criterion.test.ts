import { describe, it, expect } from "vitest";
import {
  kellyFraction,
  kellyAnalysis,
  kellyFromTrades,
  kellyPositionSize,
} from "../../../src/domain/kelly-criterion";

describe("kelly-criterion", () => {
  it("kellyFraction basic calculation", () => {
    // 60% win rate, 1:1 ratio → K = 0.6 - 0.4/1 = 0.2
    expect(kellyFraction(0.6, 1)).toBeCloseTo(0.2);
  });

  it("kellyFraction with 2:1 ratio", () => {
    // 50% win rate, 2:1 ratio → K = 0.5 - 0.5/2 = 0.25
    expect(kellyFraction(0.5, 2)).toBeCloseTo(0.25);
  });

  it("kellyFraction negative for losing system", () => {
    // 30% win rate, 1:1 ratio → K = 0.3 - 0.7/1 = -0.4
    expect(kellyFraction(0.3, 1)).toBeCloseTo(-0.4);
  });

  it("kellyFraction zero ratio returns 0", () => {
    expect(kellyFraction(0.5, 0)).toBe(0);
  });

  it("kellyAnalysis provides all metrics", () => {
    const result = kellyAnalysis({ winRate: 0.6, avgWin: 100, avgLoss: 80 });
    expect(result.fullKelly).toBeGreaterThan(0);
    expect(result.halfKelly).toBeCloseTo(result.fullKelly / 2);
    expect(result.quarterKelly).toBeCloseTo(result.fullKelly / 4);
    expect(result.isPositive).toBe(true);
    expect(result.edge).toBeGreaterThan(0);
  });

  it("kellyAnalysis negative system", () => {
    const result = kellyAnalysis({ winRate: 0.3, avgWin: 50, avgLoss: 100 });
    expect(result.isPositive).toBe(false);
    expect(result.fullKelly).toBeLessThan(0);
    expect(result.edge).toBeLessThan(0);
  });

  it("kellyAnalysis invalid input returns zeros", () => {
    const result = kellyAnalysis({ winRate: 0.5, avgWin: 100, avgLoss: 0 });
    expect(result.fullKelly).toBe(0);
  });

  it("kellyFromTrades computes from P&L array", () => {
    const pnls = [100, -50, 100, -50, 100, -50, 100, -50, 100, -50];
    // 50% win rate, 2:1 ratio
    const result = kellyFromTrades(pnls);
    expect(result.fullKelly).toBeCloseTo(0.25);
    expect(result.isPositive).toBe(true);
  });

  it("kellyFromTrades empty returns zeros", () => {
    const result = kellyFromTrades([]);
    expect(result.fullKelly).toBe(0);
    expect(result.isPositive).toBe(false);
  });

  it("kellyPositionSize clamps to maxRisk", () => {
    expect(kellyPositionSize(100000, 0.5, 0.25)).toBe(25000);
  });

  it("kellyPositionSize uses kelly when below max", () => {
    expect(kellyPositionSize(100000, 0.1, 0.25)).toBe(10000);
  });

  it("kellyPositionSize clamps negative to zero", () => {
    expect(kellyPositionSize(100000, -0.2, 0.25)).toBe(0);
  });
});
