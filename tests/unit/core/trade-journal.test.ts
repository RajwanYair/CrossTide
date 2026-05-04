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

describe("trade-journal", () => {
  async function loadModule() {
    return import("../../../src/core/trade-journal");
  }

  it("starts with empty journal", async () => {
    const { getJournal } = await loadModule();
    expect(getJournal()).toEqual([]);
  });

  it("addTrade creates entry with auto-id and timestamp", async () => {
    const { addTrade } = await loadModule();
    const entry = addTrade({
      ticker: "aapl",
      action: "buy",
      price: 150,
      quantity: 10,
      notes: "Strong support level",
      tags: ["swing"],
    });
    expect(entry.id).toBeTruthy();
    expect(entry.ticker).toBe("AAPL");
    expect(entry.timestamp).toBeGreaterThan(0);
  });

  it("getRecentTrades returns last N", async () => {
    const { addTrade, getRecentTrades } = await loadModule();
    addTrade({ ticker: "A", action: "buy", price: 10, quantity: 1, notes: "", tags: [] });
    addTrade({ ticker: "B", action: "sell", price: 20, quantity: 2, notes: "", tags: [] });
    addTrade({ ticker: "C", action: "buy", price: 30, quantity: 3, notes: "", tags: [] });
    const recent = getRecentTrades(2);
    expect(recent).toHaveLength(2);
    expect(recent[0]!.ticker).toBe("B");
    expect(recent[1]!.ticker).toBe("C");
  });

  it("getTradesForTicker filters by ticker", async () => {
    const { addTrade, getTradesForTicker } = await loadModule();
    addTrade({ ticker: "AAPL", action: "buy", price: 150, quantity: 10, notes: "", tags: [] });
    addTrade({ ticker: "MSFT", action: "buy", price: 300, quantity: 5, notes: "", tags: [] });
    addTrade({ ticker: "AAPL", action: "sell", price: 160, quantity: 10, notes: "", tags: [] });
    const appl = getTradesForTicker("aapl");
    expect(appl).toHaveLength(2);
  });

  it("getTradesByAction filters buy/sell", async () => {
    const { addTrade, getTradesByAction } = await loadModule();
    addTrade({ ticker: "A", action: "buy", price: 10, quantity: 1, notes: "", tags: [] });
    addTrade({ ticker: "B", action: "sell", price: 20, quantity: 2, notes: "", tags: [] });
    addTrade({ ticker: "C", action: "buy", price: 30, quantity: 3, notes: "", tags: [] });
    expect(getTradesByAction("buy")).toHaveLength(2);
    expect(getTradesByAction("sell")).toHaveLength(1);
  });

  it("getTradesByTag filters by tag", async () => {
    const { addTrade, getTradesByTag } = await loadModule();
    addTrade({
      ticker: "A",
      action: "buy",
      price: 10,
      quantity: 1,
      notes: "",
      tags: ["swing", "momentum"],
    });
    addTrade({ ticker: "B", action: "buy", price: 20, quantity: 2, notes: "", tags: ["value"] });
    expect(getTradesByTag("swing")).toHaveLength(1);
    expect(getTradesByTag("VALUE")).toHaveLength(1);
  });

  it("deleteTrade removes by ID", async () => {
    const { addTrade, deleteTrade, getJournal } = await loadModule();
    const entry = addTrade({
      ticker: "X",
      action: "buy",
      price: 10,
      quantity: 1,
      notes: "",
      tags: [],
    });
    expect(deleteTrade(entry.id)).toBe(true);
    expect(getJournal()).toHaveLength(0);
    expect(deleteTrade("nonexistent")).toBe(false);
  });

  it("getTotalInvested sums buy values", async () => {
    const { addTrade, getTotalInvested } = await loadModule();
    addTrade({ ticker: "A", action: "buy", price: 100, quantity: 10, notes: "", tags: [] });
    addTrade({ ticker: "B", action: "buy", price: 50, quantity: 20, notes: "", tags: [] });
    addTrade({ ticker: "A", action: "sell", price: 120, quantity: 10, notes: "", tags: [] });
    expect(getTotalInvested()).toBe(2000); // 1000 + 1000
  });

  it("getTotalSold sums sell values", async () => {
    const { addTrade, getTotalSold } = await loadModule();
    addTrade({ ticker: "A", action: "sell", price: 120, quantity: 10, notes: "", tags: [] });
    expect(getTotalSold()).toBe(1200);
  });

  it("persists to localStorage", async () => {
    const mod1 = await loadModule();
    mod1.addTrade({ ticker: "GOOG", action: "buy", price: 100, quantity: 5, notes: "", tags: [] });
    vi.resetModules();
    const mod2 = await loadModule();
    expect(mod2.getJournal()).toHaveLength(1);
  });

  it("clearJournal removes all entries", async () => {
    const { addTrade, clearJournal, getJournal } = await loadModule();
    addTrade({ ticker: "A", action: "buy", price: 10, quantity: 1, notes: "", tags: [] });
    clearJournal();
    expect(getJournal()).toEqual([]);
  });
});
