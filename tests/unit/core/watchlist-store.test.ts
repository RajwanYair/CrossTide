/**
 * Unit tests for watchlistStore.
 *
 * P7: Validates signal-store actions for ticker management, sorting, names,
 * and instrument types.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { watchlistStore } from "../../../src/core/watchlist-store";
import type { InstrumentType } from "../../../src/types/domain";

describe("watchlistStore", () => {
  beforeEach(() => {
    watchlistStore.reset();
  });

  it("initializes with default tickers", () => {
    const state = watchlistStore.state();
    expect(state.tickers).toEqual(["AAPL", "MSFT", "GOOGL", "AMZN", "NVDA", "META", "TSLA"]);
    expect(state.sortColumn).toBe("ticker");
    expect(state.sortDirection).toBe("asc");
    expect(state.activeWatchlistId).toBe("default");
  });

  describe("addTicker", () => {
    it("adds a new ticker to the list", () => {
      watchlistStore.actions.addTicker("NFLX");
      expect(watchlistStore.state().tickers).toContain("NFLX");
    });

    it("does not add a duplicate ticker", () => {
      watchlistStore.actions.addTicker("AAPL");
      const tickers = watchlistStore.state().tickers;
      expect(tickers.filter((t) => t === "AAPL").length).toBe(1);
    });

    it("preserves existing tickers when adding", () => {
      const before = watchlistStore.state().tickers.length;
      watchlistStore.actions.addTicker("TSMC");
      expect(watchlistStore.state().tickers.length).toBe(before + 1);
    });
  });

  describe("removeTicker", () => {
    it("removes an existing ticker", () => {
      watchlistStore.actions.removeTicker("AAPL");
      expect(watchlistStore.state().tickers).not.toContain("AAPL");
    });

    it("is a no-op for a ticker not in the list", () => {
      const before = watchlistStore.state().tickers.length;
      watchlistStore.actions.removeTicker("UNKNOWN");
      expect(watchlistStore.state().tickers.length).toBe(before);
    });
  });

  describe("reorder", () => {
    it("replaces the ticker list entirely", () => {
      const newOrder = ["NVDA", "AAPL", "MSFT"];
      watchlistStore.actions.reorder(newOrder);
      expect(watchlistStore.state().tickers).toEqual(newOrder);
    });
  });

  describe("setSort", () => {
    it("sets a new sort column with explicit direction", () => {
      watchlistStore.actions.setSort("price", "desc");
      const state = watchlistStore.state();
      expect(state.sortColumn).toBe("price");
      expect(state.sortDirection).toBe("desc");
    });

    it("toggles direction when clicking the same column twice", () => {
      watchlistStore.actions.setSort("ticker", "asc");
      watchlistStore.actions.setSort("ticker"); // no explicit direction → toggle
      expect(watchlistStore.state().sortDirection).toBe("desc");
    });

    it("defaults to asc when switching to a new column", () => {
      watchlistStore.actions.setSort("ticker", "desc"); // current col=ticker, dir=desc
      watchlistStore.actions.setSort("price"); // different col
      const state = watchlistStore.state();
      expect(state.sortColumn).toBe("price");
      expect(state.sortDirection).toBe("asc");
    });
  });

  describe("setNames", () => {
    it("merges new names into existing ones", () => {
      watchlistStore.actions.setNames({ AAPL: "Apple Inc." });
      watchlistStore.actions.setNames({ MSFT: "Microsoft" });
      const { names } = watchlistStore.state();
      expect(names["AAPL"]).toBe("Apple Inc.");
      expect(names["MSFT"]).toBe("Microsoft");
    });

    it("overwrites an existing name", () => {
      watchlistStore.actions.setNames({ AAPL: "Apple" });
      watchlistStore.actions.setNames({ AAPL: "Apple Inc." });
      expect(watchlistStore.state().names["AAPL"]).toBe("Apple Inc.");
    });
  });

  describe("setInstrumentTypes", () => {
    it("stores instrument types by ticker", () => {
      const types: Record<string, InstrumentType> = { AAPL: "stock", BTC: "crypto" };
      watchlistStore.actions.setInstrumentTypes(types);
      const { instrumentTypes } = watchlistStore.state();
      expect(instrumentTypes["AAPL"]).toBe("stock");
      expect(instrumentTypes["BTC"]).toBe("crypto");
    });

    it("merges without overwriting unrelated entries", () => {
      watchlistStore.actions.setInstrumentTypes({ AAPL: "stock" });
      watchlistStore.actions.setInstrumentTypes({ BTC: "crypto" });
      const { instrumentTypes } = watchlistStore.state();
      expect(instrumentTypes["AAPL"]).toBe("stock");
      expect(instrumentTypes["BTC"]).toBe("crypto");
    });
  });
});
