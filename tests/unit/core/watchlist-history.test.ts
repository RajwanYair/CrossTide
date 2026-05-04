import { describe, it, expect, beforeEach, vi } from "vitest";

function createStorageMock() {
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

describe("watchlist-history", () => {
  async function loadModule() {
    return import("../../../src/core/watchlist-history");
  }

  it("starts with empty history", async () => {
    const { getWatchlistHistory } = await loadModule();
    expect(getWatchlistHistory()).toEqual([]);
  });

  it("records additions", async () => {
    const { recordAdd, getWatchlistHistory } = await loadModule();
    recordAdd("AAPL");
    recordAdd("msft");
    const history = getWatchlistHistory();
    expect(history).toHaveLength(2);
    expect(history[0]!.ticker).toBe("AAPL");
    expect(history[0]!.action).toBe("add");
    expect(history[1]!.ticker).toBe("MSFT");
  });

  it("records removals", async () => {
    const { recordRemove, getWatchlistHistory } = await loadModule();
    recordRemove("TSLA");
    const history = getWatchlistHistory();
    expect(history).toHaveLength(1);
    expect(history[0]!.action).toBe("remove");
    expect(history[0]!.ticker).toBe("TSLA");
  });

  it("getRecentChanges returns last N entries", async () => {
    const { recordAdd, recordRemove, getRecentChanges } = await loadModule();
    recordAdd("A");
    recordAdd("B");
    recordRemove("A");
    recordAdd("C");
    const recent = getRecentChanges(2);
    expect(recent).toHaveLength(2);
    expect(recent[0]!.ticker).toBe("A");
    expect(recent[0]!.action).toBe("remove");
    expect(recent[1]!.ticker).toBe("C");
  });

  it("getTickerHistory filters by ticker", async () => {
    const { recordAdd, recordRemove, getTickerHistory } = await loadModule();
    recordAdd("AAPL");
    recordAdd("MSFT");
    recordRemove("AAPL");
    const history = getTickerHistory("aapl");
    expect(history).toHaveLength(2);
    expect(history[0]!.action).toBe("add");
    expect(history[1]!.action).toBe("remove");
  });

  it("getRemovedTickers returns tickers with last action=remove", async () => {
    const { recordAdd, recordRemove, getRemovedTickers } = await loadModule();
    recordAdd("AAPL");
    recordAdd("MSFT");
    recordRemove("AAPL");
    const removed = getRemovedTickers();
    expect(removed).toContain("AAPL");
    expect(removed).not.toContain("MSFT");
  });

  it("getRemovedTickers excludes re-added tickers", async () => {
    const { recordAdd, recordRemove, getRemovedTickers } = await loadModule();
    recordAdd("AAPL");
    recordRemove("AAPL");
    recordAdd("AAPL"); // re-added
    expect(getRemovedTickers()).not.toContain("AAPL");
  });

  it("persists to localStorage", async () => {
    const mod1 = await loadModule();
    mod1.recordAdd("GOOG");
    vi.resetModules();
    const mod2 = await loadModule();
    const history = mod2.getWatchlistHistory();
    expect(history).toHaveLength(1);
    expect(history[0]!.ticker).toBe("GOOG");
  });

  it("clearWatchlistHistory removes all entries", async () => {
    const { recordAdd, clearWatchlistHistory, getWatchlistHistory } = await loadModule();
    recordAdd("AAPL");
    recordAdd("MSFT");
    clearWatchlistHistory();
    expect(getWatchlistHistory()).toEqual([]);
  });

  it("caps history at MAX_ENTRIES", async () => {
    const { recordAdd, getWatchlistHistory, getMaxEntries } = await loadModule();
    const max = getMaxEntries();
    for (let i = 0; i < max + 50; i++) {
      recordAdd(`T${i}`);
    }
    expect(getWatchlistHistory()).toHaveLength(max);
  });
});
