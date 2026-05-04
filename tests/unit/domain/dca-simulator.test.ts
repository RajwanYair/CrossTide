import { describe, it, expect } from "vitest";
import {
  simulateDca,
  generateDcaSchedule,
  dcaVsLumpSum,
  runningCostBasis,
} from "../../../src/domain/dca-simulator";

describe("dca-simulator", () => {
  const investments = [
    { date: "2026-01-01", price: 100, amount: 500 },
    { date: "2026-02-01", price: 80, amount: 500 },
    { date: "2026-03-01", price: 120, amount: 500 },
  ];

  it("simulateDca calculates correct totals", () => {
    const result = simulateDca(investments, 110);
    expect(result.totalInvested).toBe(1500);
    // 5 + 6.25 + 4.166 = 15.416 shares
    expect(result.totalShares).toBeCloseTo(15.4167, 2);
    expect(result.investmentCount).toBe(3);
  });

  it("simulateDca computes average cost", () => {
    const result = simulateDca(investments, 110);
    // 1500 / 15.4167 ≈ 97.30
    expect(result.averageCost).toBeCloseTo(97.3, 0);
  });

  it("simulateDca computes gain/loss", () => {
    const result = simulateDca(investments, 110);
    expect(result.currentValue).toBeCloseTo(15.4167 * 110, 0);
    expect(result.gainLoss).toBeGreaterThan(0);
    expect(result.gainLossPercent).toBeGreaterThan(0);
  });

  it("simulateDca handles empty investments", () => {
    const result = simulateDca([], 100);
    expect(result.totalInvested).toBe(0);
    expect(result.totalShares).toBe(0);
    expect(result.averageCost).toBe(0);
  });

  it("generateDcaSchedule creates intervals", () => {
    const prices = [
      { date: "2026-01-01", price: 100 },
      { date: "2026-01-15", price: 105 },
      { date: "2026-02-01", price: 110 },
      { date: "2026-03-05", price: 108 },
    ];
    const schedule = generateDcaSchedule(prices, 200, 30);
    expect(schedule.length).toBeGreaterThanOrEqual(2);
    expect(schedule[0]!.amount).toBe(200);
  });

  it("generateDcaSchedule returns empty for no prices", () => {
    expect(generateDcaSchedule([], 100)).toEqual([]);
  });

  it("dcaVsLumpSum compares strategies", () => {
    const result = dcaVsLumpSum(investments, 110, 100);
    expect(typeof result.dcaReturn).toBe("number");
    expect(typeof result.lumpSumReturn).toBe("number");
    expect(typeof result.dcaWins).toBe("boolean");
  });

  it("dcaVsLumpSum lump sum wins in bull market", () => {
    const bullInvestments = [
      { date: "2026-01-01", price: 100, amount: 500 },
      { date: "2026-02-01", price: 120, amount: 500 },
      { date: "2026-03-01", price: 140, amount: 500 },
    ];
    const result = dcaVsLumpSum(bullInvestments, 160, 100);
    // Lump sum at 100 with 1500 → 15 shares × 160 = 2400 → 60% return
    // DCA buys at higher prices → lower return
    expect(result.lumpSumReturn).toBeGreaterThan(result.dcaReturn);
    expect(result.dcaWins).toBe(false);
  });

  it("runningCostBasis tracks average over time", () => {
    const basis = runningCostBasis(investments);
    expect(basis).toHaveLength(3);
    expect(basis[0]).toBe(100); // First buy at 100
    expect(basis[1]).toBeLessThan(100); // Second buy at 80 lowers avg
  });

  it("simulateDca skips zero-price entries", () => {
    const data = [
      { date: "2026-01-01", price: 100, amount: 500 },
      { date: "2026-02-01", price: 0, amount: 500 },
    ];
    const result = simulateDca(data, 110);
    expect(result.totalShares).toBe(5);
    expect(result.totalInvested).toBe(500);
  });
});
