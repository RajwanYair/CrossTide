/**
 * Unit tests for rate-limit.ts
 * Covers: checkRateLimit (in-memory), checkRateLimitKV (KV-backed), rateLimitKey.
 *
 * P5: Validates that KV-backed rate limiting persists across window boundaries.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { checkRateLimit, checkRateLimitKV, rateLimitKey } from "../../../worker/rate-limit";

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeKv(initial?: Record<string, string>): {
  store: Map<string, string>;
  kv: { get: ReturnType<typeof vi.fn>; put: ReturnType<typeof vi.fn> };
} {
  const store = new Map<string, string>(Object.entries(initial ?? {}));
  const kv = {
    get: vi.fn((key: string) => Promise.resolve(store.get(key) ?? null)),
    put: vi.fn((key: string, value: string) => {
      store.set(key, value);
      return Promise.resolve();
    }),
  };
  return { store, kv };
}

// ── checkRateLimit (in-memory) ────────────────────────────────────────────────

describe("checkRateLimit (in-memory token bucket)", () => {
  it("allows first request for a new key", () => {
    expect(checkRateLimit("ip-1")).toBe(true);
  });

  it("allows up to the capacity limit", () => {
    const key = `ip-capacity-${Date.now()}`;
    let allowed = 0;
    // capacity is 60; consume all tokens
    for (let i = 0; i < 60; i++) {
      if (checkRateLimit(key)) allowed++;
    }
    expect(allowed).toBe(60);
  });

  it("blocks after capacity is exhausted", () => {
    const key = `ip-block-${Date.now()}`;
    for (let i = 0; i < 60; i++) checkRateLimit(key);
    expect(checkRateLimit(key)).toBe(false);
  });

  it("refills after the window expires", () => {
    const key = `ip-refill-${Date.now()}`;
    for (let i = 0; i < 60; i++) checkRateLimit(key);
    expect(checkRateLimit(key)).toBe(false);
    // Simulate 61 seconds later (> 60 000 ms window)
    const future = Date.now() + 61_000;
    expect(checkRateLimit(key, future)).toBe(true);
  });
});

// ── checkRateLimitKV ──────────────────────────────────────────────────────────

describe("checkRateLimitKV (KV-backed fixed window)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("allows first request (no existing counter)", async () => {
    const { kv } = makeKv();
    const allowed = await checkRateLimitKV(kv as never, "ip-new");
    expect(allowed).toBe(true);
    expect(kv.put).toHaveBeenCalledOnce();
    // Counter should be "1"
    const [[, value]] = kv.put.mock.calls as [[string, string, unknown]];
    expect(value).toBe("1");
  });

  it("allows requests under capacity", async () => {
    // Pre-seed counter at 59 (one below default capacity of 60)
    const windowId = Math.floor(Date.now() / 60_000);
    const { kv } = makeKv({ [`rl:ip-under:${windowId}`]: "59" });
    const allowed = await checkRateLimitKV(kv as never, "ip-under");
    expect(allowed).toBe(true);
  });

  it("blocks at capacity", async () => {
    // Pre-seed counter at exactly the default capacity (60)
    const windowId = Math.floor(Date.now() / 60_000);
    const { kv } = makeKv({ [`rl:ip-full:${windowId}`]: "60" });
    const allowed = await checkRateLimitKV(kv as never, "ip-full");
    expect(allowed).toBe(false);
    // No increment should be written when blocked
    expect(kv.put).not.toHaveBeenCalled();
  });

  it("respects custom capacity parameter", async () => {
    const windowId = Math.floor(Date.now() / 60_000);
    const { kv } = makeKv({ [`rl:ip-custom:${windowId}`]: "5" });
    // Custom capacity = 5: counter is already at limit
    expect(await checkRateLimitKV(kv as never, "ip-custom", 5)).toBe(false);
  });

  it("increments counter on each allowed request", async () => {
    const { kv, store } = makeKv();
    await checkRateLimitKV(kv as never, "ip-incr");
    await checkRateLimitKV(kv as never, "ip-incr");
    const windowId = Math.floor(Date.now() / 60_000);
    expect(store.get(`rl:ip-incr:${windowId}`)).toBe("2");
  });
});

// ── rateLimitKey ──────────────────────────────────────────────────────────────

describe("rateLimitKey", () => {
  it("returns CF-Connecting-IP when present", () => {
    const req = new Request("https://example.com", {
      headers: { "CF-Connecting-IP": "1.2.3.4" },
    });
    expect(rateLimitKey(req)).toBe("1.2.3.4");
  });

  it("falls back to first X-Forwarded-For value", () => {
    const req = new Request("https://example.com", {
      headers: { "X-Forwarded-For": "5.6.7.8, 9.10.11.12" },
    });
    expect(rateLimitKey(req)).toBe("5.6.7.8");
  });

  it("returns 'unknown' when no IP header present", () => {
    const req = new Request("https://example.com");
    expect(rateLimitKey(req)).toBe("unknown");
  });

  it("CF-Connecting-IP takes precedence over X-Forwarded-For", () => {
    const req = new Request("https://example.com", {
      headers: {
        "CF-Connecting-IP": "1.2.3.4",
        "X-Forwarded-For": "5.6.7.8",
      },
    });
    expect(rateLimitKey(req)).toBe("1.2.3.4");
  });
});
