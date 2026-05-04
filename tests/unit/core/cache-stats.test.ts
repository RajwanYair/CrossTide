import { describe, it, expect, beforeEach, vi } from "vitest";

function createStorageMock(): Storage {
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

describe("cache-stats", () => {
  async function loadModule() {
    return import("../../../src/core/cache-stats");
  }

  it("starts with zero stats", async () => {
    const { getCacheStats } = await loadModule();
    const stats = getCacheStats();
    expect(stats.hits).toBe(0);
    expect(stats.misses).toBe(0);
    expect(stats.hitRate).toBe(0);
  });

  it("records hits and misses", async () => {
    const { recordCacheHit, recordCacheMiss, getCacheStats } = await loadModule();
    recordCacheHit();
    recordCacheHit();
    recordCacheMiss();
    const stats = getCacheStats();
    expect(stats.hits).toBe(2);
    expect(stats.misses).toBe(1);
  });

  it("calculates hit rate correctly", async () => {
    const { recordCacheHit, recordCacheMiss, getCacheStats } = await loadModule();
    recordCacheHit();
    recordCacheHit();
    recordCacheHit();
    recordCacheMiss();
    expect(getCacheStats().hitRate).toBeCloseTo(0.75);
  });

  it("getHitRatePercent formats correctly", async () => {
    const { recordCacheHit, recordCacheMiss, getHitRatePercent } = await loadModule();
    recordCacheHit();
    recordCacheHit();
    recordCacheMiss();
    expect(getHitRatePercent()).toBe("66.7%");
  });

  it("updateEntryCount and updateStorageSize work", async () => {
    const { updateEntryCount, updateStorageSize, getCacheStats } = await loadModule();
    updateEntryCount(42);
    updateStorageSize(1024 * 500);
    const stats = getCacheStats();
    expect(stats.entries).toBe(42);
    expect(stats.estimatedSizeBytes).toBe(512000);
  });

  it("getFormattedSize formats bytes", async () => {
    const { updateStorageSize, getFormattedSize } = await loadModule();
    updateStorageSize(500);
    expect(getFormattedSize()).toBe("500 B");
    updateStorageSize(2048);
    expect(getFormattedSize()).toBe("2.0 KB");
    updateStorageSize(1536 * 1024);
    expect(getFormattedSize()).toBe("1.5 MB");
  });

  it("resetCacheStats clears everything", async () => {
    const { recordCacheHit, resetCacheStats, getCacheStats } = await loadModule();
    recordCacheHit();
    resetCacheStats();
    expect(getCacheStats().hits).toBe(0);
  });

  it("estimateLocalStorageUsage counts crosstide keys", async () => {
    const { estimateLocalStorageUsage } = await loadModule();
    localStorage.setItem("crosstide-config", '{"tickers":["AAPL"]}');
    localStorage.setItem("other-key", "ignored");
    const usage = estimateLocalStorageUsage();
    expect(usage.keys).toBe(1);
    expect(usage.bytes).toBeGreaterThan(0);
  });
});
