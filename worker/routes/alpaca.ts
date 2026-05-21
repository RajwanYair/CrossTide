/**
 * GET /api/alpaca/quote/:symbol — Alpaca Markets real-time quote.
 * GET /api/alpaca/bars/:symbol  — Alpaca Markets OHLCV history.
 *
 * Q1: Alpaca as co-primary data provider for US equities.
 * Uses IEX feed (free, real-time) by default.
 */

import { fetchAlpacaQuote, fetchAlpacaHistory, AlpacaApiError } from "../providers/alpaca.js";
import { kvGet, kvPut, quoteTtl } from "../kv-cache.js";
import type { Env } from "../index.js";

const TICKER_RE = /^[A-Z0-9.^-]{1,12}$/;

export async function handleAlpacaQuote(symbol: string, env: Env): Promise<Response> {
  const ticker = (symbol ?? "").toUpperCase();
  if (!ticker || !TICKER_RE.test(ticker)) {
    return json({ error: "Invalid or missing symbol" }, 400);
  }

  if (!env.ALPACA_KEY || !env.ALPACA_SECRET) {
    return json({ error: "Alpaca API credentials not configured" }, 503);
  }

  const cacheKey = `alpaca-quote:${ticker}`;

  if (env.QUOTE_CACHE) {
    const cached = await kvGet<unknown>(env.QUOTE_CACHE, cacheKey);
    if (cached) {
      return json(
        { ...(cached as Record<string, unknown>), source: "cache" },
        200,
        "public, max-age=10",
      );
    }
  }

  try {
    const quote = await fetchAlpacaQuote(ticker, env.ALPACA_KEY, env.ALPACA_SECRET);
    const ttl = quoteTtl("REGULAR");
    if (env.QUOTE_CACHE) await kvPut(env.QUOTE_CACHE, cacheKey, quote, ttl);
    return json(quote, 200, `public, max-age=${Math.min(ttl, 15)}`);
  } catch (err) {
    if (err instanceof AlpacaApiError) {
      if (err.status === 404 || err.status === 422) {
        return json({ error: `Symbol not found: ${ticker}` }, 404);
      }
      return json({ error: "Alpaca upstream error", detail: err.message }, 502);
    }
    return json({ error: "upstream", detail: (err as Error).message }, 502);
  }
}

export async function handleAlpacaBars(symbol: string, url: URL, env: Env): Promise<Response> {
  const ticker = (symbol ?? "").toUpperCase();
  if (!ticker || !TICKER_RE.test(ticker)) {
    return json({ error: "Invalid or missing symbol" }, 400);
  }

  if (!env.ALPACA_KEY || !env.ALPACA_SECRET) {
    return json({ error: "Alpaca API credentials not configured" }, 503);
  }

  const days = Math.min(Math.max(Number(url.searchParams.get("days")) || 365, 1), 5000);
  const cacheKey = `alpaca-bars:${ticker}:${days}`;

  if (env.QUOTE_CACHE) {
    const cached = await kvGet<unknown>(env.QUOTE_CACHE, cacheKey);
    if (cached) {
      return json(
        { ...(cached as Record<string, unknown>), source: "cache" },
        200,
        "public, max-age=300",
      );
    }
  }

  try {
    const result = await fetchAlpacaHistory(ticker, days, env.ALPACA_KEY, env.ALPACA_SECRET);
    if (env.QUOTE_CACHE) await kvPut(env.QUOTE_CACHE, cacheKey, result, 300);
    return json(result, 200, "public, max-age=300");
  } catch (err) {
    if (err instanceof AlpacaApiError) {
      if (err.status === 404 || err.status === 422) {
        return json({ error: `Symbol not found: ${ticker}` }, 404);
      }
      return json({ error: "Alpaca upstream error", detail: err.message }, 502);
    }
    return json({ error: "upstream", detail: (err as Error).message }, 502);
  }
}

function json(body: unknown, status: number, cacheControl?: string): Response {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (cacheControl) headers["Cache-Control"] = cacheControl;
  return new Response(JSON.stringify(body), { status, headers });
}
