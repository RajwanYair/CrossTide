/**
 * Data cache statistics — tracks cache hit/miss rates, storage usage,
 * and entry counts for diagnostics and transparency.
 *
 * Provides both real-time counters (in-memory) and snapshot queries.
 */

export interface CacheStats {
  readonly hits: number;
  readonly misses: number;
  readonly hitRate: number; // 0–1
  readonly entries: number;
  readonly estimatedSizeBytes: number;
}

let hits = 0;
let misses = 0;
let entries = 0;
let estimatedSizeBytes = 0;

/**
 * Record a cache hit.
 */
export function recordCacheHit(): void {
  hits++;
}

/**
 * Record a cache miss.
 */
export function recordCacheMiss(): void {
  misses++;
}

/**
 * Update the count of cache entries.
 */
export function updateEntryCount(count: number): void {
  entries = count;
}

/**
 * Update the estimated storage size in bytes.
 */
export function updateStorageSize(bytes: number): void {
  estimatedSizeBytes = bytes;
}

/**
 * Get current cache statistics snapshot.
 */
export function getCacheStats(): CacheStats {
  const total = hits + misses;
  return {
    hits,
    misses,
    hitRate: total > 0 ? hits / total : 0,
    entries,
    estimatedSizeBytes,
  };
}

/**
 * Get the hit rate as a percentage string (e.g., "85.3%").
 */
export function getHitRatePercent(): string {
  const stats = getCacheStats();
  return `${(stats.hitRate * 100).toFixed(1)}%`;
}

/**
 * Get human-readable storage size.
 */
export function getFormattedSize(): string {
  if (estimatedSizeBytes < 1024) return `${estimatedSizeBytes} B`;
  if (estimatedSizeBytes < 1024 * 1024) return `${(estimatedSizeBytes / 1024).toFixed(1)} KB`;
  return `${(estimatedSizeBytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Reset all counters.
 */
export function resetCacheStats(): void {
  hits = 0;
  misses = 0;
  entries = 0;
  estimatedSizeBytes = 0;
}

/**
 * Estimate localStorage usage for CrossTide keys.
 */
export function estimateLocalStorageUsage(): { keys: number; bytes: number } {
  let totalBytes = 0;
  let keyCount = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith("crosstide")) {
      const value = localStorage.getItem(key) ?? "";
      totalBytes += key.length * 2 + value.length * 2; // UTF-16
      keyCount++;
    }
  }
  return { keys: keyCount, bytes: totalBytes };
}
