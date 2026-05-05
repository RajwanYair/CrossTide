import { describe, it, expect } from "vitest";
import { computeDividendSummary, simulateDrip } from "../../../src/domain/dividend-analytics";
import type { DividendPayment } from "../../../src/domain/dividend-analytics";

const quarterlyDividends: DividendPayment[] = [
  { date: "2022-03-15", amount: 0.5 },
  { date: "2022-06-15", amount: 0.5 },
  { date: "2022-09-15", amount: 0.5 },
  { date: "2022-12-15", amount: 0.5 },
  { date: "2023-03-15", amount: 0.55 },
  { date: "2023-06-15", amount: 0.55 },
  { date: "2023-09-15", amount: 0.55 },
  { date: "2023-12-15", amount: 0.55 },
  { date: "2024-03-15", amount: 0.6 },
  { date: "2024-06-15", amount: 0.6 },
  { date: "2024-09-15", amount: 0.6 },
  { date: "2024-12-15", amount: 0.6 },
];

describe("computeDividendSummary", () => {
  it("returns null for empty dividends", () => {
    expect(computeDividendSummary([], 100)).toBeNull();
  });

  it("returns null for zero price", () => {
    expect(computeDividendSummary([{ date: "2024-01-01", amount: 1 }], 0)).toBeNull();
  });

  it("computes total dividends", () => {
    const result = computeDividendSummary(quarterlyDividends, 100)!;
    // 4*0.5 + 4*0.55 + 4*0.6 = 2 + 2.2 + 2.4 = 6.6
    expect(result.totalDividends).toBeCloseTo(6.6, 4);
  });

  it("computes current yield from last 4 payments", () => {
    const result = computeDividendSummary(quarterlyDividends, 100)!;
    // Last 4 payments: 4 * 0.6 = 2.4, yield = 2.4/100 = 0.024
    expect(result.currentYield).toBeCloseTo(0.024, 4);
  });

  it("annualizes yield with fewer than 4 payments", () => {
    const few: DividendPayment[] = [{ date: "2024-06-15", amount: 0.5 }];
    const result = computeDividendSummary(few, 100)!;
    // 0.5 / 1 * 4 = 2.0, yield = 2.0/100 = 0.02
    expect(result.currentYield).toBeCloseTo(0.02, 4);
  });

  it("computes positive CAGR for growing dividends", () => {
    const result = computeDividendSummary(quarterlyDividends, 100)!;
    expect(result.dividendCagr).toBeGreaterThan(0);
  });

  it("computes growth streak", () => {
    const result = computeDividendSummary(quarterlyDividends, 100)!;
    // 2022→2023 increased, 2023→2024 increased → 3 years streak
    expect(result.growthStreak).toBe(3);
  });

  it("returns correct payment count", () => {
    const result = computeDividendSummary(quarterlyDividends, 100)!;
    expect(result.paymentCount).toBe(12);
  });

  it("computes average payouts per year", () => {
    const result = computeDividendSummary(quarterlyDividends, 100)!;
    expect(result.avgPayoutsPerYear).toBeCloseTo(4, 0);
  });
});

describe("simulateDrip", () => {
  it("returns null for empty dividends", () => {
    expect(simulateDrip(100, [], [], 150)).toBeNull();
  });

  it("returns null for mismatched arrays", () => {
    const divs: DividendPayment[] = [{ date: "2024-01-01", amount: 1 }];
    expect(simulateDrip(100, divs, [50, 60], 150)).toBeNull();
  });

  it("returns null for invalid inputs", () => {
    const divs: DividendPayment[] = [{ date: "2024-01-01", amount: 1 }];
    expect(simulateDrip(0, divs, [50], 150)).toBeNull();
    expect(simulateDrip(100, divs, [50], 0)).toBeNull();
    expect(simulateDrip(100, divs, [0], 150)).toBeNull();
  });

  it("DRIP increases share count", () => {
    const divs: DividendPayment[] = [
      { date: "2024-03-15", amount: 1 },
      { date: "2024-06-15", amount: 1 },
    ];
    const result = simulateDrip(100, divs, [50, 55], 60)!;
    expect(result.finalShares).toBeGreaterThan(100);
    expect(result.sharesFromDrip).toBeGreaterThan(0);
  });

  it("DRIP benefit is positive when prices rise", () => {
    const divs: DividendPayment[] = [
      { date: "2024-03-15", amount: 0.5 },
      { date: "2024-06-15", amount: 0.5 },
      { date: "2024-09-15", amount: 0.5 },
      { date: "2024-12-15", amount: 0.5 },
    ];
    const prices = [100, 110, 120, 130];
    const result = simulateDrip(100, divs, prices, 140)!;
    expect(result.dripBenefit).toBeGreaterThan(0);
    expect(result.finalValue).toBeGreaterThan(result.valueWithoutDrip);
  });

  it("computes correct values for simple case", () => {
    // 100 shares, one $1 dividend at price $100 → buy 1 share → 101 shares
    const divs: DividendPayment[] = [{ date: "2024-06-15", amount: 1 }];
    const result = simulateDrip(100, divs, [100], 100)!;
    expect(result.finalShares).toBeCloseTo(101, 4);
    expect(result.totalDividendsReceived).toBeCloseTo(100, 4);
    expect(result.sharesFromDrip).toBeCloseTo(1, 4);
  });
});
