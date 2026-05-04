import { describe, it, expect, beforeEach, vi } from "vitest";

function createStorageMock(): Storage {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (i: number) => Object.keys(store)[i] ?? null,
  };
}

beforeEach(() => {
  vi.stubGlobal("localStorage", createStorageMock());
  vi.resetModules();
});

describe("recent-tickers", () => {
  async function loadModule() {
    return import("../../../src/core/recent-tickers");
  }

  it("starts with empty list", async () => {
    const { getRecentTickers } = await loadModule();
    expect(getRecentTickers()).toEqual([]);
  });

  it("records a ticker view", async () => {
    const { recordTickerView, getRecentTickers } = await loadModule();
    recordTickerView("AAPL");
    expect(getRecentTickers()).toEqual(["AAPL"]);
  });

  it("most recent is first", async () => {
    const { recordTickerView, getRecentTickers } = await loadModule();
    recordTickerView("AAPL");
    recordTickerView("MSFT");
    recordTickerView("GOOG");
    expect(getRecentTickers()[0]).toBe("GOOG");
  });

  it("deduplicates and moves to front", async () => {
    const { recordTickerView, getRecentTickers } = await loadModule();
    recordTickerView("AAPL");
    recordTickerView("MSFT");
    recordTickerView("AAPL");
    expect(getRecentTickers()).toEqual(["AAPL", "MSFT"]);
  });

  it("normalizes to uppercase", async () => {
    const { recordTickerView, getRecentTickers } = await loadModule();
    recordTickerView("aapl");
    expect(getRecentTickers()).toEqual(["AAPL"]);
  });

  it("limits to MAX_RECENT entries", async () => {
    const { recordTickerView, getRecentTickers, getMaxRecent } = await loadModule();
    const max = getMaxRecent();
    for (let i = 0; i < max + 5; i++) {
      recordTickerView(`T${i}`);
    }
    expect(getRecentTickers().length).toBe(max);
  });

  it("persists to localStorage", async () => {
    const { recordTickerView } = await loadModule();
    recordTickerView("TSLA");
    const raw = localStorage.getItem("crosstide-recent-tickers");
    expect(raw).toContain("TSLA");
  });

  it("loads from localStorage on fresh import", async () => {
    localStorage.setItem("crosstide-recent-tickers", JSON.stringify(["NVDA", "AMD"]));
    const { getRecentTickers } = await loadModule();
    expect(getRecentTickers()).toEqual(["NVDA", "AMD"]);
  });

  it("clearRecentTickers empties the list", async () => {
    const { recordTickerView, clearRecentTickers, getRecentTickers } = await loadModule();
    recordTickerView("AAPL");
    clearRecentTickers();
    expect(getRecentTickers()).toEqual([]);
  });
});
