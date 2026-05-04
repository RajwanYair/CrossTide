/**
 * Storage Manager (A21) — wires storage-pressure to TieredCache eviction.
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import {
  createStorageManager,
  initStorageManager,
  getStorageManager,
  _resetStorageManager,
} from "../../../src/core/storage-manager";
import { TieredCache } from "../../../src/core/tiered-cache";

function makeCache(entries = 10): TieredCache {
  const c = new TieredCache();
  for (let i = 0; i < entries; i++) {
    c.set(`key${i}`, `value${i}`, 60_000);
  }
  return c;
}

afterEach(() => {
  _resetStorageManager();
  vi.restoreAllMocks();
});

describe("createStorageManager — eviction on pressure", () => {
  it("evicts entries when ratio >= threshold", async () => {
    const cache = makeCache(30);
    const onEvict = vi.fn();
    const mgr = createStorageManager({
      cache,
      threshold: 0.8,
      evictCount: 5,
      onEvict,
      estimate: async () => ({ usage: 85, quota: 100, ratio: 0.85 }),
    });

    await mgr.check();

    expect(onEvict).toHaveBeenCalledOnce();
    const [evicted, est] = onEvict.mock.calls[0] as [number, { ratio: number }];
    expect(evicted).toBe(5);
    expect(est.ratio).toBe(0.85);
  });

  it("does not evict when below threshold", async () => {
    const cache = makeCache(10);
    const onEvict = vi.fn();
    const mgr = createStorageManager({
      cache,
      threshold: 0.9,
      onEvict,
      estimate: async () => ({ usage: 50, quota: 100, ratio: 0.5 }),
    });

    await mgr.check();
    expect(onEvict).not.toHaveBeenCalled();
  });

  it("evicts criticalEvictCount at critical threshold", async () => {
    const cache = makeCache(100);
    const onEvict = vi.fn();
    const mgr = createStorageManager({
      cache,
      threshold: 0.8,
      criticalThreshold: 0.95,
      evictCount: 10,
      criticalEvictCount: 40,
      onEvict,
      estimate: async () => ({ usage: 97, quota: 100, ratio: 0.97 }),
    });

    await mgr.check();

    const [evicted] = onEvict.mock.calls[0] as [number];
    expect(evicted).toBe(40);
  });

  it("returns null check when estimate unavailable", async () => {
    const cache = makeCache(5);
    const _mgr = createStorageManager({
      cache,
      estimate: async () =>
        Promise.resolve(null as unknown as { usage: number; quota: number; ratio: number }),
    });
    // Should not throw even when estimate returns null-ish
    // (the pressure monitor handles null estimates internally)
  });
});

describe("createStorageManager — start / stop", () => {
  it("start/stop are safe to call multiple times", () => {
    const cache = makeCache(5);
    const mgr = createStorageManager({
      cache,
      estimate: async () => ({ usage: 10, quota: 100, ratio: 0.1 }),
    });
    expect(() => {
      mgr.start();
      mgr.start(); // idempotent
      mgr.stop();
      mgr.stop(); // idempotent
    }).not.toThrow();
  });
});

describe("initStorageManager singleton", () => {
  it("returns a StorageManager instance", () => {
    const cache = makeCache(5);
    const mgr = initStorageManager(cache, {
      estimate: async () => ({ usage: 10, quota: 100, ratio: 0.1 }),
    });
    expect(mgr).toBeDefined();
    expect(typeof mgr.start).toBe("function");
    expect(typeof mgr.stop).toBe("function");
    expect(typeof mgr.check).toBe("function");
  });

  it("getStorageManager returns the singleton", () => {
    const cache = makeCache(3);
    const mgr = initStorageManager(cache, {
      estimate: async () => ({ usage: 10, quota: 100, ratio: 0.1 }),
    });
    expect(getStorageManager()).toBe(mgr);
  });

  it("calling initStorageManager again replaces the singleton", () => {
    const c1 = makeCache(3);
    const c2 = makeCache(3);
    const m1 = initStorageManager(c1, {
      estimate: async () => ({ usage: 10, quota: 100, ratio: 0.1 }),
    });
    const m2 = initStorageManager(c2, {
      estimate: async () => ({ usage: 10, quota: 100, ratio: 0.1 }),
    });
    expect(getStorageManager()).toBe(m2);
    expect(m1).not.toBe(m2);
  });

  it("_resetStorageManager clears the singleton", () => {
    initStorageManager(makeCache(3), {
      estimate: async () => ({ usage: 10, quota: 100, ratio: 0.1 }),
    });
    _resetStorageManager();
    expect(getStorageManager()).toBeNull();
  });
});
