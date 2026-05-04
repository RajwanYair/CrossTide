import { describe, it, expect } from "vitest";
import { profitFactor, equityCurve } from "../../../src/domain/profit-factor";

const trades = [
  { pnl: 200, holdingPeriod: 5 },
  { pnl: -100, holdingPeriod: 3 },
  { pnl: 150, holdingPeriod: 7 },
  { pnl: 300, holdingPeriod: 10 },
  { pnl: -50, holdingPeriod: 2 },
  { pnl: -80, holdingPeriod: 4 },
  { pnl: 120, holdingPeriod: 6 },
  { pnl: 250, holdingPeriod: 8 },
  { pnl: -30, holdingPeriod: 1 },
  { pnl: 180, holdingPeriod: 5 },
];

describe("profit-factor", () => {
  it("profitFactor computes correct ratio", () => {
    const result = profitFactor(trades);
    // Wins: 200+150+300+120+250+180 = 1200; Losses: 100+50+80+30 = 260
    expect(result.profitFactor).toBeCloseTo(1200 / 260);
  });

  it("profitFactor counts wins and losses", () => {
    const result = profitFactor(trades);
    expect(result.winCount).toBe(6);
    expect(result.lossCount).toBe(4);
  });

  it("profitFactor winRate is correct", () => {
    const result = profitFactor(trades);
    expect(result.winRate).toBeCloseTo(0.6);
  });

  it("profitFactor avgWin and avgLoss", () => {
    const result = profitFactor(trades);
    expect(result.avgWin).toBeCloseTo(1200 / 6);
    expect(result.avgLoss).toBeCloseTo(260 / 4);
  });

  it("profitFactor expectancy is positive", () => {
    const result = profitFactor(trades);
    expect(result.expectancy).toBeGreaterThan(0);
  });

  it("profitFactor finds largest win and loss", () => {
    const result = profitFactor(trades);
    expect(result.largestWin).toBe(300);
    expect(result.largestLoss).toBe(-100); // most negative
  });

  it("profitFactor consecutive streaks", () => {
    const result = profitFactor(trades);
    expect(result.consecutiveWins).toBeGreaterThanOrEqual(2);
    expect(result.consecutiveLosses).toBeGreaterThanOrEqual(1);
  });

  it("profitFactor avgHoldingPeriod", () => {
    const result = profitFactor(trades);
    expect(result.avgHoldingPeriod).toBeCloseTo(5.1);
  });

  it("profitFactor empty returns zeros", () => {
    const result = profitFactor([]);
    expect(result.profitFactor).toBe(0);
    expect(result.winRate).toBe(0);
  });

  it("profitFactor all wins returns Infinity", () => {
    const result = profitFactor([{ pnl: 100 }, { pnl: 50 }]);
    expect(result.profitFactor).toBe(Infinity);
  });

  it("equityCurve builds correctly", () => {
    const curve = equityCurve(trades, 10000);
    expect(curve[0]).toBe(10000);
    expect(curve).toHaveLength(11);
    expect(curve[curve.length - 1]).toBe(10000 + 940); // net P/L = 1200-260 = 940
  });
});
