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
  updateWatchlistNames,
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

  // G19 — company name persistence ─────────────────────────────────────────
  describe("updateWatchlistNames (G19)", () => {
    it("updates entry name from the provided map", () => {
      let config = loadConfig();
      config = addTicker(config, "AAPL");
      const updated = updateWatchlistNames(config, new Map([["AAPL", "Apple Inc."]]));
      expect(updated.watchlist[0]?.name).toBe("Apple Inc.");
    });

    it("does not change entries not present in the map", () => {
      let config = loadConfig();
      config = addTicker(config, "AAPL");
      config = addTicker(config, "MSFT");
      const updated = updateWatchlistNames(config, new Map([["AAPL", "Apple Inc."]]));
      expect(updated.watchlist[0]?.name).toBe("Apple Inc.");
      expect(updated.watchlist[1]?.name).toBeUndefined();
    });

    it("returns same reference when nothing changed", () => {
      let config = loadConfig();
      config = addTicker(config, "AAPL");
      config = updateWatchlistNames(config, new Map([["AAPL", "Apple Inc."]]));
      // Same name again → same reference
      const result = updateWatchlistNames(config, new Map([["AAPL", "Apple Inc."]]));
      expect(result).toBe(config);
    });
  });

  describe("loadConfig name re-attachment (G19)", () => {
    it("re-attaches persisted names from raw JSON after Valibot parse", () => {
      const raw = {
        version: 1,
        config: {
          theme: "dark",
          watchlist: [{ ticker: "AAPL", addedAt: "2025-01-01T00:00:00.000Z", name: "Apple Inc." }],
        },
      };
      localStorage.setItem("crosstide-config", JSON.stringify(raw));
      const config = loadConfig();
      expect(config.watchlist[0]?.name).toBe("Apple Inc.");
    });

    it("loads config without name field normally", () => {
      const raw = {
        version: 1,
        config: {
          theme: "dark",
          watchlist: [{ ticker: "AAPL", addedAt: "2025-01-01T00:00:00.000Z" }],
        },
      };
      localStorage.setItem("crosstide-config", JSON.stringify(raw));
      const config = loadConfig();
      expect(config.watchlist[0]?.name).toBeUndefined();
    });
  });

  // G20 — method weights persistence
  describe("loadConfig methodWeights re-attachment (G20)", () => {
    it("re-attaches persisted methodWeights after Valibot parse", () => {
      const raw = {
        version: 1,
        config: {
          theme: "dark",
          watchlist: [],
          methodWeights: { Micho: 2, RSI: 0.5 },
        },
      };
      localStorage.setItem("crosstide-config", JSON.stringify(raw));
      const config = loadConfig();
      expect(config.methodWeights?.["Micho"]).toBe(2);
      expect(config.methodWeights?.["RSI"]).toBe(0.5);
    });

    it("clamps out-of-range weights to [0, 3]", () => {
      const raw = {
        version: 1,
        config: {
          theme: "dark",
          watchlist: [],
          methodWeights: { Micho: 5, RSI: -1 },
        },
      };
      localStorage.setItem("crosstide-config", JSON.stringify(raw));
      const config = loadConfig();
      expect(config.methodWeights?.["Micho"]).toBe(3);
      expect(config.methodWeights?.["RSI"]).toBe(0);
    });

    it("returns undefined methodWeights when absent", () => {
      saveConfig({ theme: "dark", watchlist: [] });
      const config = loadConfig();
      expect(config.methodWeights).toBeUndefined();
    });
  });

  describe("loadConfig cardSettings re-attachment (G24)", () => {
    it("re-attaches valid cardSettings from raw JSON", () => {
      const raw = {
        version: 1,
        config: {
          theme: "dark",
          watchlist: [],
          cardSettings: {
            chart: {
              defaultInterval: "1d",
              indicatorSet: ["SMA50", "SMA200"],
              crosshairSnap: true,
            },
          },
        },
      };
      localStorage.setItem("crosstide-config", JSON.stringify(raw));
      const config = loadConfig();
      expect(config.cardSettings?.chart?.defaultInterval).toBe("1d");
      expect(config.cardSettings?.chart?.crosshairSnap).toBe(true);
    });

    it("drops invalid card settings object", () => {
      const raw = {
        version: 1,
        config: {
          theme: "dark",
          watchlist: [],
          cardSettings: {
            chart: {
              defaultInterval: "bad",
              indicatorSet: "nope",
              crosshairSnap: "yes",
            },
          },
        },
      };
      localStorage.setItem("crosstide-config", JSON.stringify(raw));
      const config = loadConfig();
      expect(config.cardSettings?.chart).toBeUndefined();
    });

    it("returns undefined cardSettings when absent", () => {
      saveConfig({ theme: "dark", watchlist: [] });
      const config = loadConfig();
      expect(config.cardSettings).toBeUndefined();
    });
  });
});

// ─────────────────────────── G24: setCardSetting / getCardSetting ─────────────

import { setCardSetting, getCardSetting } from "../../../src/core/config";

describe("setCardSetting / getCardSetting (G24)", () => {
  const baseConfig = { theme: "dark" as const, watchlist: [] };

  it("setCardSetting returns a new config with the card settings applied", () => {
    const next = setCardSetting(baseConfig, "chart", {
      defaultInterval: "4h",
      crosshairSnap: false,
    });
    expect(next.cardSettings?.chart?.defaultInterval).toBe("4h");
    expect(next.cardSettings?.chart?.crosshairSnap).toBe(false);
  });

  it("setCardSetting does not mutate the original config", () => {
    const original = { ...baseConfig };
    setCardSetting(original, "chart", { defaultInterval: "1d", crosshairSnap: true });
    expect(original.cardSettings).toBeUndefined();
  });

  it("setCardSetting merges with existing cardSettings", () => {
    const withChart = setCardSetting(baseConfig, "chart", {
      defaultInterval: "1d",
      crosshairSnap: true,
    });
    const withBoth = setCardSetting(withChart, "screener", { autoRun: true, maxResults: 50 });
    expect(withBoth.cardSettings?.chart?.defaultInterval).toBe("1d");
    expect(withBoth.cardSettings?.screener?.autoRun).toBe(true);
  });

  it("getCardSetting returns undefined when cardSettings absent", () => {
    expect(getCardSetting(baseConfig, "chart")).toBeUndefined();
  });

  it("getCardSetting returns the stored settings for the correct card", () => {
    const cfg = setCardSetting(baseConfig, "watchlist", {
      visibleColumns: ["ticker", "price"],
      autoRefreshMs: 5000,
    });
    const result = getCardSetting(cfg, "watchlist");
    expect(result?.visibleColumns).toEqual(["ticker", "price"]);
    expect(result?.autoRefreshMs).toBe(5000);
  });

  it("getCardSetting returns undefined for a card that hasn't been set", () => {
    const cfg = setCardSetting(baseConfig, "chart", { defaultInterval: "1d", crosshairSnap: true });
    expect(getCardSetting(cfg, "heatmap")).toBeUndefined();
  });

  it("multiple setCardSetting calls accumulate correctly", () => {
    let cfg = setCardSetting(baseConfig, "chart", { defaultInterval: "1d", crosshairSnap: true });
    cfg = setCardSetting(cfg, "chart", { defaultInterval: "4h", crosshairSnap: false });
    expect(getCardSetting(cfg, "chart")?.defaultInterval).toBe("4h");
  });
});
