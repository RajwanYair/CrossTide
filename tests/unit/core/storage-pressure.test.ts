import { describe, it, expect, vi } from "vitest";
import {
  createStoragePressureMonitor,
  requestPersistentStorage,
} from "../../../src/core/storage-pressure";

describe("storage-pressure", () => {
  it("invokes onPressure when ratio crosses threshold", async () => {
    const cb = vi.fn();
    const m = createStoragePressureMonitor({
      threshold: 0.5,
      onPressure: cb,
      estimate: async () => ({ usage: 80, quota: 100, ratio: 0.8 }),
    });
    const e = await m.check();
    expect(e?.ratio).toBe(0.8);
    expect(cb).toHaveBeenCalledOnce();
  });

  it("does not invoke when below threshold", async () => {
    const cb = vi.fn();
    const m = createStoragePressureMonitor({
      threshold: 0.9,
      onPressure: cb,
      estimate: async () => ({ usage: 50, quota: 100, ratio: 0.5 }),
    });
    await m.check();
    expect(cb).not.toHaveBeenCalled();
  });

  it("returns null when estimate unavailable", async () => {
    const m = createStoragePressureMonitor({
      // no estimate; navigator.storage may not exist in test env
    });
    const e = await m.check();
    // depends on env; jsdom typically has no estimate
    if (typeof navigator === "undefined" || !navigator.storage) {
      expect(e).toBeNull();
    }
  });

  it("requestPersistentStorage returns false without API", async () => {
    const orig = (globalThis as { navigator?: { storage?: unknown } }).navigator;
    Object.defineProperty(globalThis, "navigator", {
      value: { storage: undefined },
      configurable: true,
    });
    try {
      expect(await requestPersistentStorage()).toBe(false);
    } finally {
      Object.defineProperty(globalThis, "navigator", {
        value: orig,
        configurable: true,
      });
    }
  });

  it("start/stop manages interval timer", async () => {
    vi.useFakeTimers();
    const probe = vi.fn().mockResolvedValue({ usage: 10, quota: 100, ratio: 0.1 });
    const m = createStoragePressureMonitor({
      intervalMs: 1000,
      estimate: probe,
    });
    m.start();
    m.start(); // idempotent
    vi.advanceTimersByTime(2500);
    await Promise.resolve();
    m.stop();
    m.stop(); // idempotent
    expect(probe).toHaveBeenCalled();
    vi.useRealTimers();
  });
});
