import { describe, it, expect } from "vitest";
import { applyFilters, renderScreenerResults } from "../../../src/cards/screener";
import type { ScreenerInput, ScreenerFilter } from "../../../src/cards/screener";

function makeInput(overrides: Partial<ScreenerInput> & { ticker: string }): ScreenerInput {
  return {
    price: 100,
    consensus: "NEUTRAL",
    rsi: 50,
    volumeRatio: 1.0,
    smaValues: new Map([[200, 90]]),
    pe: null,
    marketCap: null,
    dividendYield: null,
    sector: null,
    ...overrides,
  };
}

describe("applyFilters", () => {
  it("returns all inputs when no filters are provided", () => {
    const inputs = [makeInput({ ticker: "AAPL" }), makeInput({ ticker: "TSLA" })];
    const rows = applyFilters(inputs, []);
    expect(rows.length).toBe(2);
  });

  it("filters by consensus direction", () => {
    const inputs = [
      makeInput({ ticker: "AAPL", consensus: "BUY" }),
      makeInput({ ticker: "TSLA", consensus: "SELL" }),
    ];
    const rows = applyFilters(inputs, [{ type: "consensus", direction: "BUY" }]);
    expect(rows.length).toBe(1);
    expect(rows[0]!.ticker).toBe("AAPL");
  });

  it("filters by RSI below threshold", () => {
    const inputs = [makeInput({ ticker: "AAPL", rsi: 25 }), makeInput({ ticker: "TSLA", rsi: 55 })];
    const rows = applyFilters(inputs, [{ type: "rsiBelow", threshold: 30 }]);
    expect(rows.length).toBe(1);
    expect(rows[0]!.ticker).toBe("AAPL");
  });

  it("filters by RSI above threshold", () => {
    const inputs = [makeInput({ ticker: "AAPL", rsi: 75 }), makeInput({ ticker: "TSLA", rsi: 50 })];
    const rows = applyFilters(inputs, [{ type: "rsiAbove", threshold: 70 }]);
    expect(rows.length).toBe(1);
    expect(rows[0]!.ticker).toBe("AAPL");
  });

  it("filters by volume spike", () => {
    const inputs = [
      makeInput({ ticker: "AAPL", volumeRatio: 2.5 }),
      makeInput({ ticker: "TSLA", volumeRatio: 0.8 }),
    ];
    const rows = applyFilters(inputs, [{ type: "volumeSpike", multiplier: 2.0 }]);
    expect(rows.length).toBe(1);
    expect(rows[0]!.ticker).toBe("AAPL");
  });

  it("filters by price above SMA", () => {
    const inputs = [
      makeInput({ ticker: "AAPL", price: 100, smaValues: new Map([[200, 90]]) }),
      makeInput({ ticker: "TSLA", price: 80, smaValues: new Map([[200, 90]]) }),
    ];
    const rows = applyFilters(inputs, [{ type: "priceAboveSma", period: 200 }]);
    expect(rows.length).toBe(1);
    expect(rows[0]!.ticker).toBe("AAPL");
  });

  it("requires ALL filters to match (AND logic)", () => {
    const inputs = [
      makeInput({ ticker: "AAPL", consensus: "BUY", rsi: 25 }),
      makeInput({ ticker: "TSLA", consensus: "BUY", rsi: 55 }),
    ];
    const filters: ScreenerFilter[] = [
      { type: "consensus", direction: "BUY" },
      { type: "rsiBelow", threshold: 30 },
    ];
    const rows = applyFilters(inputs, filters);
    expect(rows.length).toBe(1);
    expect(rows[0]!.ticker).toBe("AAPL");
  });

  it("populates matchedFilters with labels", () => {
    const inputs = [makeInput({ ticker: "AAPL", consensus: "BUY" })];
    const rows = applyFilters(inputs, [{ type: "consensus", direction: "BUY" }]);
    expect(rows[0]!.matchedFilters).toContain("Consensus BUY");
  });

  it("excludes inputs with null RSI for RSI filters", () => {
    const inputs = [makeInput({ ticker: "AAPL", rsi: null })];
    const rows = applyFilters(inputs, [{ type: "rsiBelow", threshold: 30 }]);
    expect(rows.length).toBe(0);
  });
});

describe("renderScreenerResults", () => {
  it("shows empty state for no results", () => {
    const container = document.createElement("div");
    renderScreenerResults(container, []);
    expect(container.innerHTML).toContain("No tickers match");
  });

  it("renders table rows for matched results", () => {
    const container = document.createElement("div");
    renderScreenerResults(container, [
      { ticker: "AAPL", price: 150, consensus: "BUY", matchedFilters: ["RSI < 30"] },
    ]);
    expect(container.innerHTML).toContain("AAPL");
    expect(container.innerHTML).toContain("150.00");
    expect(container.textContent).toContain("RSI < 30");
  });
});
