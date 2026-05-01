/**
 * LruCache — bounded, in-memory least-recently-used cache.
 *
 * Backed by `Map` insertion-order semantics: on read, the entry is reinserted
 * to mark it most-recent; on write, the oldest entry is evicted once the
 * configured `max` capacity is exceeded.
 */

export interface LruCacheOptions {
  /** Maximum number of entries before eviction. Must be >= 1. */
  readonly max: number;
}

export class LruCache<K, V> {
  private readonly max: number;
  private readonly store = new Map<K, V>();

  constructor(options: LruCacheOptions) {
    if (!Number.isFinite(options.max) || options.max < 1) {
      throw new Error("LruCache: max must be a positive integer");
    }
    this.max = Math.floor(options.max);
  }

  get size(): number {
    return this.store.size;
  }

  get capacity(): number {
    return this.max;
  }

  has(key: K): boolean {
    return this.store.has(key);
  }

  /** Read a value and mark it most-recent. */
  get(key: K): V | undefined {
    if (!this.store.has(key)) return undefined;
    const value = this.store.get(key) as V;
    this.store.delete(key);
    this.store.set(key, value);
    return value;
  }

  /** Write a value, evicting the oldest entry if over capacity. */
  set(key: K, value: V): void {
    if (this.store.has(key)) this.store.delete(key);
    this.store.set(key, value);
    while (this.store.size > this.max) {
      const oldest = this.store.keys().next().value;
      if (oldest === undefined) break;
      this.store.delete(oldest);
    }
  }

  delete(key: K): boolean {
    return this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }

  keys(): IterableIterator<K> {
    return this.store.keys();
  }

  values(): IterableIterator<V> {
    return this.store.values();
  }

  entries(): IterableIterator<[K, V]> {
    return this.store.entries();
  }
}
