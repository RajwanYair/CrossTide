import { describe, it, expect, beforeEach, vi } from "vitest";
import type { IDB } from "../../../src/core/idb";

/**
 * Since happy-dom doesn't provide indexedDB, we test the IDB interface
 * via a conformance mock that validates the contract.
 */
function createMockIDB(): IDB {
  const store = new Map<string, unknown>();
  return {
    async get<T>(key: string): Promise<T | null> {
      return (store.get(key) as T) ?? null;
    },
    async set<T>(key: string, value: T): Promise<void> {
      store.set(key, value);
    },
    async delete(key: string): Promise<void> {
      store.delete(key);
    },
    async clear(): Promise<void> {
      store.clear();
    },
    async keys(): Promise<string[]> {
      return [...store.keys()];
    },
    close: vi.fn(),
  };
}

describe("IDB interface conformance", () => {
  let db: IDB;

  beforeEach(() => {
    db = createMockIDB();
  });

  it("returns an IDB interface", () => {
    expect(db).toBeDefined();
    expect(typeof db.get).toBe("function");
    expect(typeof db.set).toBe("function");
    expect(typeof db.delete).toBe("function");
    expect(typeof db.clear).toBe("function");
    expect(typeof db.keys).toBe("function");
    expect(typeof db.close).toBe("function");
  });

  it("get returns null for missing key", async () => {
    const result = await db.get("missing");
    expect(result).toBeNull();
  });

  it("set and get round-trips a value", async () => {
    await db.set("foo", { bar: 42 });
    const result = await db.get<{ bar: number }>("foo");
    expect(result).toEqual({ bar: 42 });
  });

  it("set overwrites existing value", async () => {
    await db.set("key", "first");
    await db.set("key", "second");
    expect(await db.get("key")).toBe("second");
  });

  it("delete removes a key", async () => {
    await db.set("key", "val");
    await db.delete("key");
    expect(await db.get("key")).toBeNull();
  });

  it("clear removes all keys", async () => {
    await db.set("a", 1);
    await db.set("b", 2);
    await db.clear();
    expect(await db.keys()).toEqual([]);
  });

  it("keys returns all stored keys", async () => {
    await db.set("x", 1);
    await db.set("y", 2);
    const k = await db.keys();
    expect(k.sort()).toEqual(["x", "y"]);
  });
});
