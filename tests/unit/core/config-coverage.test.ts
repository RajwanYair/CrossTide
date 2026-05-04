/**
 * Config.ts coverage boost — targets uncovered parseSingleCardSettings
 * switch branches (watchlist, consensus, screener, heatmap, backtest,
 * alerts, portfolio, risk) and invalid cardSettings input.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { loadConfig } from "../../../src/core/config";

const STORAGE_KEY = "crosstide-config";

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

function storeRaw(config: unknown): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, config }));
}

describe("loadConfig — cardSettings per-card parsing", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", createMockStorage());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("parses watchlist card settings", () => {
    storeRaw({
      theme: "dark",
      watchlist: [],
      cardSettings: {
        watchlist: {
          visibleColumns: ["ticker", "price"],
          autoRefreshSec: 30,
          density: "compact",
        },
      },
    });
    const cfg = loadConfig();
    expect(cfg.cardSettings?.watchlist).toEqual({
      visibleColumns: ["ticker", "price"],
      autoRefreshSec: 30,
      density: "compact",
    });
  });

  it("parses consensus card settings", () => {
    storeRaw({
      theme: "dark",
      watchlist: [],
      cardSettings: {
        consensus: {
          methodsToDisplay: ["RSI"],
          historyDepth: 50,
        },
      },
    });
    const cfg = loadConfig();
    expect(cfg.cardSettings?.consensus).toEqual({
      methodsToDisplay: ["RSI"],
      historyDepth: 50,
    });
  });

  it("parses screener card settings", () => {
    storeRaw({
      theme: "dark",
      watchlist: [],
      cardSettings: {
        screener: {
          defaultPreset: "momentum",
          maxResults: 100,
          sortColumn: "ticker",
        },
      },
    });
    const cfg = loadConfig();
    expect(cfg.cardSettings?.screener).toEqual({
      defaultPreset: "momentum",
      maxResults: 100,
      sortColumn: "ticker",
    });
  });

  it("parses heatmap card settings", () => {
    storeRaw({
      theme: "dark",
      watchlist: [],
      cardSettings: {
        heatmap: {
          colorScale: "diverging",
          cellLabelFormat: "ticker-change",
        },
      },
    });
    const cfg = loadConfig();
    expect(cfg.cardSettings?.heatmap).toEqual({
      colorScale: "diverging",
      cellLabelFormat: "ticker-change",
    });
  });

  it("parses backtest card settings", () => {
    storeRaw({
      theme: "dark",
      watchlist: [],
      cardSettings: {
        backtest: {
          defaultStrategy: "mean-reversion",
          lookbackWindow: 60,
          benchmark: "SPY",
        },
      },
    });
    const cfg = loadConfig();
    expect(cfg.cardSettings?.backtest).toEqual({
      defaultStrategy: "mean-reversion",
      lookbackWindow: 60,
      benchmark: "SPY",
    });
  });

  it("parses alerts card settings", () => {
    storeRaw({
      theme: "dark",
      watchlist: [],
      cardSettings: {
        alerts: {
          thresholdType: "percent",
          notificationChannel: "toast",
        },
      },
    });
    const cfg = loadConfig();
    expect(cfg.cardSettings?.alerts).toEqual({
      thresholdType: "percent",
      notificationChannel: "toast",
    });
  });

  it("parses portfolio card settings", () => {
    storeRaw({
      theme: "dark",
      watchlist: [],
      cardSettings: {
        portfolio: {
          benchmarkTicker: "VOO",
          displayCurrency: "USD",
        },
      },
    });
    const cfg = loadConfig();
    expect(cfg.cardSettings?.portfolio).toEqual({
      benchmarkTicker: "VOO",
      displayCurrency: "USD",
    });
  });

  it("parses risk card settings", () => {
    storeRaw({
      theme: "dark",
      watchlist: [],
      cardSettings: {
        risk: {
          varConfidence: 0.95,
          benchmark: "SPY",
        },
      },
    });
    const cfg = loadConfig();
    expect(cfg.cardSettings?.risk).toEqual({
      varConfidence: 0.95,
      benchmark: "SPY",
    });
  });

  it("skips invalid card settings gracefully", () => {
    storeRaw({
      theme: "dark",
      watchlist: [],
      cardSettings: {
        watchlist: "not-an-object",
        screener: { maxResults: -1 }, // fails minValue(10)
      },
    });
    const cfg = loadConfig();
    // Invalid settings should be omitted — not crash
    expect(cfg.cardSettings?.watchlist).toBeUndefined();
    expect(cfg.cardSettings?.screener).toBeUndefined();
  });

  it("returns undefined cardSettings for empty object", () => {
    storeRaw({
      theme: "dark",
      watchlist: [],
      cardSettings: {},
    });
    const cfg = loadConfig();
    expect(cfg.cardSettings).toBeUndefined();
  });

  it("handles non-object cardSettings", () => {
    storeRaw({
      theme: "dark",
      watchlist: [],
      cardSettings: "junk",
    });
    const cfg = loadConfig();
    expect(cfg.cardSettings).toBeUndefined();
  });
});
