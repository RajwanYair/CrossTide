/**
 * Rate limiter for the CrossTide API Worker.
 *
 * Three tiers (checked in order):
 *  1. Cloudflare native Rate Limiting binding (RATE_LIMITER) — global, managed by CF
 *  2. KV-backed sliding window (QUOTE_CACHE) — global, cross-isolate (P4)
 *  3. In-memory token bucket — per-isolate fallback (local dev)
 *
 * Default: 60 requests per minute per IP.
 */

import type { KVNamespace } from "./index.js";

interface Bucket {
  tokens: number;
  lastRefill: number; // ms
}

const DEFAULT_CAPACITY = 60;
const DEFAULT_REFILL_MS = 60_000; // 1 minute

const buckets = new Map<string, Bucket>();

/** Clean stale buckets to prevent unbounded growth in long-lived isolates. */
function evictStale(nowMs: number): void {
  for (const [key, bucket] of buckets) {
    if (nowMs - bucket.lastRefill > DEFAULT_REFILL_MS * 2) {
      buckets.delete(key);
    }
  }
}

/**
 * In-memory rate limit check (per-isolate, fallback for local dev).
 */
export function checkRateLimit(key: string, nowMs = Date.now()): boolean {
  if (buckets.size > 5_000) evictStale(nowMs);

  let bucket = buckets.get(key);
  if (!bucket) {
    bucket = { tokens: DEFAULT_CAPACITY - 1, lastRefill: nowMs };
    buckets.set(key, bucket);
    return true;
  }

  const elapsed = nowMs - bucket.lastRefill;
  if (elapsed >= DEFAULT_REFILL_MS) {
    bucket.tokens = DEFAULT_CAPACITY - 1;
    bucket.lastRefill = nowMs;
    return true;
  }

  if (bucket.tokens > 0) {
    bucket.tokens -= 1;
    return true;
  }

  return false;
}

/**
 * P4: KV-backed global rate limiting (persists across isolates).
 * Uses a fixed-window counter stored in KV with TTL = window size.
 * Slightly less precise than sliding window but avoids read-modify-write races.
 */
export async function checkRateLimitKV(
  kv: KVNamespace,
  key: string,
  capacity = DEFAULT_CAPACITY,
  windowMs = DEFAULT_REFILL_MS,
): Promise<boolean> {
  const windowId = Math.floor(Date.now() / windowMs);
  const kvKey = `rl:${key}:${windowId}`;

  const raw = await kv.get(kvKey, "text");
  const count = raw ? parseInt(raw, 10) : 0;

  if (count >= capacity) {
    return false;
  }

  // Increment counter. KV put is eventually consistent — this means under
  // extreme concurrency we might slightly over-admit, but it's acceptable
  // for a fixed-window approach and vastly better than per-isolate only.
  const ttlSeconds = Math.ceil(windowMs / 1000) + 1;
  await kv.put(kvKey, String(count + 1), { expirationTtl: ttlSeconds });
  return true;
}

/** Extract a stable key from a request (CF-Connecting-IP → X-Forwarded-For → "unknown"). */
export function rateLimitKey(request: Request): string {
  return (
    request.headers.get("CF-Connecting-IP") ??
    request.headers.get("X-Forwarded-For")?.split(",")[0]?.trim() ??
    "unknown"
  );
}

/** HTTP 429 response with a Retry-After header. */
export function tooManyRequests(corsHdrs: HeadersInit): Response {
  return new Response(JSON.stringify({ error: "Too many requests" }), {
    status: 429,
    headers: {
      ...corsHdrs,
      "Content-Type": "application/json",
      "Retry-After": "60",
    },
  });
}
