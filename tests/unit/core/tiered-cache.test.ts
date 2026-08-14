import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { TieredCache } from "../../../src/core/tiered-cache";
import { getCacheStats, resetCacheStats } from "../../../src/core/cache-stats";

function createStorageMock(): Storage {
  const store = new Map<string, string>();
  return {
    get length() {
      return store.size;
    },
    key(index: number) {
      return [...store.keys()][index] ?? null;
    },
    getItem(key: string) {
      return store.get(key) ?? null;
    },
    setItem(key: string, value: string) {
      store.set(key, value);
    },
    removeItem(key: string) {
      store.delete(key);
    },
    clear() {
      store.clear();
    },
  };
}

describe("TieredCache", () => {
  let cache: TieredCache;

  beforeEach(() => {
    vi.stubGlobal("localStorage", createStorageMock());
    resetCacheStats();
    cache = new TieredCache();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns null for missing key", () => {
    expect(cache.get("nope")).toBeNull();
    expect(getCacheStats()).toMatchObject({ hits: 0, misses: 1, hitRate: 0 });
  });

  it("set and get round-trip from L1", () => {
    cache.set("k", "v", 60_000);
    expect(cache.get("k")).toBe("v");
  });

  it("persists to localStorage (L2)", () => {
    cache.set("k", 42, 60_000);
    const raw = localStorage.getItem("ct_cache_k");
    expect(raw).not.toBeNull();
    const parsed = JSON.parse(raw!);
    expect(parsed.value).toBe(42);
  });

  it("reads from L2 when L1 is empty", () => {
    cache.set("k", { a: 1 }, 60_000);
    // Create a new cache instance (L1 is empty)
    const cache2 = new TieredCache();
    expect(cache2.get<{ a: number }>("k")).toEqual({ a: 1 });
    expect(getCacheStats()).toMatchObject({ hits: 1, misses: 0, hitRate: 1 });
  });

  it("evicts expired entries from L1", () => {
    cache.set("k", "old", 1); // 1ms TTL
    // Wait for expiry
    const start = Date.now();
    while (Date.now() - start < 5) {
      /* spin */
    }
    expect(cache.get("k")).toBeNull();
  });

  it("delete removes from both tiers", () => {
    cache.set("k", "v", 60_000);
    cache.delete("k");
    expect(cache.get("k")).toBeNull();
    expect(localStorage.getItem("ct_cache_k")).toBeNull();
  });

  it("clear removes all entries", () => {
    cache.set("a", 1, 60_000);
    cache.set("b", 2, 60_000);
    cache.clear();
    expect(cache.size).toBe(0);
    expect(cache.get("a")).toBeNull();
    expect(cache.get("b")).toBeNull();
  });

  it("size reflects L1 entries", () => {
    expect(cache.size).toBe(0);
    cache.set("x", 1, 60_000);
    cache.set("y", 2, 60_000);
    expect(cache.size).toBe(2);
  });

  it("evictOldest removes the N soonest-to-expire entries", () => {
    // Set entries with ascending TTLs so oldest (shortest TTL) evicts first
    cache.set("a", 1, 1_000);
    cache.set("b", 2, 2_000);
    cache.set("c", 3, 3_000);
    const evicted = cache.evictOldest(2);
    expect(evicted).toBe(2);
    expect(cache.size).toBe(1);
    // "c" (longest TTL) should remain
    expect(cache.get("c")).toBe(3);
    expect(cache.get("a")).toBeNull();
    expect(cache.get("b")).toBeNull();
  });

  it("evictOldest returns 0 when cache is empty", () => {
    expect(cache.evictOldest(5)).toBe(0);
  });

  it("evictOldest clamps to actual size", () => {
    cache.set("x", 1, 60_000);
    const evicted = cache.evictOldest(100);
    expect(evicted).toBe(1);
    expect(cache.size).toBe(0);
  });
});
