/**
 * Request deduplication — in-flight promise cache.
 *
 * If a request with the same key is already in progress, callers share the
 * same Promise rather than issuing duplicate network requests.  Once resolved
 * (or rejected), the entry is evicted so subsequent calls re-fetch fresh data.
 *
 * Usage:
 *   const data = await fetchOnce(`quote:${ticker}`, () => fetchTickerData(ticker));
 */

const inflight = new Map<string, Promise<unknown>>();

/**
 * Execute `fn` only once for a given `key` while the previous call is still
 * in-flight. Subsequent callers with the same key receive the same Promise.
 */
export function fetchOnce<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const existing = inflight.get(key) as Promise<T> | undefined;
  if (existing) return existing;

  const promise = fn().finally(() => {
    inflight.delete(key);
  });

  inflight.set(key, promise);
  return promise;
}

/** Number of currently in-flight deduplicated requests (for testing/monitoring). */
export function inflightCount(): number {
  return inflight.size;
}

/** Clear all in-flight entries (for testing teardown). */
export function clearInflight(): void {
  inflight.clear();
}
