/**
 * Full backup collector tests.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { collectFullBackup } from "../../../src/core/full-backup";
import { saveConfig } from "../../../src/core/config";
import { saveDrawings } from "../../../src/cards/drawing-persistence";
import { saveAlertRules } from "../../../src/core/alert-rules-store";
import type { AppConfig } from "../../../src/types/domain";

function storageMock(): Storage {
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

describe("collectFullBackup", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", storageMock());
  });

  it("includes watchlist from config", () => {
    const config: AppConfig = {
      theme: "dark",
      watchlist: [{ ticker: "AAPL", addedAt: "2024-01-01" }],
    };
    saveConfig(config);
    const backup = collectFullBackup();
    expect(backup.watchlist).toHaveLength(1);
    expect(backup.watchlist![0].ticker).toBe("AAPL");
  });

  it("includes theme", () => {
    const config: AppConfig = { theme: "light", watchlist: [] };
    saveConfig(config);
    const backup = collectFullBackup();
    expect(backup.theme).toBe("light");
  });

  it("includes drawings", () => {
    const config: AppConfig = { theme: "dark", watchlist: [] };
    saveConfig(config);
    saveDrawings("AAPL", [{ kind: "line", points: [] } as never]);
    const backup = collectFullBackup();
    expect(backup.drawings).toBeDefined();
    expect(backup.drawings!["AAPL"]).toHaveLength(1);
  });

  it("includes alert rules", () => {
    const config: AppConfig = { theme: "dark", watchlist: [] };
    saveConfig(config);
    saveAlertRules([
      {
        id: "r1",
        ticker: "AAPL",
        condition: "price_above",
        threshold: 200,
        enabled: true,
        createdAt: Date.now(),
      } as never,
    ]);
    const backup = collectFullBackup();
    expect(backup.alertRules).toHaveLength(1);
  });

  it("merges runtime domains", () => {
    const config: AppConfig = { theme: "dark", watchlist: [] };
    saveConfig(config);
    const backup = collectFullBackup({
      holdings: [{ ticker: "AAPL", shares: 10, avgCost: 150, currentPrice: 200 }],
    });
    expect(backup.holdings).toHaveLength(1);
  });
});
