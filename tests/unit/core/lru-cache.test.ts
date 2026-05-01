import { describe, it, expect } from "vitest";
import { LruCache } from "../../../src/core/lru-cache";

describe("LruCache", () => {
  it("rejects invalid max", () => {
    expect(() => new LruCache({ max: 0 })).toThrow();
    expect(() => new LruCache({ max: -1 })).toThrow();
    expect(() => new LruCache({ max: Number.NaN })).toThrow();
  });

  it("stores and retrieves values", () => {
    const c = new LruCache<string, number>({ max: 3 });
    c.set("a", 1);
    c.set("b", 2);
    expect(c.get("a")).toBe(1);
    expect(c.get("b")).toBe(2);
    expect(c.size).toBe(2);
  });

  it("evicts least-recently-used on overflow", () => {
    const c = new LruCache<string, number>({ max: 2 });
    c.set("a", 1);
    c.set("b", 2);
    c.set("c", 3); // evicts "a"
    expect(c.has("a")).toBe(false);
    expect(c.has("b")).toBe(true);
    expect(c.has("c")).toBe(true);
  });

  it("get bumps recency", () => {
    const c = new LruCache<string, number>({ max: 2 });
    c.set("a", 1);
    c.set("b", 2);
    c.get("a"); // a now most recent
    c.set("c", 3); // evicts "b"
    expect(c.has("a")).toBe(true);
    expect(c.has("b")).toBe(false);
  });

  it("set on existing key bumps recency", () => {
    const c = new LruCache<string, number>({ max: 2 });
    c.set("a", 1);
    c.set("b", 2);
    c.set("a", 99);
    c.set("c", 3); // evicts "b"
    expect(c.get("a")).toBe(99);
    expect(c.has("b")).toBe(false);
  });

  it("delete removes entries", () => {
    const c = new LruCache<string, number>({ max: 3 });
    c.set("a", 1);
    expect(c.delete("a")).toBe(true);
    expect(c.delete("a")).toBe(false);
    expect(c.size).toBe(0);
  });

  it("clear empties the cache", () => {
    const c = new LruCache<string, number>({ max: 3 });
    c.set("a", 1);
    c.set("b", 2);
    c.clear();
    expect(c.size).toBe(0);
  });

  it("iterates keys/values/entries in LRU order", () => {
    const c = new LruCache<string, number>({ max: 3 });
    c.set("a", 1);
    c.set("b", 2);
    c.set("c", 3);
    expect([...c.keys()]).toEqual(["a", "b", "c"]);
    expect([...c.values()]).toEqual([1, 2, 3]);
    expect([...c.entries()]).toEqual([
      ["a", 1],
      ["b", 2],
      ["c", 3],
    ]);
  });
});
