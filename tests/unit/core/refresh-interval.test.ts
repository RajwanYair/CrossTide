/**
 * Auto-refresh interval setting tests.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { loadConfig, saveConfig } from "../../../src/core/config";
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

describe("refreshIntervalMs config", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", storageMock());
  });

  it("defaults to undefined when not set", () => {
    const config = loadConfig();
    expect(config.refreshIntervalMs).toBeUndefined();
  });

  it("persists and loads a valid refresh interval", () => {
    const config = loadConfig();
    const updated: AppConfig = { ...config, refreshIntervalMs: 120_000 };
    saveConfig(updated);
    const loaded = loadConfig();
    expect(loaded.refreshIntervalMs).toBe(120_000);
  });

  it("ignores invalid refresh intervals (too low)", () => {
    const config = loadConfig();
    const updated: AppConfig = { ...config, refreshIntervalMs: 1000 };
    saveConfig(updated);
    const loaded = loadConfig();
    expect(loaded.refreshIntervalMs).toBeUndefined();
  });

  it("ignores invalid refresh intervals (too high)", () => {
    const config = loadConfig();
    const updated: AppConfig = { ...config, refreshIntervalMs: 99_999_999 };
    saveConfig(updated);
    const loaded = loadConfig();
    expect(loaded.refreshIntervalMs).toBeUndefined();
  });
});
