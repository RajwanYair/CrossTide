/**
 * Background-sync queue — buffer mutations while offline and replay them
 * once connectivity returns. Backed by `idb` for durability across
 * tab/process restarts.
 */
import { openIDB, type IDB } from "./idb";

const STORE = "sync-queue";

export interface QueuedRequest {
  readonly id: number;
  readonly url: string;
  readonly method: string;
  readonly body?: string;
  readonly headers?: Readonly<Record<string, string>>;
  readonly enqueuedAt: number;
  readonly attempts: number;
}

export interface SyncQueueOptions {
  readonly db?: IDB;
  /** Max attempts before dropping an item. Default 5. */
  readonly maxAttempts?: number;
  /** Time source (tests). */
  readonly now?: () => number;
  /** Custom fetch (tests). */
  readonly fetch?: typeof fetch;
}

export interface SyncQueue {
  enqueue(req: Omit<QueuedRequest, "id" | "enqueuedAt" | "attempts">): Promise<number>;
  size(): Promise<number>;
  list(): Promise<readonly QueuedRequest[]>;
  flush(): Promise<{ sent: number; failed: number; dropped: number }>;
  clear(): Promise<void>;
}

let nextId = 1;

async function loadAll(db: IDB): Promise<QueuedRequest[]> {
  const keys = await db.keys(STORE);
  const out: QueuedRequest[] = [];
  for (const k of keys) {
    const v = await db.get<QueuedRequest>(k, STORE);
    if (v) out.push(v);
  }
  return out;
}

export async function createSyncQueue(options: SyncQueueOptions = {}): Promise<SyncQueue> {
  const db = options.db ?? (await openIDB("crosstide-sync", [STORE], 1));
  const maxAttempts = options.maxAttempts ?? 5;
  const now = options.now ?? ((): number => Date.now());
  const fetcher = options.fetch ?? fetch;

  return {
    async enqueue(req): Promise<number> {
      const id = nextId++;
      const base = { id, url: req.url, method: req.method, enqueuedAt: now(), attempts: 0 };
      let item: QueuedRequest;
      if (req.body !== undefined && req.headers !== undefined)
        item = { ...base, body: req.body, headers: req.headers };
      else if (req.body !== undefined) item = { ...base, body: req.body };
      else if (req.headers !== undefined) item = { ...base, headers: req.headers };
      else item = base;
      await db.set(String(id), item, STORE);
      return id;
    },
    async size(): Promise<number> {
      const all = await loadAll(db);
      return all.length;
    },
    async list(): Promise<readonly QueuedRequest[]> {
      const all = await loadAll(db);
      return [...all].sort((a, b) => a.id - b.id);
    },
    async flush(): Promise<{ sent: number; failed: number; dropped: number }> {
      const items = await loadAll(db);
      let sent = 0;
      let failed = 0;
      let dropped = 0;
      for (const item of items) {
        let ok: boolean;
        try {
          const init: RequestInit = { method: item.method };
          if (item.body !== undefined) init.body = item.body;
          if (item.headers !== undefined) init.headers = item.headers;
          const res = await fetcher(item.url, init);
          ok = res.ok;
        } catch {
          ok = false;
        }
        if (ok) {
          await db.delete(String(item.id), STORE);
          sent++;
        } else {
          const next: QueuedRequest = { ...item, attempts: item.attempts + 1 };
          if (next.attempts >= maxAttempts) {
            await db.delete(String(item.id), STORE);
            dropped++;
          } else {
            await db.set(String(item.id), next, STORE);
            failed++;
          }
        }
      }
      return { sent, failed, dropped };
    },
    async clear(): Promise<void> {
      await db.clear(STORE);
    },
  };
}
