/**
 * Watchlist renderer tests.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { renderWatchlist } from "../../../src/ui/watchlist";
import type { AppConfig, ConsensusResult } from "../../../src/types/domain";

function makeConfig(tickers: string[]): AppConfig {
  return {
    watchlist: tickers.map((t) => ({ ticker: t, addedAt: new Date().toISOString() })),
    theme: "dark",
  };
}

function makeQuote(
  ticker: string,
  overrides: Partial<{
    price: number;
    change: number;
    changePercent: number;
    volume: number;
    consensus: ConsensusResult | null;
  }> = {},
) {
  return {
    ticker,
    price: overrides.price ?? 100,
    change: overrides.change ?? 1.5,
    changePercent: overrides.changePercent ?? 1.5,
    volume: overrides.volume ?? 1_000_000,
    consensus: overrides.consensus ?? null,
  };
}

describe("renderWatchlist", () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <table>
        <tbody id="watchlist-body"></tbody>
      </table>
      <div id="watchlist-empty" class="hidden"></div>
    `;
  });

  it("shows empty message when watchlist is empty", () => {
    renderWatchlist(makeConfig([]), new Map());

    const tbody = document.getElementById("watchlist-body")!;
    const empty = document.getElementById("watchlist-empty")!;
    expect(tbody.innerHTML).toBe("");
    expect(empty.classList.contains("hidden")).toBe(false);
  });

  it("renders rows for tickers with quotes", () => {
    const quotes = new Map([["AAPL", makeQuote("AAPL", { price: 150.25 })]]);
    renderWatchlist(makeConfig(["AAPL"]), quotes);

    const tbody = document.getElementById("watchlist-body")!;
    expect(tbody.querySelectorAll("tr").length).toBe(1);
    expect(tbody.innerHTML).toContain("AAPL");
    expect(tbody.innerHTML).toContain("150.25");
  });

  it("renders placeholder for missing quotes", () => {
    renderWatchlist(makeConfig(["TSLA"]), new Map());

    const tbody = document.getElementById("watchlist-body")!;
    expect(tbody.innerHTML).toContain("TSLA");
    expect(tbody.innerHTML).toContain("--");
  });

  it("hides empty message when watchlist has entries", () => {
    renderWatchlist(makeConfig(["AAPL"]), new Map());

    const empty = document.getElementById("watchlist-empty")!;
    expect(empty.classList.contains("hidden")).toBe(true);
  });

  it("formats volume as M or K", () => {
    const quotes = new Map([
      ["BIG", makeQuote("BIG", { volume: 5_200_000 })],
      ["MED", makeQuote("MED", { volume: 42_500 })],
    ]);
    renderWatchlist(makeConfig(["BIG", "MED"]), quotes);

    const html = document.getElementById("watchlist-body")!.innerHTML;
    expect(html).toContain("5.2M");
    expect(html).toContain("42.5K");
  });

  it("renders consensus badge", () => {
    const consensus: ConsensusResult = {
      ticker: "AAPL",
      direction: "BUY",
      strength: 0.8,
      buyMethods: [],
      sellMethods: [],
    };
    const quotes = new Map([["AAPL", makeQuote("AAPL", { consensus })]]);
    renderWatchlist(makeConfig(["AAPL"]), quotes);

    const html = document.getElementById("watchlist-body")!.innerHTML;
    expect(html).toContain("badge-buy");
    expect(html).toContain("BUY");
  });

  it("applies change-positive class for positive change", () => {
    const quotes = new Map([["AAPL", makeQuote("AAPL", { change: 2.5, changePercent: 1.5 })]]);
    renderWatchlist(makeConfig(["AAPL"]), quotes);

    const html = document.getElementById("watchlist-body")!.innerHTML;
    expect(html).toContain("change-positive");
  });

  it("applies change-negative class for negative change", () => {
    const quotes = new Map([["AAPL", makeQuote("AAPL", { change: -2.5, changePercent: -1.5 })]]);
    renderWatchlist(makeConfig(["AAPL"]), quotes);

    const html = document.getElementById("watchlist-body")!.innerHTML;
    expect(html).toContain("change-negative");
  });
});
