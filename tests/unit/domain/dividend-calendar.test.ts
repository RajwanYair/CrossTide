import { describe, it, expect } from "vitest";
import {
  projectIncome,
  totalAnnualIncome,
  monthlyBreakdown,
  upcomingExDates,
  dividendYield,
} from "../../../src/domain/dividend-calendar";

describe("dividend-calendar", () => {
  const entries = [
    {
      ticker: "AAPL",
      exDate: "2026-02-10",
      payDate: "2026-02-15",
      amount: 0.25,
      frequency: "quarterly" as const,
    },
    {
      ticker: "AAPL",
      exDate: "2026-05-10",
      payDate: "2026-05-15",
      amount: 0.25,
      frequency: "quarterly" as const,
    },
    {
      ticker: "AAPL",
      exDate: "2026-08-10",
      payDate: "2026-08-15",
      amount: 0.25,
      frequency: "quarterly" as const,
    },
    {
      ticker: "MSFT",
      exDate: "2026-03-15",
      payDate: "2026-03-20",
      amount: 0.75,
      frequency: "quarterly" as const,
    },
    {
      ticker: "MSFT",
      exDate: "2026-06-15",
      payDate: "2026-06-20",
      amount: 0.75,
      frequency: "quarterly" as const,
    },
  ];

  const holdings = new Map([
    ["AAPL", 100],
    ["MSFT", 50],
  ]);

  it("projectIncome calculates annual income per ticker", () => {
    const projections = projectIncome(entries, holdings);
    const aapl = projections.find((p) => p.ticker === "AAPL")!;
    expect(aapl.annualPerShare).toBe(1); // 0.25 * 4
    expect(aapl.annualIncome).toBe(100); // 1 * 100 shares
  });

  it("projectIncome calculates monthly income", () => {
    const projections = projectIncome(entries, holdings);
    const msft = projections.find((p) => p.ticker === "MSFT")!;
    expect(msft.monthlyIncome).toBeCloseTo(msft.annualIncome / 12, 5);
  });

  it("projectIncome skips tickers without holdings", () => {
    const noHoldings = new Map<string, number>();
    const projections = projectIncome(entries, noHoldings);
    expect(projections).toHaveLength(0);
  });

  it("totalAnnualIncome sums all projections", () => {
    const projections = projectIncome(entries, holdings);
    const total = totalAnnualIncome(projections);
    // AAPL: 100, MSFT: 0.75*4*50=150
    expect(total).toBe(250);
  });

  it("monthlyBreakdown splits income by month", () => {
    const breakdown = monthlyBreakdown(entries, holdings);
    expect(breakdown).toHaveLength(12);
    const feb = breakdown.find((m) => m.month === 2)!;
    expect(feb.total).toBe(25); // AAPL: 0.25 * 100
    expect(feb.tickers).toContain("AAPL");
  });

  it("upcomingExDates filters within range", () => {
    const upcoming = upcomingExDates(entries, 60, "2026-05-01");
    expect(upcoming.length).toBeGreaterThan(0);
    expect(upcoming[0]!.exDate).toBe("2026-05-10");
  });

  it("upcomingExDates returns empty for past dates", () => {
    const upcoming = upcomingExDates(entries, 30, "2026-12-01");
    expect(upcoming).toHaveLength(0);
  });

  it("dividendYield calculates correctly", () => {
    expect(dividendYield(4, 100)).toBe(4);
    expect(dividendYield(2, 50)).toBe(4);
  });

  it("dividendYield returns 0 for zero price", () => {
    expect(dividendYield(4, 0)).toBe(0);
  });

  it("projectIncome handles monthly frequency", () => {
    const monthly = [
      {
        ticker: "O",
        exDate: "2026-06-01",
        payDate: "2026-06-15",
        amount: 0.26,
        frequency: "monthly" as const,
      },
    ];
    const h = new Map([["O", 200]]);
    const proj = projectIncome(monthly, h);
    expect(proj[0]!.annualPerShare).toBeCloseTo(3.12, 5);
  });
});
