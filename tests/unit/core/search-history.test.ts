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

describe("search-history", () => {
  async function loadModule() {
    return import("../../../src/core/search-history");
  }

  it("starts empty", async () => {
    const { getHistorySize } = await loadModule();
    expect(getHistorySize()).toBe(0);
  });

  it("recordSearch stores entries", async () => {
    const { recordSearch, getHistorySize } = await loadModule();
    recordSearch("AAPL");
    recordSearch("MSFT");
    expect(getHistorySize()).toBe(2);
  });

  it("recordSearch increments count for repeated queries", async () => {
    const { recordSearch, getSuggestions } = await loadModule();
    recordSearch("AAPL");
    recordSearch("aapl");
    recordSearch("Aapl");
    const suggestions = getSuggestions("A");
    expect(suggestions[0]!.count).toBe(3);
  });

  it("getSuggestions matches prefix", async () => {
    const { recordSearch, getSuggestions } = await loadModule();
    recordSearch("AAPL");
    recordSearch("AMZN");
    recordSearch("MSFT");
    const suggestions = getSuggestions("A");
    expect(suggestions).toHaveLength(2);
    expect(suggestions.map((s) => s.query)).toContain("AAPL");
    expect(suggestions.map((s) => s.query)).toContain("AMZN");
  });

  it("getSuggestions sorts by frequency", async () => {
    const { recordSearch, getSuggestions } = await loadModule();
    recordSearch("AAPL");
    recordSearch("AMZN");
    recordSearch("AMZN");
    recordSearch("AMZN");
    const suggestions = getSuggestions("A");
    expect(suggestions[0]!.query).toBe("AMZN");
  });

  it("getRecentSearches returns by recency", async () => {
    let now = 1000;
    vi.spyOn(Date, "now").mockImplementation(() => now++);
    const { recordSearch, getRecentSearches } = await loadModule();
    recordSearch("FIRST");
    recordSearch("SECOND");
    recordSearch("THIRD");
    vi.restoreAllMocks();
    const recent = getRecentSearches(2);
    expect(recent).toHaveLength(2);
    expect(recent[0]!.query).toBe("THIRD");
  });

  it("getFrequentSearches returns by count", async () => {
    const { recordSearch, getFrequentSearches } = await loadModule();
    recordSearch("RARE");
    recordSearch("OFTEN");
    recordSearch("OFTEN");
    recordSearch("OFTEN");
    const frequent = getFrequentSearches(1);
    expect(frequent[0]!.query).toBe("OFTEN");
  });

  it("removeFromHistory deletes entry", async () => {
    const { recordSearch, removeFromHistory, getHistorySize } = await loadModule();
    recordSearch("AAPL");
    recordSearch("MSFT");
    expect(removeFromHistory("AAPL")).toBe(true);
    expect(getHistorySize()).toBe(1);
    expect(removeFromHistory("UNKNOWN")).toBe(false);
  });

  it("clearSearchHistory removes everything", async () => {
    const { recordSearch, clearSearchHistory, getHistorySize } = await loadModule();
    recordSearch("AAPL");
    clearSearchHistory();
    expect(getHistorySize()).toBe(0);
  });

  it("persists across module reloads", async () => {
    const mod1 = await loadModule();
    mod1.recordSearch("GOOG");
    vi.resetModules();
    const mod2 = await loadModule();
    expect(mod2.getHistorySize()).toBe(1);
  });

  it("ignores empty queries", async () => {
    const { recordSearch, getHistorySize } = await loadModule();
    recordSearch("");
    recordSearch("   ");
    expect(getHistorySize()).toBe(0);
  });
});
