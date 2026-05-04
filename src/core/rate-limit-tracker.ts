/**
 * Client-side rate-limit tracker — counts requests per provider within a
 * sliding time window. Used to visualize rate-limit consumption on the
 * provider health card.
 */

export interface RateLimitInfo {
  readonly provider: string;
  readonly requestsInWindow: number;
  readonly capacity: number;
  readonly usagePercent: number;
}

/** Default: 60 requests per 60-second window (matches server default). */
const DEFAULT_CAPACITY = 60;
const WINDOW_MS = 60_000;

/** Per-provider request timestamps within the window. */
const requestLog = new Map<string, number[]>();
const capacities = new Map<string, number>();

/** Record a request made to a provider. */
export function recordRequest(provider: string, now = Date.now()): void {
  const key = provider.toLowerCase();
  const timestamps = requestLog.get(key) ?? [];
  timestamps.push(now);
  requestLog.set(key, timestamps);
}

/** Set the known capacity for a provider (if server sends headers). */
export function setProviderCapacity(provider: string, capacity: number): void {
  capacities.set(provider.toLowerCase(), capacity);
}

/** Get rate-limit info for a provider. */
export function getRateLimitInfo(provider: string, now = Date.now()): RateLimitInfo {
  const key = provider.toLowerCase();
  const cutoff = now - WINDOW_MS;
  const timestamps = (requestLog.get(key) ?? []).filter((t) => t > cutoff);
  requestLog.set(key, timestamps); // prune old entries

  const capacity = capacities.get(key) ?? DEFAULT_CAPACITY;
  const requestsInWindow = timestamps.length;
  const usagePercent = Math.min(100, Math.round((requestsInWindow / capacity) * 100));

  return { provider, requestsInWindow, capacity, usagePercent };
}

/** Get rate-limit info for all tracked providers. */
export function getAllRateLimits(now = Date.now()): RateLimitInfo[] {
  return Array.from(requestLog.keys()).map((key) => getRateLimitInfo(key, now));
}

/** Clear all tracked data (for testing). */
export function resetRateLimits(): void {
  requestLog.clear();
  capacities.clear();
}
