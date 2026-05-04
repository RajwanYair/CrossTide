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

describe("ticker-pinning", () => {
  async function loadModule() {
    return import("../../../src/core/ticker-pinning");
  }

  it("starts with no pins", async () => {
    const { getPinnedTickers } = await loadModule();
    expect(getPinnedTickers()).toEqual([]);
  });

  it("pinTicker adds a ticker", async () => {
    const { pinTicker, isPinned, getPinnedTickers } = await loadModule();
    pinTicker("AAPL");
    expect(isPinned("AAPL")).toBe(true);
    expect(getPinnedTickers()).toEqual(["AAPL"]);
  });

  it("normalizes to uppercase", async () => {
    const { pinTicker, isPinned } = await loadModule();
    pinTicker("aapl");
    expect(isPinned("AAPL")).toBe(true);
  });

  it("does not duplicate pins", async () => {
    const { pinTicker, getPinnedTickers } = await loadModule();
    pinTicker("AAPL");
    pinTicker("AAPL");
    expect(getPinnedTickers()).toEqual(["AAPL"]);
  });

  it("unpinTicker removes a ticker", async () => {
    const { pinTicker, unpinTicker, isPinned } = await loadModule();
    pinTicker("MSFT");
    unpinTicker("MSFT");
    expect(isPinned("MSFT")).toBe(false);
  });

  it("togglePin toggles state", async () => {
    const { togglePin, isPinned } = await loadModule();
    expect(togglePin("GOOG")).toBe(true);
    expect(isPinned("GOOG")).toBe(true);
    expect(togglePin("GOOG")).toBe(false);
    expect(isPinned("GOOG")).toBe(false);
  });

  it("persists to localStorage", async () => {
    const { pinTicker } = await loadModule();
    pinTicker("TSLA");
    const raw = localStorage.getItem("crosstide-pinned-tickers");
    expect(raw).toContain("TSLA");
  });

  it("loads from localStorage", async () => {
    localStorage.setItem("crosstide-pinned-tickers", JSON.stringify(["NVDA", "AMD"]));
    const { getPinnedTickers } = await loadModule();
    expect(getPinnedTickers()).toEqual(["NVDA", "AMD"]);
  });

  it("sortWithPinnedFirst puts pinned at top", async () => {
    const { pinTicker, sortWithPinnedFirst } = await loadModule();
    pinTicker("MSFT");
    const items = ["AAPL", "MSFT", "GOOG", "TSLA"];
    const sorted = sortWithPinnedFirst(items, (t) => t);
    expect(sorted[0]).toBe("MSFT");
    expect(sorted.slice(1)).toEqual(["AAPL", "GOOG", "TSLA"]);
  });

  it("sortWithPinnedFirst preserves pin order", async () => {
    const { pinTicker, sortWithPinnedFirst } = await loadModule();
    pinTicker("GOOG");
    pinTicker("AAPL");
    const items = ["AAPL", "MSFT", "GOOG", "TSLA"];
    const sorted = sortWithPinnedFirst(items, (t) => t);
    expect(sorted[0]).toBe("GOOG");
    expect(sorted[1]).toBe("AAPL");
  });

  it("clearPins removes all", async () => {
    const { pinTicker, clearPins, getPinnedTickers } = await loadModule();
    pinTicker("AAPL");
    pinTicker("MSFT");
    clearPins();
    expect(getPinnedTickers()).toEqual([]);
  });
});
