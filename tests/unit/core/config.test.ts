/**
 * Config management tests.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  loadConfig,
  saveConfig,
  addTicker,
  removeTicker,
  reorderWatchlist,
} from "../../../src/core/config";

function createMockStorage(): Storage {
  let store = new Map<string, string>();
  return {
    getItem: (key: string): string | null => store.get(key) ?? null,
    setItem: (key: string, value: string): void => {
      store.set(key, value);
    },
    removeItem: (key: string): void => {
      store.delete(key);
    },
    clear: (): void => {
      store = new Map();
    },
    get length(): number {
      return store.size;
    },
    key: (index: number): string | null => [...store.keys()][index] ?? null,
  };
}

describe("config", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", createMockStorage());
  });

  describe("loadConfig", () => {
    it("returns default config when nothing stored", () => {
      const config = loadConfig();
      expect(config.theme).toBe("dark");
      expect(config.watchlist).toEqual([]);
    });

    it("loads saved config", () => {
      saveConfig({ theme: "light", watchlist: [] });
      const config = loadConfig();
      expect(config.theme).toBe("light");
    });

    it("returns default for corrupt data", () => {
      localStorage.setItem("crosstide-config", "not-json");
      const config = loadConfig();
      expect(config.theme).toBe("dark");
    });

    it("returns default when version is wrong", () => {
      localStorage.setItem(
        "crosstide-config",
        JSON.stringify({ version: 99, config: { theme: "light", watchlist: [] } }),
      );
      const config = loadConfig();
      expect(config.theme).toBe("dark");
    });

    it("returns default when stored envelope lacks version field", () => {
      localStorage.setItem("crosstide-config", JSON.stringify({ config: { theme: "light" } }));
      const config = loadConfig();
      expect(config.theme).toBe("dark");
    });

    it("returns default when config fails schema validation", () => {
      localStorage.setItem(
        "crosstide-config",
        JSON.stringify({ version: 1, config: { theme: 123, watchlist: "bad" } }),
      );
      const config = loadConfig();
      expect(config.theme).toBe("dark");
    });

    it("returns default when localStorage throws", () => {
      vi.stubGlobal("localStorage", {
        getItem: () => {
          throw new Error("storage error");
        },
        setItem: () => undefined,
        removeItem: () => undefined,
        clear: () => undefined,
        length: 0,
        key: () => null,
      });
      const config = loadConfig();
      expect(config.theme).toBe("dark");
    });
  });

  describe("addTicker", () => {
    it("adds a new ticker", () => {
      const config = loadConfig();
      const updated = addTicker(config, "AAPL");
      expect(updated.watchlist).toHaveLength(1);
      expect(updated.watchlist[0]?.ticker).toBe("AAPL");
    });

    it("normalizes to uppercase", () => {
      const config = loadConfig();
      const updated = addTicker(config, "aapl");
      expect(updated.watchlist[0]?.ticker).toBe("AAPL");
    });

    it("does not add duplicates", () => {
      let config = loadConfig();
      config = addTicker(config, "AAPL");
      config = addTicker(config, "AAPL");
      expect(config.watchlist).toHaveLength(1);
    });

    it("ignores empty strings", () => {
      const config = loadConfig();
      const updated = addTicker(config, "  ");
      expect(updated.watchlist).toHaveLength(0);
    });
  });

  describe("removeTicker", () => {
    it("removes an existing ticker", () => {
      let config = loadConfig();
      config = addTicker(config, "AAPL");
      config = addTicker(config, "MSFT");
      config = removeTicker(config, "AAPL");
      expect(config.watchlist).toHaveLength(1);
      expect(config.watchlist[0]?.ticker).toBe("MSFT");
    });

    it("is a no-op for missing ticker", () => {
      let config = loadConfig();
      config = addTicker(config, "AAPL");
      config = removeTicker(config, "GOOG");
      expect(config.watchlist).toHaveLength(1);
    });
  });

  describe("reorderWatchlist", () => {
    it("moves a ticker from one position to another", () => {
      let config = loadConfig();
      config = addTicker(config, "AAPL");
      config = addTicker(config, "MSFT");
      config = addTicker(config, "GOOG");
      const reordered = reorderWatchlist(config, 0, 2);
      expect(reordered.watchlist[0]!.ticker).toBe("MSFT");
      expect(reordered.watchlist[1]!.ticker).toBe("GOOG");
      expect(reordered.watchlist[2]!.ticker).toBe("AAPL");
    });

    it("returns unchanged config for out-of-bounds from index", () => {
      let config = loadConfig();
      config = addTicker(config, "AAPL");
      const result = reorderWatchlist(config, 5, 0);
      expect(result).toStrictEqual(config);
    });

    it("returns unchanged config for negative from index", () => {
      let config = loadConfig();
      config = addTicker(config, "AAPL");
      const result = reorderWatchlist(config, -1, 0);
      expect(result).toStrictEqual(config);
    });

    it("clamps to index within bounds", () => {
      let config = loadConfig();
      config = addTicker(config, "AAPL");
      config = addTicker(config, "MSFT");
      const reordered = reorderWatchlist(config, 0, 100);
      expect(reordered.watchlist[reordered.watchlist.length - 1]!.ticker).toBe("AAPL");
    });

    it("handles moving to same position (no-op)", () => {
      let config = loadConfig();
      config = addTicker(config, "AAPL");
      config = addTicker(config, "MSFT");
      const reordered = reorderWatchlist(config, 0, 0);
      expect(reordered.watchlist[0]!.ticker).toBe("AAPL");
    });
  });
});
