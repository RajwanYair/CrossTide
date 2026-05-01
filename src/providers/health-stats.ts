/**
 * Provider health statistics aggregator. Collects per-provider request
 * outcomes and produces summary metrics (success rate, median latency,
 * error counts by type) for the provider-health card.
 *
 * Pure module: no globals, no IO.
 */

export type RequestOutcome = "success" | "error" | "timeout" | "rate-limit";

export interface RequestSample {
  readonly providerId: string;
  readonly outcome: RequestOutcome;
  readonly latencyMs: number;
  readonly timestamp: number;
}

export interface ProviderStats {
  readonly providerId: string;
  readonly total: number;
  readonly successCount: number;
  readonly errorCount: number;
  readonly timeoutCount: number;
  readonly rateLimitCount: number;
  readonly successRate: number;
  readonly p50LatencyMs: number;
  readonly p95LatencyMs: number;
  readonly meanLatencyMs: number;
}

function percentile(sorted: readonly number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.floor((p / 100) * sorted.length)));
  return sorted[idx] ?? 0;
}

export function aggregateStats(
  samples: readonly RequestSample[],
  providerId: string,
): ProviderStats {
  const own = samples.filter((s) => s.providerId === providerId);
  const total = own.length;
  let successCount = 0;
  let errorCount = 0;
  let timeoutCount = 0;
  let rateLimitCount = 0;
  const latencies: number[] = [];
  let latencySum = 0;
  for (const s of own) {
    switch (s.outcome) {
      case "success":
        successCount++;
        break;
      case "error":
        errorCount++;
        break;
      case "timeout":
        timeoutCount++;
        break;
      case "rate-limit":
        rateLimitCount++;
        break;
    }
    if (Number.isFinite(s.latencyMs)) {
      latencies.push(s.latencyMs);
      latencySum += s.latencyMs;
    }
  }
  latencies.sort((a, b) => a - b);
  return {
    providerId,
    total,
    successCount,
    errorCount,
    timeoutCount,
    rateLimitCount,
    successRate: total === 0 ? 0 : successCount / total,
    p50LatencyMs: percentile(latencies, 50),
    p95LatencyMs: percentile(latencies, 95),
    meanLatencyMs: latencies.length === 0 ? 0 : latencySum / latencies.length,
  };
}

export function aggregateAll(samples: readonly RequestSample[]): ProviderStats[] {
  const ids = new Set(samples.map((s) => s.providerId));
  return Array.from(ids).map((id) => aggregateStats(samples, id));
}

/** Drop samples older than `maxAgeMs` relative to `now`. */
export function pruneOld(
  samples: readonly RequestSample[],
  now: number,
  maxAgeMs: number,
): RequestSample[] {
  const cutoff = now - maxAgeMs;
  return samples.filter((s) => s.timestamp >= cutoff);
}
