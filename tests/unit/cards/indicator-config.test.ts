import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  loadIndicatorConfig,
  saveIndicatorConfig,
  resetIndicatorConfig,
  DEFAULT_CONFIG,
} from "../../../src/cards/indicator-config";

function storageMock(): Storage {
  const store: Record<string, string> = {};
  return {
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => {
      store[k] = v;
    },
    removeItem: (k: string) => {
      delete store[k];
    },
    clear: () => {
      Object.keys(store).forEach((k) => delete store[k]);
    },
    key: (i: number) => Object.keys(store)[i] ?? null,
    get length() {
      return Object.keys(store).length;
    },
  };
}

describe("indicator-config", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", storageMock());
  });

  it("returns default config when nothing is stored", () => {
    const config = loadIndicatorConfig();
    expect(config).toEqual(DEFAULT_CONFIG);
  });

  it("persists and loads custom config", () => {
    const custom = {
      ...DEFAULT_CONFIG,
      sma: { fastPeriod: 20, slowPeriod: 100 },
    };
    saveIndicatorConfig(custom);
    const loaded = loadIndicatorConfig();
    expect(loaded.sma.fastPeriod).toBe(20);
    expect(loaded.sma.slowPeriod).toBe(100);
    expect(loaded.rsi).toEqual(DEFAULT_CONFIG.rsi);
  });

  it("resets to defaults", () => {
    saveIndicatorConfig({ ...DEFAULT_CONFIG, rsi: { period: 7, overbought: 80, oversold: 20 } });
    resetIndicatorConfig();
    const loaded = loadIndicatorConfig();
    expect(loaded).toEqual(DEFAULT_CONFIG);
  });

  it("handles corrupted localStorage gracefully", () => {
    localStorage.setItem("crosstide-indicator-config", "not-json");
    const config = loadIndicatorConfig();
    expect(config).toEqual(DEFAULT_CONFIG);
  });

  it("merges partial stored config with defaults", () => {
    localStorage.setItem("crosstide-indicator-config", JSON.stringify({ sma: { fastPeriod: 10 } }));
    const config = loadIndicatorConfig();
    expect(config.sma.fastPeriod).toBe(10);
    expect(config.sma.slowPeriod).toBe(200);
    expect(config.rsi).toEqual(DEFAULT_CONFIG.rsi);
  });
});
