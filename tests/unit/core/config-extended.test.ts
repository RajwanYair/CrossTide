/**
 * Extended config tests — addTicker, removeTicker edge cases.
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { loadConfig, saveConfig, addTicker, removeTicker } from "../../../src/core/config";
import type { AppConfig } from "../../../src/types/domain";

function createStorageMock(): Storage {
  const map = new Map<string, string>();
  return {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => { map.set(k, v); },
    removeItem: (k: string) => { map.delete(k); },
    clear: () => { map.clear(); },
    get length() { return map.size; },
    key: (i: number) => [...map.keys()][i] ?? null,
  };
}

describe("config extended", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("loadConfig returns default when storage is empty", () => {
    vi.stubGlobal("localStorage", createStorageMock());
    const config = loadConfig();
    expect(config.theme).toBe("dark");
    expect(config.watchlist).toEqual([]);
  });

  it("saveConfig then loadConfig roundtrips", () => {
    vi.stubGlobal("localStorage", createStorageMock());
    const config: AppConfig = {
      theme: "light",
      watchlist: [{ ticker: "AAPL", addedAt: "2025-01-01" }],
    };
    saveConfig(config);
    const loaded = loadConfig();
    expect(loaded.theme).toBe("light");
    expect(loaded.watchlist).toHaveLength(1);
    expect(loaded.watchlist[0]?.ticker).toBe("AAPL");
  });

  it("addTicker normalizes to uppercase", () => {
    const config: AppConfig = { theme: "dark", watchlist: [] };
    const next = addTicker(config, "aapl");
    expect(next.watchlist[0]?.ticker).toBe("AAPL");
  });

  it("addTicker ignores duplicate", () => {
    const config: AppConfig = {
      theme: "dark",
      watchlist: [{ ticker: "AAPL", addedAt: "2025-01-01" }],
    };
    const next = addTicker(config, "AAPL");
    expect(next.watchlist).toHaveLength(1);
  });

  it("addTicker ignores empty string", () => {
    const config: AppConfig = { theme: "dark", watchlist: [] };
    const next = addTicker(config, "  ");
    expect(next.watchlist).toHaveLength(0);
  });

  it("removeTicker removes matching entry", () => {
    const config: AppConfig = {
      theme: "dark",
      watchlist: [
        { ticker: "AAPL", addedAt: "2025-01-01" },
        { ticker: "GOOG", addedAt: "2025-01-02" },
      ],
    };
    const next = removeTicker(config, "AAPL");
    expect(next.watchlist).toHaveLength(1);
    expect(next.watchlist[0]?.ticker).toBe("GOOG");
  });

  it("removeTicker is no-op for non-existent ticker", () => {
    const config: AppConfig = {
      theme: "dark",
      watchlist: [{ ticker: "AAPL", addedAt: "2025-01-01" }],
    };
    const next = removeTicker(config, "MSFT");
    expect(next.watchlist).toHaveLength(1);
  });

  it("loadConfig returns default for corrupted storage", () => {
    vi.stubGlobal("localStorage", createStorageMock());
    localStorage.setItem("crosstide-config", "{invalid json!!");
    const config = loadConfig();
    expect(config.theme).toBe("dark");
  });
});
