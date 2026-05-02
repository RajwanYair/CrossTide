/**
 * Tests for G18 — ETF Constituent Drilldown domain.
 */
import { describe, it, expect } from "vitest";
import {
  buildEtfDrilldown,
  topHoldingsByWeight,
  topHoldersByContribution,
  positiveContributors,
  negativeContributors,
  type EtfHolding,
} from "../../../src/domain/etf-drilldown";

// ─── fixtures ─────────────────────────────────────────────────────────────────

const HOLDINGS: EtfHolding[] = [
  { ticker: "AAPL", weight: 0.073, changePercent: 1.5 },
  { ticker: "MSFT", weight: 0.065, changePercent: -0.8 },
  { ticker: "NVDA", weight: 0.058, changePercent: 3.2 },
  { ticker: "AMZN", weight: 0.035, changePercent: -1.1 },
  { ticker: "META", weight: 0.022, changePercent: 2.0 },
];

// ─── buildEtfDrilldown ────────────────────────────────────────────────────────

describe("buildEtfDrilldown", () => {
  it("returns empty result for empty holdings", () => {
    const r = buildEtfDrilldown("SPY", []);
    expect(r.entries).toHaveLength(0);
    expect(r.estimatedChangePercent).toBe(0);
    expect(r.totalWeight).toBe(0);
  });

  it("sets etfTicker on result", () => {
    const r = buildEtfDrilldown("QQQ", HOLDINGS);
    expect(r.etfTicker).toBe("QQQ");
  });

  it("produces one entry per holding", () => {
    const r = buildEtfDrilldown("QQQ", HOLDINGS);
    expect(r.entries).toHaveLength(5);
  });

  it("sorts entries by weight descending", () => {
    const r = buildEtfDrilldown("QQQ", HOLDINGS);
    const weights = r.entries.map((e) => e.weight);
    expect(weights).toEqual([...weights].sort((a, b) => b - a));
  });

  it("computes weightedContribution = weight × changePercent", () => {
    const r = buildEtfDrilldown("QQQ", HOLDINGS);
    for (const entry of r.entries) {
      expect(entry.weightedContribution).toBeCloseTo(entry.weight * entry.changePercent, 8);
    }
  });

  it("estimatedChangePercent is sum of all weightedContributions", () => {
    const r = buildEtfDrilldown("QQQ", HOLDINGS);
    const expected = r.entries.reduce((s, e) => s + e.weightedContribution, 0);
    expect(r.estimatedChangePercent).toBeCloseTo(expected, 8);
  });

  it("totalWeight is sum of all weights", () => {
    const r = buildEtfDrilldown("QQQ", HOLDINGS);
    const expected = HOLDINGS.reduce((s, h) => s + h.weight, 0);
    expect(r.totalWeight).toBeCloseTo(expected, 8);
  });

  it("attributionShares sum to 1", () => {
    const r = buildEtfDrilldown("QQQ", HOLDINGS);
    const total = r.entries.reduce((s, e) => s + e.attributionShare, 0);
    expect(total).toBeCloseTo(1, 6);
  });

  it("attributionShares are non-negative", () => {
    const r = buildEtfDrilldown("QQQ", HOLDINGS);
    for (const e of r.entries) {
      expect(e.attributionShare).toBeGreaterThanOrEqual(0);
    }
  });

  it("attributionShare is 0 when all contributions are zero", () => {
    const zeroHoldings: EtfHolding[] = [
      { ticker: "A", weight: 0.5, changePercent: 0 },
      { ticker: "B", weight: 0.5, changePercent: 0 },
    ];
    const r = buildEtfDrilldown("ZZZ", zeroHoldings);
    for (const e of r.entries) {
      expect(e.attributionShare).toBe(0);
    }
  });

  it("handles single holding", () => {
    const r = buildEtfDrilldown("SINGLE", [{ ticker: "X", weight: 1.0, changePercent: 2.0 }]);
    expect(r.entries).toHaveLength(1);
    expect(r.entries[0]!.weightedContribution).toBeCloseTo(2.0, 8);
    expect(r.entries[0]!.attributionShare).toBeCloseTo(1.0, 6);
  });
});

// ─── topHoldingsByWeight ──────────────────────────────────────────────────────

describe("topHoldingsByWeight", () => {
  it("returns top n entries by weight", () => {
    const r = buildEtfDrilldown("QQQ", HOLDINGS);
    const top3 = topHoldingsByWeight(r, 3);
    expect(top3).toHaveLength(3);
    expect(top3[0]!.ticker).toBe("AAPL");
    expect(top3[1]!.ticker).toBe("MSFT");
    expect(top3[2]!.ticker).toBe("NVDA");
  });

  it("returns all entries when n exceeds length", () => {
    const r = buildEtfDrilldown("QQQ", HOLDINGS);
    expect(topHoldingsByWeight(r, 100)).toHaveLength(5);
  });
});

// ─── topHoldersByContribution ─────────────────────────────────────────────────

describe("topHoldersByContribution", () => {
  it("ranks by absolute weighted contribution", () => {
    const r = buildEtfDrilldown("QQQ", HOLDINGS);
    const top = topHoldersByContribution(r, 2);
    // AAPL: 0.073 * 1.5 = 0.1095; NVDA: 0.058 * 3.2 = 0.1856
    // NVDA has higher absolute contribution
    expect(top[0]!.ticker).toBe("NVDA");
    expect(top[1]!.ticker).toBe("AAPL");
  });

  it("does not mutate the result entries order", () => {
    const r = buildEtfDrilldown("QQQ", HOLDINGS);
    const originalOrder = r.entries.map((e) => e.ticker);
    topHoldersByContribution(r, 3);
    expect(r.entries.map((e) => e.ticker)).toEqual(originalOrder);
  });
});

// ─── positiveContributors / negativeContributors ──────────────────────────────

describe("positiveContributors", () => {
  it("returns only entries with positive contribution", () => {
    const r = buildEtfDrilldown("QQQ", HOLDINGS);
    const pos = positiveContributors(r);
    for (const e of pos) {
      expect(e.weightedContribution).toBeGreaterThan(0);
    }
  });

  it("sorts by contribution descending", () => {
    const r = buildEtfDrilldown("QQQ", HOLDINGS);
    const pos = positiveContributors(r);
    const contributions = pos.map((e) => e.weightedContribution);
    expect(contributions).toEqual([...contributions].sort((a, b) => b - a));
  });
});

describe("negativeContributors", () => {
  it("returns only entries with negative contribution", () => {
    const r = buildEtfDrilldown("QQQ", HOLDINGS);
    const neg = negativeContributors(r);
    for (const e of neg) {
      expect(e.weightedContribution).toBeLessThan(0);
    }
  });

  it("sorts worst drag first (ascending contribution)", () => {
    const r = buildEtfDrilldown("QQQ", HOLDINGS);
    const neg = negativeContributors(r);
    const contributions = neg.map((e) => e.weightedContribution);
    expect(contributions).toEqual([...contributions].sort((a, b) => a - b));
  });
});
