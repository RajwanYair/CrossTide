/**
 * Cloudflare Worker — CrossTide API proxy.
 *
 * Routes:
 *   GET  /api/health                 → JSON health status
 *   GET  /api/stocks/quote/:symbol   → Yahoo Finance v8 quote proxy
 *   GET  /api/stocks/history/:symbol → Yahoo Finance v8 historical OHLCV
 *   GET  /api/stocks/search?q=       → Yahoo Finance autocomplete
 *   GET  /api/crypto/:id             → CoinGecko proxy (CORS passthrough)
 *   GET  /api/twelve/:symbol         → Twelve Data proxy
 */
import { handleHealth } from "./routes/health";
import {
  handleQuote,
  handleHistory,
  handleSearch,
  handleCrypto,
  handleTwelve,
} from "./routes/proxy";
import { applyCors } from "./middleware/cors";
import { checkRateLimit } from "./middleware/rate-limit";

export interface Env {
  TWELVE_DATA_API_KEY: string;
  POLYGON_API_KEY?: string;
  YAHOO_BASE_URL?: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS preflight
    if (request.method === "OPTIONS") {
      return applyCors(new Response(null, { status: 204 }), request);
    }

    // Rate limit (per IP)
    const ip = request.headers.get("CF-Connecting-IP") ?? "unknown";
    const rateLimitResponse = checkRateLimit(ip);
    if (rateLimitResponse) return applyCors(rateLimitResponse, request);

    let response: Response;

    try {
      if (path === "/api/health") {
        response = await handleHealth(env);
      } else if (path.startsWith("/api/stocks/quote/")) {
        const symbol = decodeURIComponent(path.slice("/api/stocks/quote/".length));
        response = await handleQuote(symbol, env);
      } else if (path.startsWith("/api/stocks/history/")) {
        const symbol = decodeURIComponent(path.slice("/api/stocks/history/".length));
        const days = parseInt(url.searchParams.get("days") ?? "30", 10);
        response = await handleHistory(symbol, days, env);
      } else if (path === "/api/stocks/search") {
        const q = url.searchParams.get("q") ?? "";
        response = await handleSearch(q, env);
      } else if (path.startsWith("/api/crypto/")) {
        const id = decodeURIComponent(path.slice("/api/crypto/".length));
        response = await handleCrypto(id);
      } else if (path.startsWith("/api/twelve/")) {
        const symbol = decodeURIComponent(path.slice("/api/twelve/".length));
        response = await handleTwelve(symbol, url.searchParams, env);
      } else {
        response = new Response(JSON.stringify({ error: "Not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }
    } catch (err) {
      response = new Response(
        JSON.stringify({ error: "Internal server error", detail: String(err) }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }

    return applyCors(response, request);
  },
};
