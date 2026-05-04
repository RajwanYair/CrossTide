/**
 * Provider usage analytics — track API calls per provider for
 * rate limit awareness and usage optimization.
 */

export interface ProviderUsageEntry {
  readonly provider: string;
  readonly calls: number;
  readonly errors: number;
  readonly lastCallAt: number;
  readonly avgLatencyMs: number;
}

interface MutableEntry {
  provider: string;
  calls: number;
  errors: number;
  lastCallAt: number;
  totalLatency: number;
}

const entries = new Map<string, MutableEntry>();

/**
 * Record a successful API call for a provider.
 */
export function recordProviderCall(provider: string, latencyMs: number): void {
  const key = provider.toLowerCase();
  const entry = entries.get(key) ?? {
    provider: key,
    calls: 0,
    errors: 0,
    lastCallAt: 0,
    totalLatency: 0,
  };
  entry.calls++;
  entry.totalLatency += latencyMs;
  entry.lastCallAt = Date.now();
  entries.set(key, entry);
}

/**
 * Record a failed API call for a provider.
 */
export function recordProviderError(provider: string): void {
  const key = provider.toLowerCase();
  const entry = entries.get(key) ?? {
    provider: key,
    calls: 0,
    errors: 0,
    lastCallAt: 0,
    totalLatency: 0,
  };
  entry.errors++;
  entry.lastCallAt = Date.now();
  entries.set(key, entry);
}

/**
 * Get usage stats for a specific provider.
 */
export function getProviderUsage(provider: string): ProviderUsageEntry | null {
  const entry = entries.get(provider.toLowerCase());
  if (!entry) return null;
  return {
    provider: entry.provider,
    calls: entry.calls,
    errors: entry.errors,
    lastCallAt: entry.lastCallAt,
    avgLatencyMs: entry.calls > 0 ? entry.totalLatency / entry.calls : 0,
  };
}

/**
 * Get usage stats for all providers.
 */
export function getAllProviderUsage(): readonly ProviderUsageEntry[] {
  return [...entries.values()].map((e) => ({
    provider: e.provider,
    calls: e.calls,
    errors: e.errors,
    lastCallAt: e.lastCallAt,
    avgLatencyMs: e.calls > 0 ? e.totalLatency / e.calls : 0,
  }));
}

/**
 * Get the provider with the most calls.
 */
export function getMostUsedProvider(): string | null {
  let max = 0;
  let name: string | null = null;
  for (const entry of entries.values()) {
    if (entry.calls > max) {
      max = entry.calls;
      name = entry.provider;
    }
  }
  return name;
}

/**
 * Get error rate for a provider (0-1).
 */
export function getErrorRate(provider: string): number {
  const entry = entries.get(provider.toLowerCase());
  if (!entry || entry.calls === 0) return 0;
  return entry.errors / (entry.calls + entry.errors);
}

/**
 * Get total calls across all providers.
 */
export function getTotalCalls(): number {
  let total = 0;
  for (const entry of entries.values()) {
    total += entry.calls;
  }
  return total;
}

/**
 * Reset all usage stats.
 */
export function resetProviderUsage(): void {
  entries.clear();
}
