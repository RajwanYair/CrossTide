/**
 * Market Breadth card tests (G23).
 */
import { describe, it, expect, beforeEach } from "vitest";
import {
  computeBreadthSummary,
  renderDonut,
  renderADBar,
  renderMarketBreadth,
  type BreadthSummary,
} from "../../../src/cards/market-breadth-card";
import type { BreadthEntry } from "../../../src/cards/market-breadth-data";

function makeEntry(overrides: Partial<BreadthEntry> = {}): BreadthEntry {
  return {
    ticker: "TEST",
    price: 100,
    changePercent: 0,
    consensus: "NEUTRAL",
    aboveSma50: null,
    aboveSma200: null,
    ...overrides,
  };
}

// ── computeBreadthSummary ──────────────────────────────────────────────────
describe("computeBreadthSummary", () => {
  it("counts BUY/NEUTRAL/SELL correctly", () => {
    const entries = [
      makeEntry({ consensus: "BUY" }),
      makeEntry({ consensus: "BUY" }),
      makeEntry({ consensus: "SELL" }),
      makeEntry({ consensus: "NEUTRAL" }),
    ];
    const s = computeBreadthSummary(entries);
    expect(s.buyCount).toBe(2);
    expect(s.sellCount).toBe(1);
    expect(s.neutralCount).toBe(1);
  });

  it("counts advancers / decliners by changePercent threshold 0.05", () => {
    const entries = [
      makeEntry({ changePercent: 1.5 }), // advancer
      makeEntry({ changePercent: -2.0 }), // decliner
      makeEntry({ changePercent: 0.02 }), // unchanged
    ];
    const s = computeBreadthSummary(entries);
    expect(s.advancers).toBe(1);
    expect(s.decliners).toBe(1);
    expect(s.unchanged).toBe(1);
  });

  it("calculates aboveSma50Pct correctly", () => {
    const entries = [
      makeEntry({ aboveSma50: true }),
      makeEntry({ aboveSma50: true }),
      makeEntry({ aboveSma50: false }),
      makeEntry({ aboveSma50: null }), // excluded from calc
    ];
    const s = computeBreadthSummary(entries);
    expect(s.aboveSma50Pct).toBeCloseTo(2 / 3);
  });

  it("returns null aboveSma50Pct when all entries have null", () => {
    const entries = [makeEntry(), makeEntry()];
    const s = computeBreadthSummary(entries);
    expect(s.aboveSma50Pct).toBeNull();
    expect(s.aboveSma200Pct).toBeNull();
  });

  it("returns empty topMovers/topLaggards for empty input", () => {
    const s = computeBreadthSummary([]);
    expect(s.topMovers).toHaveLength(0);
    expect(s.topLaggards).toHaveLength(0);
  });

  it("returns top 3 movers sorted desc by changePercent", () => {
    const entries = [
      makeEntry({ ticker: "A", changePercent: 5 }),
      makeEntry({ ticker: "B", changePercent: 10 }),
      makeEntry({ ticker: "C", changePercent: 3 }),
      makeEntry({ ticker: "D", changePercent: 1 }),
    ];
    const s = computeBreadthSummary(entries);
    expect(s.topMovers[0]!.ticker).toBe("B");
    expect(s.topMovers[1]!.ticker).toBe("A");
    expect(s.topMovers[2]!.ticker).toBe("C");
  });

  it("returns top 3 laggards sorted asc by changePercent", () => {
    const entries = [
      makeEntry({ ticker: "A", changePercent: -5 }),
      makeEntry({ ticker: "B", changePercent: -10 }),
      makeEntry({ ticker: "C", changePercent: -3 }),
      makeEntry({ ticker: "D", changePercent: 2 }),
    ];
    const s = computeBreadthSummary(entries);
    expect(s.topLaggards[0]!.ticker).toBe("B");
    expect(s.topLaggards[1]!.ticker).toBe("A");
  });
});

// ── renderDonut ────────────────────────────────────────────────────────────
describe("renderDonut", () => {
  it("renders empty ring when all zeros", () => {
    const html = renderDonut(0, 0, 0);
    expect(html).toContain("<svg");
    expect(html).not.toContain("stroke-dasharray");
  });

  it("renders three circle elements for mixed signals", () => {
    const html = renderDonut(5, 3, 2);
    expect(html.match(/<circle/g)?.length).toBeGreaterThanOrEqual(3);
  });

  it("is an SVG element", () => {
    const html = renderDonut(1, 0, 0);
    expect(html.trim()).toMatch(/^<svg/);
  });
});

// ── renderADBar ────────────────────────────────────────────────────────────
describe("renderADBar", () => {
  it("renders empty state when all zeros", () => {
    const html = renderADBar(0, 0, 0);
    expect(html).toContain("empty-state");
  });

  it("renders segments with correct classes", () => {
    const html = renderADBar(5, 2, 3);
    expect(html).toContain("breadth-ad-up");
    expect(html).toContain("breadth-ad-flat");
    expect(html).toContain("breadth-ad-down");
  });

  it("shows advancer/decliner counts", () => {
    const html = renderADBar(7, 1, 2);
    expect(html).toContain("7");
    expect(html).toContain("2");
  });
});

// ── renderMarketBreadth ────────────────────────────────────────────────────
describe("renderMarketBreadth", () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement("div");
  });

  it("renders empty state when no entries", () => {
    renderMarketBreadth(container, []);
    expect(container.innerHTML).toContain("empty-state");
  });

  it("renders all four panels when data present", () => {
    const entries = [
      makeEntry({
        ticker: "AAPL",
        price: 150,
        changePercent: 1.2,
        consensus: "BUY",
        aboveSma50: true,
        aboveSma200: true,
      }),
      makeEntry({
        ticker: "MSFT",
        price: 300,
        changePercent: -0.5,
        consensus: "SELL",
        aboveSma50: false,
        aboveSma200: false,
      }),
    ];
    renderMarketBreadth(container, entries);
    expect(container.innerHTML).toContain("Signal Distribution");
    expect(container.innerHTML).toContain("MA Health");
    expect(container.innerHTML).toContain("Advance / Decline");
    expect(container.innerHTML).toContain("Top Movers");
    expect(container.innerHTML).toContain("Top Laggards");
  });

  it("displays ticker names in movers table", () => {
    const entries = [makeEntry({ ticker: "TSLA", changePercent: 5 })];
    renderMarketBreadth(container, entries);
    expect(container.innerHTML).toContain("TSLA");
  });
});
