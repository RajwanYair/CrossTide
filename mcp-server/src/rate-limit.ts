/**
 * Per-tool rate limiting for the CrossTide MCP server (roadmap E04).
 *
 * The stdio transport has no multi-tenant boundary — one process serves one
 * agent session — but a looping or misbehaving agent can still call a tool in
 * a tight loop before a request ever reaches the Worker's own rate limiter
 * (`worker/rate-limit.ts`). This is defense-in-depth, not a replacement for it.
 */

interface Bucket {
  tokens: number;
  lastRefill: number;
}

const CAPACITY = 30;
const REFILL_MS = 60_000; // 1 minute

const buckets = new Map<string, Bucket>();

/** Token-bucket check per tool name. Returns false when the tool is rate limited. */
export function checkToolRateLimit(toolName: string, nowMs = Date.now()): boolean {
  let bucket = buckets.get(toolName);
  if (!bucket) {
    bucket = { tokens: CAPACITY - 1, lastRefill: nowMs };
    buckets.set(toolName, bucket);
    return true;
  }

  const elapsed = nowMs - bucket.lastRefill;
  if (elapsed >= REFILL_MS) {
    bucket.tokens = CAPACITY - 1;
    bucket.lastRefill = nowMs;
    return true;
  }

  if (bucket.tokens > 0) {
    bucket.tokens -= 1;
    return true;
  }

  return false;
}

/** Test-only reset so cases don't leak bucket state across each other. */
export function resetToolRateLimits(): void {
  buckets.clear();
}
