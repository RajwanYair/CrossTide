import { describe, it, expect, vi } from "vitest";
import { createSyncQueue, type QueuedRequest } from "../../../src/core/sync-queue";
import type { IDB } from "../../../src/core/idb";

function makeMemDb(): IDB {
  const stores = new Map<string, Map<string, unknown>>();
  function getStore(name = "kv"): Map<string, unknown> {
    let m = stores.get(name);
    if (!m) {
      m = new Map();
      stores.set(name, m);
    }
    return m;
  }
  return {
    async get<T>(key: string, storeName?: string): Promise<T | null> {
      return (getStore(storeName).get(key) as T) ?? null;
    },
    async set<T>(key: string, value: T, storeName?: string): Promise<void> {
      getStore(storeName).set(key, value);
    },
    async delete(key: string, storeName?: string): Promise<void> {
      getStore(storeName).delete(key);
    },
    async clear(storeName?: string): Promise<void> {
      getStore(storeName).clear();
    },
    async keys(storeName?: string): Promise<string[]> {
      return [...getStore(storeName).keys()];
    },
    close(): void {
      /* no-op */
    },
  };
}

function jsonResponse(ok: boolean): Response {
  return { ok, status: ok ? 200 : 500 } as Response;
}

describe("sync-queue", () => {
  it("enqueues and lists requests", async () => {
    const db = makeMemDb();
    const q = await createSyncQueue({ db });
    await q.enqueue({ url: "/a", method: "POST", body: "{}" });
    await q.enqueue({ url: "/b", method: "PUT" });
    expect(await q.size()).toBe(2);
    const items = await q.list();
    expect(items[0]?.url).toBe("/a");
    expect(items[1]?.url).toBe("/b");
  });

  it("flush sends all and removes successful", async () => {
    const db = makeMemDb();
    const fetcher = vi.fn().mockResolvedValue(jsonResponse(true));
    const q = await createSyncQueue({
      db,
      fetch: fetcher as unknown as typeof fetch,
    });
    await q.enqueue({ url: "/a", method: "POST" });
    await q.enqueue({ url: "/b", method: "POST" });
    const r = await q.flush();
    expect(r.sent).toBe(2);
    expect(await q.size()).toBe(0);
  });

  it("flush increments attempts on failure", async () => {
    const db = makeMemDb();
    const fetcher = vi.fn().mockResolvedValue(jsonResponse(false));
    const q = await createSyncQueue({
      db,
      maxAttempts: 3,
      fetch: fetcher as unknown as typeof fetch,
    });
    await q.enqueue({ url: "/x", method: "POST" });
    const r1 = await q.flush();
    expect(r1.failed).toBe(1);
    const items = await q.list();
    expect(items[0]?.attempts).toBe(1);
  });

  it("drops items past maxAttempts", async () => {
    const db = makeMemDb();
    const fetcher = vi.fn().mockResolvedValue(jsonResponse(false));
    const q = await createSyncQueue({
      db,
      maxAttempts: 2,
      fetch: fetcher as unknown as typeof fetch,
    });
    await q.enqueue({ url: "/x", method: "POST" });
    await q.flush();
    const r2 = await q.flush();
    expect(r2.dropped).toBe(1);
    expect(await q.size()).toBe(0);
  });

  it("network error counted as failure", async () => {
    const db = makeMemDb();
    const fetcher = vi.fn().mockRejectedValue(new Error("offline"));
    const q = await createSyncQueue({
      db,
      maxAttempts: 5,
      fetch: fetcher as unknown as typeof fetch,
    });
    await q.enqueue({ url: "/x", method: "POST" });
    const r = await q.flush();
    expect(r.failed).toBe(1);
  });

  it("clear removes all items", async () => {
    const db = makeMemDb();
    const q = await createSyncQueue({ db });
    await q.enqueue({ url: "/a", method: "POST" });
    await q.clear();
    expect(await q.size()).toBe(0);
  });

  it("preserves enqueued metadata", async () => {
    const db = makeMemDb();
    const q = await createSyncQueue({ db, now: () => 1234 });
    const id = await q.enqueue({ url: "/a", method: "POST", body: "x" });
    const items = await q.list();
    const item = items.find((i: QueuedRequest) => i.id === id);
    expect(item?.enqueuedAt).toBe(1234);
    expect(item?.body).toBe("x");
  });
});
