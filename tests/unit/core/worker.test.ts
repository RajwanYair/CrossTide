/**
 * Tests for the Cloudflare Worker API routes.
 *
 * Uses the default export's fetch handler directly so tests don't need
 * a Miniflare / Cloudflare runtime. All routes are pure HTTP logic.
 */
import { describe, it, expect } from "vitest";
import worker from "../../../worker/index";
import { checkRateLimit } from "../../../worker/rate-limit";
import { getAllowedOrigin } from "../../../worker/cors";
import { withSecurityHeaders, _getSecurityHeaders } from "../../../worker/security";

// Minimal Env object for tests
const ENV = { ENVIRONMENT: "test", API_VERSION: "1" };

function makeRequest(
  method: string,
  path: string,
  opts: { body?: string; origin?: string } = {},
): Request {
  const url = `https://api.crosstide.dev${path}`;
  return new Request(url, {
    method,
    headers: {
      ...(opts.origin ? { Origin: opts.origin } : {}),
      ...(opts.body ? { "Content-Type": "application/json" } : {}),
      "CF-Connecting-IP": "1.2.3.4",
    },
    body: opts.body,
  });
}

// ── /api/health ─────────────────────────────────────────────────────────────

describe("GET /api/health", () => {
  it("returns status ok", async () => {
    const res = await worker.fetch(makeRequest("GET", "/api/health"), ENV);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { status: string; version: string };
    expect(body.status).toBe("ok");
    expect(body.version).toBe("1");
  });

  it("returns 404 for POST (Hono: method mismatch → 404)", async () => {
    const res = await worker.fetch(makeRequest("POST", "/api/health", { body: "{}" }), ENV);
    expect(res.status).toBe(404);
  });
});

// ── /api/chart ───────────────────────────────────────────────────────────────

describe("GET /api/chart", () => {
  it("returns candles for AAPL", async () => {
    const res = await worker.fetch(makeRequest("GET", "/api/chart?ticker=AAPL&range=1mo"), ENV);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ticker: string; candles: unknown[] };
    expect(body.ticker).toBe("AAPL");
    expect(body.candles.length).toBeGreaterThan(0);
  });

  it("returns 400 for missing ticker", async () => {
    const res = await worker.fetch(makeRequest("GET", "/api/chart"), ENV);
    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid ticker", async () => {
    const res = await worker.fetch(
      makeRequest("GET", "/api/chart?ticker=" + encodeURIComponent("<script>")),
      ENV,
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid range", async () => {
    const res = await worker.fetch(makeRequest("GET", "/api/chart?ticker=MSFT&range=99y"), ENV);
    expect(res.status).toBe(400);
  });

  it("returns deterministic candles (same seed = same result)", async () => {
    const r1 = await worker.fetch(makeRequest("GET", "/api/chart?ticker=TSLA&range=1mo"), ENV);
    const r2 = await worker.fetch(makeRequest("GET", "/api/chart?ticker=TSLA&range=1mo"), ENV);
    const b1 = (await r1.json()) as { candles: Array<{ close: number }> };
    const b2 = (await r2.json()) as { candles: Array<{ close: number }> };
    expect(b1.candles[0]?.close).toBe(b2.candles[0]?.close);
  });

  it("OHLCV shape is correct", async () => {
    const res = await worker.fetch(makeRequest("GET", "/api/chart?ticker=GOOGL&range=5d"), ENV);
    const body = (await res.json()) as { candles: Array<Record<string, unknown>> };
    const candle = body.candles[0];
    expect(candle).toHaveProperty("date");
    expect(candle).toHaveProperty("open");
    expect(candle).toHaveProperty("high");
    expect(candle).toHaveProperty("low");
    expect(candle).toHaveProperty("close");
    expect(candle).toHaveProperty("volume");
    // OHLCV integrity: high >= max(open, close) and low <= min(open, close)
    const o = candle["open"] as number;
    const h = candle["high"] as number;
    const l = candle["low"] as number;
    const c = candle["close"] as number;
    expect(h).toBeGreaterThanOrEqual(Math.max(o, c));
    expect(l).toBeLessThanOrEqual(Math.min(o, c));
  });
});

