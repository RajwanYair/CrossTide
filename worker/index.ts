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
import { checkRateLimit, rateLimitKey } from "./rate-limit.js";
import { withSecurityHeaders } from "./security.js";
import { handleHealth } from "./routes/health.js";
import { handleChart } from "./routes/chart.js";
import { handleSearch } from "./routes/search.js";
import { handleScreener } from "./routes/screener.js";
import { handleOgImage } from "./routes/og.js";
import { handleSignalDslExecute } from "./routes/signal-dsl.js";
import { handleOpenApiSpec } from "./routes/openapi.js";
import { handleCspReport } from "./routes/csp-report.js";

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
  // Optional KV + R2 bindings (declared in wrangler.toml)
  // QUOTE_CACHE?: KVNamespace;
  // OHLCV_STORE?: R2Bucket;
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
    const allowed =
      c.env.RATE_LIMITER != null
        ? (await c.env.RATE_LIMITER.limit({ key })).success // G13: CF native
        : checkRateLimit(key); // fallback: in-memory
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

app.get("/api/health", (c) => Promise.resolve(handleHealth(c.env)));

app.get("/api/chart", (c) => Promise.resolve(handleChart(new URL(c.req.url))));

app.get("/api/search", (c) => Promise.resolve(handleSearch(new URL(c.req.url))));

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
