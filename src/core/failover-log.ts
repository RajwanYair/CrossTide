/**
 * Provider failover event log — tracks when providers fail and which
 * fallback provider handled the request.
 *
 * Maintains a circular buffer of the last N failover events in memory
 * for diagnostics and transparency.
 */

export interface FailoverEvent {
  readonly timestamp: number;
  readonly ticker: string;
  readonly failedProvider: string;
  readonly reason: string;
  readonly fallbackProvider: string;
  readonly latencyMs: number;
}

const MAX_EVENTS = 50;

let events: FailoverEvent[] = [];
let listeners: Array<(event: FailoverEvent) => void> = [];

/**
 * Record a failover event.
 */
export function recordFailover(event: FailoverEvent): void {
  events.push(event);
  if (events.length > MAX_EVENTS) {
    events = events.slice(-MAX_EVENTS);
  }
  for (const fn of listeners) {
    fn(event);
  }
}

/**
 * Get all recorded failover events (oldest first).
 */
export function getFailoverLog(): readonly FailoverEvent[] {
  return events;
}

/**
 * Get the most recent N failover events.
 */
export function getRecentFailovers(count: number = 10): readonly FailoverEvent[] {
  return events.slice(-count);
}

/**
 * Get failover count for a specific provider.
 */
export function getFailoverCountByProvider(providerName: string): number {
  return events.filter((e) => e.failedProvider === providerName).length;
}

/**
 * Get summary statistics for all providers.
 */
export function getFailoverSummary(): ReadonlyMap<
  string,
  { failures: number; lastFailure: number }
> {
  const map = new Map<string, { failures: number; lastFailure: number }>();
  for (const e of events) {
    const existing = map.get(e.failedProvider);
    if (!existing || e.timestamp > existing.lastFailure) {
      map.set(e.failedProvider, {
        failures: (existing?.failures ?? 0) + 1,
        lastFailure: e.timestamp,
      });
    }
  }
  return map;
}

/**
 * Subscribe to new failover events.
 * Returns an unsubscribe function.
 */
export function onFailover(fn: (event: FailoverEvent) => void): () => void {
  listeners.push(fn);
  return (): void => {
    listeners = listeners.filter((l) => l !== fn);
  };
}

/**
 * Clear the failover log.
 */
export function clearFailoverLog(): void {
  events = [];
}

/**
 * Get the maximum number of events stored.
 */
export function getMaxEvents(): number {
  return MAX_EVENTS;
}