// ── /api/search ──────────────────────────────────────────────────────────────

describe("GET /api/search", () => {
  it("finds AAPL", async () => {
    const res = await worker.fetch(makeRequest("GET", "/api/search?q=aapl"), ENV);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { results: Array<{ ticker: string }> };
    expect(body.results[0]?.ticker).toBe("AAPL");
  });

  it("finds SPY by partial name", async () => {
    const res = await worker.fetch(makeRequest("GET", "/api/search?q=spy"), ENV);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { results: Array<{ ticker: string }> };
    expect(body.results.some((r) => r.ticker === "SPY")).toBe(true);
  });

  it("respects limit param", async () => {
    const res = await worker.fetch(makeRequest("GET", "/api/search?q=a&limit=3"), ENV);
    const body = (await res.json()) as { results: unknown[] };
    expect(body.results.length).toBeLessThanOrEqual(3);
  });

  it("returns 400 for empty query", async () => {
    const res = await worker.fetch(makeRequest("GET", "/api/search?q="), ENV);
    expect(res.status).toBe(400);
  });

  it("returns 400 for query > 50 chars", async () => {
    const q = "x".repeat(51);
    const res = await worker.fetch(makeRequest("GET", `/api/search?q=${q}`), ENV);
    expect(res.status).toBe(400);
  });
});

// ── /api/screener ─────────────────────────────────────────────────────────────

