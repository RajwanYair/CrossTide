/**
 * Multi-tier cache — L1 in-memory Map + L2 localStorage with TTL.
 *
 * L1 is fast/transient (process lifetime).
 * L2 is persistent (survives refresh, ~5 MB limit).
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

const L2_PREFIX = "ct_cache_";

export class TieredCache {
  private readonly l1 = new Map<string, CacheEntry<unknown>>();

  get<T>(key: string): T | null {
    // L1 hit
    const l1Entry = this.l1.get(key) as CacheEntry<T> | undefined;
    if (l1Entry) {
      if (Date.now() <= l1Entry.expiresAt) return l1Entry.value;
      this.l1.delete(key);
    }

    // L2 hit
    try {
      const raw = localStorage.getItem(L2_PREFIX + key);
      if (raw) {
        const entry = JSON.parse(raw) as CacheEntry<T>;
        if (Date.now() <= entry.expiresAt) {
          // Promote to L1
          this.l1.set(key, entry);
          return entry.value;
        }
        localStorage.removeItem(L2_PREFIX + key);
      }
    } catch {
      // localStorage unavailable or corrupt — ignore
    }

    return null;
  }

  set<T>(key: string, value: T, ttlMs: number): void {
    const entry: CacheEntry<T> = { value, expiresAt: Date.now() + ttlMs };
    this.l1.set(key, entry);

    try {
      localStorage.setItem(L2_PREFIX + key, JSON.stringify(entry));
    } catch {
      // Quota exceeded or unavailable — L1 still works
    }
  }

  delete(key: string): void {
    this.l1.delete(key);
    try {
      localStorage.removeItem(L2_PREFIX + key);
    } catch {
      // ignore
    }
  }

  clear(): void {
    this.l1.clear();
    try {
      const toRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k?.startsWith(L2_PREFIX)) toRemove.push(k);
      }
      for (const k of toRemove) localStorage.removeItem(k);
    } catch {
      // ignore
    }
  }

  get size(): number {
    return this.l1.size;
  }
}
