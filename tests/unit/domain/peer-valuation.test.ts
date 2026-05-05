import { describe, it, expect } from "vitest";
import { computePeerValuation } from "../../../src/domain/peer-valuation";
import type { CompanyMetrics } from "../../../src/domain/peer-valuation";

const target: CompanyMetrics = {
  symbol: "AAPL",
  pe: 25,
  ps: 8,
  pb: 40,
  evEbitda: 20,
  peg: 1.5,
  dividendYield: 0.006,
  marketCap: 3e12,
};

const peers: CompanyMetrics[] = [
  {
    symbol: "MSFT",
    pe: 30,
    ps: 12,
    pb: 15,
    evEbitda: 22,
    peg: 2.0,
    dividendYield: 0.008,
    marketCap: 2.8e12,
  },
  {
    symbol: "GOOG",
    pe: 22,
    ps: 6,
    pb: 7,
    evEbitda: 16,
    peg: 1.2,
    dividendYield: null,
    marketCap: 2e12,
  },
  {
    symbol: "META",
    pe: 18,
    ps: 7,
    pb: 8,
    evEbitda: 14,
    peg: 1.0,
    dividendYield: 0.004,
    marketCap: 1.2e12,
  },
];

describe("computePeerValuation", () => {
  it("returns null for fewer than 2 peers", () => {
    expect(computePeerValuation(target, [peers[0]!])).toBeNull();
  });

  it("returns correct target symbol", () => {
    const result = computePeerValuation(target, peers)!;
    expect(result.target).toBe("AAPL");
    expect(result.peerCount).toBe(3);
  });

  it("returns 6 metric comparisons", () => {
    const result = computePeerValuation(target, peers)!;
    expect(result.comparisons.length).toBe(6);
    const labels = result.comparisons.map((c) => c.metric);
    expect(labels).toContain("P/E");
    expect(labels).toContain("P/S");
    expect(labels).toContain("P/B");
    expect(labels).toContain("EV/EBITDA");
    expect(labels).toContain("PEG");
    expect(labels).toContain("Dividend Yield");
  });

  it("computes percentile rank correctly", () => {
    const result = computePeerValuation(target, peers)!;
    const pe = result.comparisons.find((c) => c.metric === "P/E")!;
    // AAPL PE=25, peers=[30, 22, 18] → 2 below (22,18) → rank = 67%
    expect(pe.percentileRank).toBe(67);
  });

  it("identifies undervalued metrics (lower is better)", () => {
    const result = computePeerValuation(target, peers)!;
    const pe = result.comparisons.find((c) => c.metric === "P/E")!;
    // AAPL PE=25, peer median=22 → not undervalued (25 > 22)
    expect(pe.undervalued).toBe(false);

    const peg = result.comparisons.find((c) => c.metric === "PEG")!;
    // AAPL PEG=1.5, peer median=1.2 → not undervalued
    expect(peg.undervalued).toBe(false);
  });

  it("computes z-score", () => {
    const result = computePeerValuation(target, peers)!;
    const pe = result.comparisons.find((c) => c.metric === "P/E")!;
    expect(pe.zScore).not.toBeNull();
    expect(typeof pe.zScore).toBe("number");
  });

  it("handles null metric values gracefully", () => {
    const result = computePeerValuation(target, peers)!;
    const dy = result.comparisons.find((c) => c.metric === "Dividend Yield")!;
    // GOOG has null dividendYield → only 2 peers with values
    expect(dy.peerMedian).not.toBeNull();
  });

  it("valuationScore is between 0 and 100", () => {
    const result = computePeerValuation(target, peers)!;
    expect(result.valuationScore).toBeGreaterThanOrEqual(0);
    expect(result.valuationScore).toBeLessThanOrEqual(100);
  });

  it("cheap target scores higher", () => {
    const cheapTarget: CompanyMetrics = {
      symbol: "CHEAP",
      pe: 10,
      ps: 2,
      pb: 3,
      evEbitda: 8,
      peg: 0.5,
      dividendYield: 0.05,
      marketCap: 5e9,
    };
    const result = computePeerValuation(cheapTarget, peers)!;
    expect(result.valuationScore).toBeGreaterThanOrEqual(50);
  });

  it("expensive target scores lower", () => {
    const expensiveTarget: CompanyMetrics = {
      symbol: "EXPENSIVE",
      pe: 100,
      ps: 50,
      pb: 80,
      evEbitda: 60,
      peg: 5,
      dividendYield: 0.001,
      marketCap: 1e13,
    };
    const result = computePeerValuation(expensiveTarget, peers)!;
    expect(result.valuationScore).toBeLessThanOrEqual(50);
  });
});