describe("POST /api/screener", () => {
  it("filters tickers and returns rows", async () => {
    const body = JSON.stringify({ tickers: ["AAPL", "MSFT", "TSLA"] });
    const res = await worker.fetch(makeRequest("POST", "/api/screener", { body }), ENV);
    expect(res.status).toBe(200);
    const data = (await res.json()) as { rows: Array<{ ticker: string; rsi: number }> };
    expect(data.rows.length).toBeGreaterThan(0);
    expect(data.rows[0]).toHaveProperty("ticker");
    expect(data.rows[0]).toHaveProperty("rsi");
    expect(data.rows[0]).toHaveProperty("adx");
    expect(data.rows[0]).toHaveProperty("consensus");
  });

  it("filters by minRsi", async () => {
    const body = JSON.stringify({ tickers: ["AAPL", "MSFT", "NVDA", "TSLA", "AMZN"], minRsi: 70 });
    const res = await worker.fetch(makeRequest("POST", "/api/screener", { body }), ENV);
    const data = (await res.json()) as { rows: Array<{ rsi: number }> };
    for (const row of data.rows) {
      expect(row.rsi).toBeGreaterThanOrEqual(70);
    }
  });

  it("returns 400 for missing tickers", async () => {
    const res = await worker.fetch(
      makeRequest("POST", "/api/screener", { body: JSON.stringify({ minRsi: 50 }) }),
      ENV,
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 for empty tickers array", async () => {
    const res = await worker.fetch(
      makeRequest("POST", "/api/screener", { body: JSON.stringify({ tickers: [] }) }),
      ENV,
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 for > 50 tickers", async () => {
    const tickers = Array.from({ length: 51 }, (_, i) => `T${i}`);
    const res = await worker.fetch(
      makeRequest("POST", "/api/screener", { body: JSON.stringify({ tickers }) }),
      ENV,
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid JSON", async () => {
    const res = await worker.fetch(makeRequest("POST", "/api/screener", { body: "not json" }), ENV);
    expect(res.status).toBe(400);
  });
});

// ── /api/og/:symbol ──────────────────────────────────────────────────────────

describe("GET /api/og/:symbol", () => {
  it("returns SVG for AAPL", async () => {
    const res = await worker.fetch(makeRequest("GET", "/api/og/AAPL"), ENV);
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain("image/svg+xml");
    const svg = await res.text();
    expect(svg).toContain("AAPL");
    expect(svg).toContain("<svg");
  });

  it("returns SVG for crypto ticker BTC-USD", async () => {
    const res = await worker.fetch(makeRequest("GET", "/api/og/BTC-USD"), ENV);
    expect(res.status).toBe(200);
    const svg = await res.text();
    expect(svg).toContain("BTC-USD");
  });

  it("returns 400 for invalid symbol", async () => {
    const res = await worker.fetch(
      makeRequest("GET", "/api/og/" + encodeURIComponent("<bad>")),
      ENV,
    );
    expect(res.status).toBe(400);
  });

  it("includes direction badge when provided", async () => {
    const res = await worker.fetch(
      makeRequest("GET", "/api/og/NVDA?direction=BUY&price=500&change=2.5"),
      ENV,
    );
    const svg = await res.text();
    expect(svg).toContain("BUY");
  });
});

// ── CORS headers ─────────────────────────────────────────────────────────────

describe("CORS", () => {
  it("allows crosstide.pages.dev origin", () => {
    expect(getAllowedOrigin("https://crosstide.pages.dev")).toBe("https://crosstide.pages.dev");
  });

  it("allows localhost:5173 for development", () => {
    expect(getAllowedOrigin("http://localhost:5173")).toBe("http://localhost:5173");
  });

  it("falls back to production origin for unknown callers", () => {
    expect(getAllowedOrigin("https://evil.example.com")).toBe("https://crosstide.pages.dev");
  });

  it("returns CORS headers in response", async () => {
    // NOTE: happy-dom strips 'Origin' as a forbidden header in Request construction,
    // so the worker receives origin=null and returns the production fallback origin.
    // The important thing is that the ACAO header IS present.
    const res = await worker.fetch(
      makeRequest("GET", "/api/health", { origin: "http://localhost:5173" }),
      ENV,
    );
    const acao = res.headers.get("Access-Control-Allow-Origin");
    expect(acao).toBeTruthy();
    // Direct CORS util test (not filtered by Fetch forbidden-header rules):
    expect(getAllowedOrigin("http://localhost:5173")).toBe("http://localhost:5173");
    expect(getAllowedOrigin(null)).toBe("https://crosstide.pages.dev");
  });

  it("handles preflight OPTIONS correctly", async () => {
    const req = new Request("https://api.crosstide.dev/api/chart", {
      method: "OPTIONS",
      headers: { Origin: "http://localhost:5173" },
    });
    const res = await worker.fetch(req, ENV);
    expect(res.status).toBe(204);
    expect(res.headers.get("Access-Control-Allow-Methods")).toContain("GET");
  });
});

// ── Rate limiting ─────────────────────────────────────────────────────────────

describe("rate limiting", () => {
  it("allows up to 60 requests", () => {
    const key = `test-rl-${Math.random()}`;
    let allowed = 0;
    for (let i = 0; i < 60; i++) {
      if (checkRateLimit(key)) allowed++;
    }
    expect(allowed).toBe(60);
  });

  it("blocks the 61st request", () => {
    const key = `test-rl-block-${Math.random()}`;
    for (let i = 0; i < 60; i++) checkRateLimit(key);
    expect(checkRateLimit(key)).toBe(false);
  });

  it("refills after the window elapses", () => {
    const key = `test-rl-refill-${Math.random()}`;
    const start = Date.now();
    for (let i = 0; i < 60; i++) checkRateLimit(key, start);
    expect(checkRateLimit(key, start)).toBe(false);
    // Advance clock by >60s
    expect(checkRateLimit(key, start + 61_000)).toBe(true);
  });
});

// ── 404 + error paths ─────────────────────────────────────────────────────────

describe("routing", () => {
  it("returns 404 for unknown routes", async () => {
    const res = await worker.fetch(makeRequest("GET", "/api/unknown"), ENV);
    expect(res.status).toBe(404);
  });

  it("returns 404 for root path", async () => {
    const res = await worker.fetch(makeRequest("GET", "/"), ENV);
    expect(res.status).toBe(404);
  });

  it("ignores trailing slash", async () => {
    const res = await worker.fetch(makeRequest("GET", "/api/health/"), ENV);
    expect(res.status).toBe(200);
  });
});

// ── Security headers (A20) ───────────────────────────────────────────────────

describe("withSecurityHeaders", () => {
  it("adds Content-Security-Policy header", () => {
    const base = new Response(JSON.stringify({ ok: true }), {
      headers: { "Content-Type": "application/json" },
    });
    const secured = withSecurityHeaders(base);
    const csp = secured.headers.get("Content-Security-Policy");
    expect(csp).not.toBeNull();
    expect(csp).toContain("default-src");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("upgrade-insecure-requests");
  });

  it("adds X-Content-Type-Options: nosniff", () => {
    const secured = withSecurityHeaders(new Response("ok"));
    expect(secured.headers.get("X-Content-Type-Options")).toBe("nosniff");
  });

  it("adds X-Frame-Options: DENY", () => {
    const secured = withSecurityHeaders(new Response("ok"));
    expect(secured.headers.get("X-Frame-Options")).toBe("DENY");
  });

  it("adds Strict-Transport-Security", () => {
    const secured = withSecurityHeaders(new Response("ok"));
    const hsts = secured.headers.get("Strict-Transport-Security");
    expect(hsts).toContain("max-age=31536000");
    expect(hsts).toContain("includeSubDomains");
  });

  it("adds Permissions-Policy", () => {
    const secured = withSecurityHeaders(new Response("ok"));
    const pp = secured.headers.get("Permissions-Policy");
    expect(pp).toContain("camera=()");
    expect(pp).toContain("geolocation=()");
    expect(pp).toContain("microphone=()");
  });

  it("preserves existing headers", () => {
    const base = new Response("body", { headers: { "X-Custom": "value" } });
    const secured = withSecurityHeaders(base);
    expect(secured.headers.get("X-Custom")).toBe("value");
  });

  it("preserves status code", () => {
    const base = new Response("Not Found", { status: 404 });
    const secured = withSecurityHeaders(base);
    expect(secured.status).toBe(404);
  });
});

describe("_getSecurityHeaders", () => {
  it("returns an object with all required security headers", () => {
    const headers = _getSecurityHeaders();
    expect(headers).toHaveProperty("Content-Security-Policy");
    expect(headers).toHaveProperty("Permissions-Policy");
    expect(headers).toHaveProperty("Referrer-Policy");
    expect(headers).toHaveProperty("X-Content-Type-Options");
    expect(headers).toHaveProperty("X-Frame-Options");
    expect(headers).toHaveProperty("Strict-Transport-Security");
  });
});

describe("Security headers on API responses", () => {
  it("GET /api/health includes CSP", async () => {
    const res = await worker.fetch(makeRequest("GET", "/api/health"), ENV);
    expect(res.headers.get("Content-Security-Policy")).not.toBeNull();
  });

  it("404 response includes security headers", async () => {
    const res = await worker.fetch(makeRequest("GET", "/unknown-route"), ENV);
    expect(res.status).toBe(404);
    expect(res.headers.get("X-Content-Type-Options")).toBe("nosniff");
  });
});

// ── GET /openapi.json (G10) ────────────────────────────────────────────────

describe("GET /openapi.json", () => {
  it("returns 200 with application/json content-type", async () => {
    const res = await worker.fetch(makeRequest("GET", "/openapi.json"), ENV);
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain("application/json");
  });

  it("response body is valid OpenAPI 3.1 JSON", async () => {
    const res = await worker.fetch(makeRequest("GET", "/openapi.json"), ENV);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.openapi).toBe("3.1.0");
    expect(body.info).toBeDefined();
    expect((body.info as Record<string, unknown>).title).toBe("CrossTide Worker API");
  });

  it("spec includes all registered routes", async () => {
    const res = await worker.fetch(makeRequest("GET", "/openapi.json"), ENV);
    const body = (await res.json()) as { paths: Record<string, unknown> };
    expect(body.paths).toHaveProperty("/api/health");
    expect(body.paths).toHaveProperty("/api/chart");
    expect(body.paths).toHaveProperty("/api/search");
    expect(body.paths).toHaveProperty("/api/screener");
    expect(body.paths).toHaveProperty("/api/og/{symbol}");
    expect(body.paths).toHaveProperty("/api/signal-dsl/execute");
    expect(body.paths).toHaveProperty("/openapi.json");
  });

  it("spec has components with all referenced schemas", async () => {
    const res = await worker.fetch(makeRequest("GET", "/openapi.json"), ENV);
    const body = (await res.json()) as {
      components: { schemas: Record<string, unknown>; responses: Record<string, unknown> };
    };
    expect(body.components.schemas).toHaveProperty("HealthResponse");
    expect(body.components.schemas).toHaveProperty("CandleRecord");
    expect(body.components.schemas).toHaveProperty("ScreenerRequest");
    expect(body.components.schemas).toHaveProperty("ErrorResponse");
    expect(body.components.responses).toHaveProperty("BadRequest");
    expect(body.components.responses).toHaveProperty("RateLimited");
  });

  it("sets Cache-Control header", async () => {
    const res = await worker.fetch(makeRequest("GET", "/openapi.json"), ENV);
    expect(res.headers.get("Cache-Control")).toContain("max-age=3600");
  });
});

// ── G13: Cloudflare native Rate Limiting API ──────────────────────────────

describe("G13: CF native RATE_LIMITER binding", () => {
  it("uses RATE_LIMITER.limit when binding is present and allows request", async () => {
    const limitFn = vi.fn().mockResolvedValue({ success: true });
    const ENV_WITH_RL = { ...ENV, RATE_LIMITER: { limit: limitFn } };
    const res = await worker.fetch(makeRequest("GET", "/api/health"), ENV_WITH_RL);
    expect(res.status).toBe(200);
    expect(limitFn).toHaveBeenCalledOnce();
    expect(limitFn).toHaveBeenCalledWith({ key: "1.2.3.4" });
  });

  it("returns 429 when RATE_LIMITER.limit returns success: false", async () => {
    const limitFn = vi.fn().mockResolvedValue({ success: false });
    const ENV_WITH_RL = { ...ENV, RATE_LIMITER: { limit: limitFn } };
    const res = await worker.fetch(makeRequest("GET", "/api/health"), ENV_WITH_RL);
    expect(res.status).toBe(429);
    const body = (await res.json()) as { error: string };
    expect(body.error).toContain("Too many requests");
    expect(res.headers.get("Retry-After")).toBe("60");
  });

  it("skips RATE_LIMITER for OPTIONS preflight", async () => {
    const limitFn = vi.fn().mockResolvedValue({ success: true });
    const ENV_WITH_RL = { ...ENV, RATE_LIMITER: { limit: limitFn } };
    const res = await worker.fetch(
      makeRequest("OPTIONS", "/api/health", { origin: "https://example.com" }),
      ENV_WITH_RL,
    );
    // OPTIONS is handled before rate-limit middleware — limit must not be called
    expect(limitFn).not.toHaveBeenCalled();
    expect(res.status).toBe(204);
  });

  it("falls back to in-memory bucket when RATE_LIMITER is absent", async () => {
    const res = await worker.fetch(makeRequest("GET", "/api/health"), ENV);
    expect(res.status).toBe(200);
  });
});
