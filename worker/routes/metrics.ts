/** Process-local Worker performance metrics for production probes. */

const MAX_REQUEST_SAMPLES = 1_000;
const requestDurations: number[] = [];
let requestCount = 0;

export interface MetricsResponse {
  readonly schemaVersion: "1";
  readonly generatedAt: string;
  readonly requestCount: number;
  readonly requestP95Ms: number | null;
  readonly cacheHitRate: number | null;
  readonly websocketRecoveryMs: number | null;
  readonly limitations: readonly string[];
}

/** Record one completed request for the current Worker isolate. */
export function recordRequestDuration(durationMs: number): void {
  requestCount++;
  requestDurations.push(Math.max(0, durationMs));
  if (requestDurations.length > MAX_REQUEST_SAMPLES) requestDurations.shift();
}

function calculateP95(samples: readonly number[]): number | null {
  if (samples.length === 0) return null;
  const sorted = [...samples].sort((left, right) => left - right);
  return sorted[Math.max(0, Math.ceil(sorted.length * 0.95) - 1)] ?? null;
}

/** Return metrics observed by this Worker isolate without exposing secrets. */
export function handleMetrics(): Response {
  const body: MetricsResponse = {
    schemaVersion: "1",
    generatedAt: new Date().toISOString(),
    requestCount,
    requestP95Ms: calculateP95(requestDurations),
    cacheHitRate: null,
    websocketRecoveryMs: null,
    limitations: [
      "Request metrics are process-local and reset when the Worker isolate is replaced",
      "Cache hit rate and WebSocket recovery are browser-owned metrics and are not reported here",
    ],
  };
  return Response.json(body);
}

/** Reset process-local metrics for deterministic tests. */
export function resetMetrics(): void {
  requestCount = 0;
  requestDurations.length = 0;
}
