/**
 * CrossTide API Worker — Hono-based Cloudflare Workers entry point (G1).
 *
 * Routes:
 *  GET  /api/health                  Worker status + version
 *  GET  /api/chart                   OHLCV candles (ticker, range, interval params)
 *  GET  /api/search                  Ticker fuzzy search (q, limit params)
 *  POST /api/screener                Technical screener with consensus filter
 *  GET  /api/og/:symbol              Social preview SVG image
 *  POST /api/signal-dsl/execute      Execute a signal DSL expression
 *
 * Middleware (applied in order):
 *  1. CORS preflight — OPTIONS short-circuit via app.options()
 *  2. Rate limiting — 60 req/min per IP; OPTIONS requests are exempt
 *  3. Security + CORS headers — injected into every response
 *
 * @see worker/wrangler.toml for deployment configuration.
 * @see src/core/worker-api-client.ts for the typed browser client.
 */

import { Hono } from "hono";
import { withCors, handlePreflight, corsHeaders } from "./cors.js";
import { checkRateLimit, checkRateLimitKV, rateLimitKey } from "./rate-limit.js";
import { withSecurityHeaders } from "./security.js";
import { handleHealth } from "./routes/health.js";
import { handleChart } from "./routes/chart.js";
import { handleQuote } from "./routes/quote.js";
import { handleSearch } from "./routes/search.js";
import { handleScreener } from "./routes/screener.js";
import { handleOgImage } from "./routes/og.js";
import { handleSignalDslExecute } from "./routes/signal-dsl.js";
import { handleOpenApiSpec } from "./routes/openapi.js";
import { handleCspReport } from "./routes/csp-report.js";
import {
  isPreviewEnvironment,
  getFixtureQuote,
  getFixtureChart,
  getFixtureSearch,
} from "./fixtures.js";

export interface KVNamespace {
  get(key: string, type: "text"): Promise<string | null>;
  get(key: string, type: "json"): Promise<unknown>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
  delete(key: string): Promise<void>;
}

export interface D1Database {
  prepare(query: string): D1PreparedStatement;
  batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]>;
  exec(query: string): Promise<D1ExecResult>;
}

export interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = unknown>(colName?: string): Promise<T | null>;
  run<T = unknown>(): Promise<D1Result<T>>;
  all<T = unknown>(): Promise<D1Result<T>>;
}

export interface D1Result<T = unknown> {
  results: T[];
  success: boolean;
  meta: Record<string, unknown>;
}

export interface D1ExecResult {
  count: number;
  duration: number;
}

export interface Env {
  ENVIRONMENT?: string;
  API_VERSION?: string;
  /**
   * G13: Cloudflare native Rate Limiting API binding.
   * When present the worker delegates to CF's global rate limiter; when absent
   * (local dev, unit tests) it falls back to the in-memory token bucket.
   */
  RATE_LIMITER?: {
    limit(options: { key: string }): Promise<{ success: boolean }>;
  };
  /** P2: KV namespace for caching chart/quote data with market-hours-aware TTL. */
  QUOTE_CACHE?: KVNamespace;
  /** P3: D1 database for user data persistence. */
  DB?: D1Database;
}

const app = new Hono<{ Bindings: Env; Variables: { requestId: string } }>({ strict: false });

// ── CORS preflight short-circuit (must come before rate-limit middleware) ─────
app.options("*", (c) => handlePreflight(c.req.raw));

// ── Request ID propagation (K12) ─────────────────────────────────────────────
app.use("*", async (c, next) => {
  const requestId = c.req.header("X-Request-ID") ?? crypto.randomUUID();
  c.set("requestId", requestId);
  await next();
  c.res.headers.set("X-Request-ID", requestId);
});

// ── Rate limiting (exempt: OPTIONS handled above) ─────────────────────────────
app.use("*", async (c, next) => {
  if (c.req.method !== "OPTIONS") {
    const key = rateLimitKey(c.req.raw);
    let allowed: boolean;
    if (c.env.RATE_LIMITER != null) {
      // G13: CF native global rate limiter (best option)
      allowed = (await c.env.RATE_LIMITER.limit({ key })).success;
    } else if (c.env.QUOTE_CACHE != null) {
      // P4: KV-backed global rate limiting (cross-isolate)
      allowed = await checkRateLimitKV(c.env.QUOTE_CACHE, key);
    } else {
      // Fallback: in-memory per-isolate (local dev)
      allowed = checkRateLimit(key);
    }
    if (!allowed) {
      const origin = c.req.header("Origin") ?? null;
      return new Response(JSON.stringify({ error: "Too many requests" }), {
        status: 429,
        headers: {
          ...(corsHeaders(origin) as Record<string, string>),
          "Content-Type": "application/json",
          "Retry-After": "60",
        },
      });
    }
  }
  await next();
});

// ── Response transform: CORS + security headers on every response ─────────────
app.use("*", async (c, next) => {
  await next();
  const origin = c.req.header("Origin") ?? null;
  c.res = withSecurityHeaders(withCors(c.res, origin));
});

// ── Routes ────────────────────────────────────────────────────────────────────

// P12: Preview deployments serve fixture data (no API keys required)
app.get("/api/chart", (c) => {
  if (isPreviewEnvironment(c.env)) {
    const url = new URL(c.req.url);
    const symbol = url.searchParams.get("symbol") ?? "AAPL";
    const range = url.searchParams.get("range") ?? "1y";
    const data = getFixtureChart(symbol, range);
    return c.json({ ...data, source: "fixture", symbol, range });
  }
  return handleChart(new URL(c.req.url), c.env);
});

app.get("/api/quote/:symbol", (c) => {
  if (isPreviewEnvironment(c.env)) {
    const quote = getFixtureQuote(c.req.param("symbol"));
    if (quote) return c.json({ ...quote, source: "fixture" });
  }
  return handleQuote(c.req.param("symbol"), c.env);
});

app.get("/api/search", (c) => {
  if (isPreviewEnvironment(c.env)) {
    const url = new URL(c.req.url);
    const q = url.searchParams.get("q") ?? "";
    return c.json({ results: getFixtureSearch(q), source: "fixture" });
  }
  return Promise.resolve(handleSearch(new URL(c.req.url), c.env));
});

app.get("/api/health", (c) => Promise.resolve(handleHealth(c.env)));

app.post("/api/screener", async (c) => handleScreener(c.req.raw));

app.get("/api/og/:symbol", (c) => Promise.resolve(handleOgImage(new URL(c.req.url))));
app.get("/api/og", (c) => Promise.resolve(handleOgImage(new URL(c.req.url))));

app.post("/api/signal-dsl/execute", async (c) => handleSignalDslExecute(c.req.raw));

// ── CSP violation reports (K11) ───────────────────────────────────────────────
app.post("/api/csp-report", async (c) => handleCspReport(c.req.raw));

// ── OpenAPI spec (G10) ────────────────────────────────────────────────────────
app.get("/openapi.json", () => handleOpenApiSpec());

// ── Favicon (no-op) ───────────────────────────────────────────────────────────
app.get("/favicon.ico", (c) => c.newResponse(null, 204));

// ── 404 fallback ─────────────────────────────────────────────────────────────
app.notFound((c) => {
  const origin = c.req.header("Origin") ?? null;
  return withCors(
    new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    }),
    origin,
  );
});

export default app;
