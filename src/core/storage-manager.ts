/**
 * Storage Manager (A21) — wires `storage-pressure.ts` to automatic LRU
 * eviction of the `TieredCache` (L1+L2) when quota pressure is detected.
 *
 * Usage (call once from main.ts after app initialisation):
 *   import { initStorageManager } from "./storage-manager";
 *   initStorageManager(tieredCache);
 *
 * The monitor polls `navigator.storage.estimate()` every 60 s.
 * At ≥ 80% usage it evicts the oldest 20 entries from the cache.
 * At ≥ 95% usage it evicts an additional 50 entries and requests
 * persistent storage via `navigator.storage.persist()`.
 */

import {
  createStoragePressureMonitor,
  requestPersistentStorage,
  type StoragePressureMonitor,
  type StorageEstimate,
} from "./storage-pressure";
import type { TieredCache } from "./tiered-cache";

export interface StorageManagerOptions {
  /** Cache instance to evict from under pressure. */
  readonly cache: TieredCache;
  /** Pressure threshold (0..1). Default 0.8 */
  readonly threshold?: number;
  /** Extra-high pressure threshold for aggressive eviction. Default 0.95. */
  readonly criticalThreshold?: number;
  /** Number of entries to evict at warning level. Default 20. */
  readonly evictCount?: number;
  /** Number of entries to evict at critical level. Default 50. */
  readonly criticalEvictCount?: number;
  /** Polling interval in ms. Default 60_000. */
  readonly intervalMs?: number;
  /** Override estimate function (for testing). */
  readonly estimate?: () => Promise<StorageEstimate>;
  /** Called after each eviction (useful for testing). */
  readonly onEvict?: (evicted: number, estimate: StorageEstimate) => void;
}

export interface StorageManager {
  /** Start polling. Safe to call multiple times (idempotent). */
  start(): void;
  /** Stop polling. */
  stop(): void;
  /** Manually trigger a pressure check. */
  check(): Promise<StorageEstimate | null>;
}

/**
 * Create and start a storage manager for the given cache.
 * Returns the monitor instance for lifecycle control.
 */
export function createStorageManager(options: StorageManagerOptions): StorageManager {
  const {
    cache,
    threshold = 0.8,
    criticalThreshold = 0.95,
    evictCount = 20,
    criticalEvictCount = 50,
    intervalMs = 60_000,
    estimate,
    onEvict,
  } = options;

  async function handlePressure(est: StorageEstimate): Promise<void> {
    const count = est.ratio >= criticalThreshold ? criticalEvictCount : evictCount;
    const evicted = cache.evictOldest(count);
    onEvict?.(evicted, est);

    // At critical pressure, request persistent storage to protect remaining data
    if (est.ratio >= criticalThreshold) {
      await requestPersistentStorage();
    }
  }

  const monitor: StoragePressureMonitor = createStoragePressureMonitor({
    threshold,
    intervalMs,
    estimate,
    onPressure: handlePressure,
  });

  return {
    start: (): void => monitor.start(),
    stop: (): void => monitor.stop(),
    check: (): Promise<StorageEstimate | null> => monitor.check(),
  };
}

/**
 * Module-level singleton — call `initStorageManager(cache)` from `main.ts`.
 */
let _manager: StorageManager | null = null;

export function initStorageManager(
  cache: TieredCache,
  options: Omit<StorageManagerOptions, "cache"> = {},
): StorageManager {
  _manager?.stop();
  _manager = createStorageManager({ cache, ...options });
  _manager.start();
  return _manager;
}

export function getStorageManager(): StorageManager | null {
  return _manager;
}

/** @internal For tests — reset the singleton. */
export function _resetStorageManager(): void {
  _manager?.stop();
  _manager = null;
}
