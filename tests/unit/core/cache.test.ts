/**
 * Cache tests.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Cache } from "../../../src/core/cache";

describe("Cache", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns null for missing keys", () => {
    const cache = new Cache();
    expect(cache.get("missing")).toBeNull();
  });

  it("stores and retrieves values", () => {
    const cache = new Cache();
    cache.set("key", 42, 60000);
    expect(cache.get("key")).toBe(42);
  });

  it("evicts expired entries on get()", () => {
    const cache = new Cache();
    cache.set("key", "value", 1000);
    expect(cache.get("key")).toBe("value");

    vi.advanceTimersByTime(1001);
    expect(cache.get("key")).toBeNull();
  });

  it("delete() removes an entry", () => {
    const cache = new Cache();
    cache.set("key", "val", 60000);
    cache.delete("key");
    expect(cache.get("key")).toBeNull();
  });

  it("clear() removes all entries", () => {
    const cache = new Cache();
    cache.set("a", 1, 60000);
    cache.set("b", 2, 60000);
    expect(cache.size).toBe(2);
    cache.clear();
    expect(cache.size).toBe(0);
  });

  it("size reflects current entry count", () => {
    const cache = new Cache();
    expect(cache.size).toBe(0);
    cache.set("x", 1, 60000);
    expect(cache.size).toBe(1);
  });
});
