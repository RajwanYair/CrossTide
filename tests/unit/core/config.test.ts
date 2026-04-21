/**
 * Config management tests.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { loadConfig, saveConfig, addTicker, removeTicker } from "../../../src/core/config";

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
});
