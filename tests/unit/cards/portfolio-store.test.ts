import { describe, it, expect, beforeEach, vi } from "vitest";
import type { IDB } from "../../../src/core/idb";

// In-memory mock IDB (multi-store aware)
function createMockIDB(): IDB {
  const stores = new Map<string, Map<string, unknown>>();
  const getStore = (name?: string): Map<string, unknown> => {
    const key = name ?? "__default";
    if (!stores.has(key)) stores.set(key, new Map());
    return stores.get(key)!;
  };
  return {
    async get<T>(key: string, storeName?: string): Promise<T | null> {
      return (getStore(storeName).get(key) as T) ?? null;
    },
    async set<T>(key: string, value: T, storeName?: string): Promise<void> {
      getStore(storeName).set(key, value);
    },
    async delete(key: string, storeName?: string): Promise<void> {
      getStore(storeName).delete(key);
    },
    async clear(storeName?: string): Promise<void> {
      getStore(storeName).clear();
    },
    async keys(storeName?: string): Promise<string[]> {
      return [...getStore(storeName).keys()];
    },
    close: vi.fn(),
  };
}

// Mock the idb module
vi.mock("../../../src/core/idb", () => {
  const mockDb = createMockIDB();
  return {
    openIDB: vi.fn().mockResolvedValue(mockDb),
    __mockDb: mockDb,
  };
});

import {
  loadHoldings,
  saveHolding,
  removeHolding,
  replaceAllHoldings,
  hasHoldings,
  type PersistedHolding,
} from "../../../src/cards/portfolio-store";

const holding1: PersistedHolding = {
  ticker: "AAPL",
  sector: "Technology",
  quantity: 50,
  avgCost: 150.0,
  currentPrice: 189.3,
  addedAt: "2024-01-15T00:00:00Z",
};

const holding2: PersistedHolding = {
  ticker: "MSFT",
  sector: "Technology",
  quantity: 30,
  avgCost: 290.0,
  currentPrice: 374.51,
  addedAt: "2024-02-01T00:00:00Z",
};

describe("portfolio-store", () => {
  beforeEach(async () => {
    // Clear between tests via replaceAll with empty
    await replaceAllHoldings([]);
  });

  it("loadHoldings returns empty array initially", async () => {
    const result = await loadHoldings();
    expect(result).toEqual([]);
  });

  it("hasHoldings returns false when empty", async () => {
    expect(await hasHoldings()).toBe(false);
  });

  it("saveHolding persists and loadHoldings retrieves", async () => {
    await saveHolding(holding1);
    const result = await loadHoldings();
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(holding1);
  });

  it("saveHolding upserts by ticker", async () => {
    await saveHolding(holding1);
    const updated = { ...holding1, currentPrice: 200.0 };
    await saveHolding(updated);
    const result = await loadHoldings();
    expect(result).toHaveLength(1);
    expect(result[0]!.currentPrice).toBe(200.0);
  });

  it("removeHolding removes by ticker", async () => {
    await saveHolding(holding1);
    await saveHolding(holding2);
    await removeHolding("AAPL");
    const result = await loadHoldings();
    expect(result).toHaveLength(1);
    expect(result[0]!.ticker).toBe("MSFT");
  });

  it("replaceAllHoldings bulk-replaces all", async () => {
    await saveHolding(holding1);
    await replaceAllHoldings([holding2]);
    const result = await loadHoldings();
    expect(result).toHaveLength(1);
    expect(result[0]!.ticker).toBe("MSFT");
  });

  it("hasHoldings returns true after save", async () => {
    await saveHolding(holding1);
    expect(await hasHoldings()).toBe(true);
  });
});
