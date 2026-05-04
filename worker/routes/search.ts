/**
 * GET /api/search?q=apple&limit=10
 *
 * Fuzzy-searches tickers. In production (QUOTE_CACHE binding present), queries
 * Yahoo Finance search API with fallback to built-in catalogue. Falls back to
 * catalogue-only when no KV binding (local dev).
 *
 * P1: Wire real Yahoo Finance search.
 */

import { fetchYahooSearch } from "../providers/yahoo.js";
import type { Env } from "../index.js";

export interface SearchHit {
  ticker: string;
  name: string;
  exchange: string;
  type: "EQUITY" | "ETF" | "CRYPTO" | "INDEX" | "MUTUALFUND" | "FUTURES";
}

export interface SearchResponse {
  results: SearchHit[];
  total: number;
}

/** Built-in ticker catalogue — a curated sample of commonly watched instruments. */
const CATALOGUE: readonly SearchHit[] = [
  { ticker: "AAPL", name: "Apple Inc.", exchange: "NASDAQ", type: "EQUITY" },
  { ticker: "MSFT", name: "Microsoft Corporation", exchange: "NASDAQ", type: "EQUITY" },
  { ticker: "GOOGL", name: "Alphabet Inc.", exchange: "NASDAQ", type: "EQUITY" },
  { ticker: "AMZN", name: "Amazon.com, Inc.", exchange: "NASDAQ", type: "EQUITY" },
  { ticker: "NVDA", name: "NVIDIA Corporation", exchange: "NASDAQ", type: "EQUITY" },
  { ticker: "META", name: "Meta Platforms, Inc.", exchange: "NASDAQ", type: "EQUITY" },
  { ticker: "TSLA", name: "Tesla, Inc.", exchange: "NASDAQ", type: "EQUITY" },
  { ticker: "BRK.B", name: "Berkshire Hathaway Inc.", exchange: "NYSE", type: "EQUITY" },
  { ticker: "JPM", name: "JPMorgan Chase & Co.", exchange: "NYSE", type: "EQUITY" },
  { ticker: "V", name: "Visa Inc.", exchange: "NYSE", type: "EQUITY" },
  { ticker: "JNJ", name: "Johnson & Johnson", exchange: "NYSE", type: "EQUITY" },
  { ticker: "WMT", name: "Walmart Inc.", exchange: "NYSE", type: "EQUITY" },
  { ticker: "XOM", name: "Exxon Mobil Corporation", exchange: "NYSE", type: "EQUITY" },
  { ticker: "MA", name: "Mastercard Incorporated", exchange: "NYSE", type: "EQUITY" },
  { ticker: "UNH", name: "UnitedHealth Group Incorporated", exchange: "NYSE", type: "EQUITY" },
  { ticker: "HD", name: "The Home Depot, Inc.", exchange: "NYSE", type: "EQUITY" },
  { ticker: "PG", name: "The Procter & Gamble Company", exchange: "NYSE", type: "EQUITY" },
  { ticker: "AVGO", name: "Broadcom Inc.", exchange: "NASDAQ", type: "EQUITY" },
  { ticker: "CVX", name: "Chevron Corporation", exchange: "NYSE", type: "EQUITY" },
  { ticker: "LLY", name: "Eli Lilly and Company", exchange: "NYSE", type: "EQUITY" },
  { ticker: "MRK", name: "Merck & Co., Inc.", exchange: "NYSE", type: "EQUITY" },
  { ticker: "ABBV", name: "AbbVie Inc.", exchange: "NYSE", type: "EQUITY" },
  { ticker: "COST", name: "Costco Wholesale Corporation", exchange: "NASDAQ", type: "EQUITY" },
  { ticker: "PEP", name: "PepsiCo, Inc.", exchange: "NASDAQ", type: "EQUITY" },
  { ticker: "KO", name: "The Coca-Cola Company", exchange: "NYSE", type: "EQUITY" },
  { ticker: "ADBE", name: "Adobe Inc.", exchange: "NASDAQ", type: "EQUITY" },
  { ticker: "AMD", name: "Advanced Micro Devices, Inc.", exchange: "NASDAQ", type: "EQUITY" },
  { ticker: "NFLX", name: "Netflix, Inc.", exchange: "NASDAQ", type: "EQUITY" },
  { ticker: "CRM", name: "Salesforce, Inc.", exchange: "NYSE", type: "EQUITY" },
  { ticker: "INTC", name: "Intel Corporation", exchange: "NASDAQ", type: "EQUITY" },
  { ticker: "IBM", name: "International Business Machines", exchange: "NYSE", type: "EQUITY" },
  { ticker: "ORCL", name: "Oracle Corporation", exchange: "NYSE", type: "EQUITY" },
  { ticker: "QCOM", name: "Qualcomm Incorporated", exchange: "NASDAQ", type: "EQUITY" },
  { ticker: "TXN", name: "Texas Instruments Incorporated", exchange: "NASDAQ", type: "EQUITY" },
  { ticker: "GS", name: "The Goldman Sachs Group, Inc.", exchange: "NYSE", type: "EQUITY" },
  { ticker: "MS", name: "Morgan Stanley", exchange: "NYSE", type: "EQUITY" },
  { ticker: "BAC", name: "Bank of America Corporation", exchange: "NYSE", type: "EQUITY" },
  { ticker: "WFC", name: "Wells Fargo & Company", exchange: "NYSE", type: "EQUITY" },
  { ticker: "C", name: "Citigroup Inc.", exchange: "NYSE", type: "EQUITY" },
  { ticker: "DIS", name: "The Walt Disney Company", exchange: "NYSE", type: "EQUITY" },
  // ETFs
  { ticker: "SPY", name: "SPDR S&P 500 ETF Trust", exchange: "NYSE Arca", type: "ETF" },
  { ticker: "QQQ", name: "Invesco QQQ Trust", exchange: "NASDAQ", type: "ETF" },
  { ticker: "VTI", name: "Vanguard Total Stock Market ETF", exchange: "NYSE Arca", type: "ETF" },
  { ticker: "IWM", name: "iShares Russell 2000 ETF", exchange: "NYSE Arca", type: "ETF" },
  { ticker: "GLD", name: "SPDR Gold Shares", exchange: "NYSE Arca", type: "ETF" },
  { ticker: "TLT", name: "iShares 20+ Year Treasury Bond ETF", exchange: "NASDAQ", type: "ETF" },
  { ticker: "XLK", name: "Technology Select Sector SPDR Fund", exchange: "NYSE Arca", type: "ETF" },
  { ticker: "XLF", name: "Financial Select Sector SPDR Fund", exchange: "NYSE Arca", type: "ETF" },
  { ticker: "XLE", name: "Energy Select Sector SPDR Fund", exchange: "NYSE Arca", type: "ETF" },
  { ticker: "ARKK", name: "ARK Innovation ETF", exchange: "NYSE Arca", type: "ETF" },
  // Crypto
  { ticker: "BTC-USD", name: "Bitcoin", exchange: "Crypto", type: "CRYPTO" },
  { ticker: "ETH-USD", name: "Ethereum", exchange: "Crypto", type: "CRYPTO" },
  { ticker: "SOL-USD", name: "Solana", exchange: "Crypto", type: "CRYPTO" },
  { ticker: "BNB-USD", name: "BNB", exchange: "Crypto", type: "CRYPTO" },
  { ticker: "XRP-USD", name: "Ripple", exchange: "Crypto", type: "CRYPTO" },
  // Indices
  { ticker: "^GSPC", name: "S&P 500", exchange: "INDEX", type: "INDEX" },
  { ticker: "^DJI", name: "Dow Jones Industrial Average", exchange: "INDEX", type: "INDEX" },
  { ticker: "^IXIC", name: "NASDAQ Composite", exchange: "INDEX", type: "INDEX" },
  { ticker: "^VIX", name: "CBOE Volatility Index", exchange: "INDEX", type: "INDEX" },
];

/** Score a hit against a query — higher = better match. */
function score(hit: SearchHit, q: string): number {
  const ql = q.toLowerCase();
  const tl = hit.ticker.toLowerCase();
  const nl = hit.name.toLowerCase();

  if (tl === ql) return 100;
  if (tl.startsWith(ql)) return 80;
  if (nl.startsWith(ql)) return 70;
  if (tl.includes(ql)) return 60;
  if (nl.includes(ql)) return 50;

  // Initials match: "aapl" ~ "apple inc."
  const initials = nl
    .split(/\s+/)
    .map((w) => w[0] ?? "")
    .join("");
  if (initials.startsWith(ql)) return 40;

  return 0;
}

export function handleSearch(url: URL, env: Env): Response | Promise<Response> {
  const q = (url.searchParams.get("q") ?? "").trim();
  if (!q || q.length > 50) {
    return new Response(JSON.stringify({ error: "q must be 1–50 characters" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const limitRaw = parseInt(url.searchParams.get("limit") ?? "10", 10);
  const limit = isNaN(limitRaw) || limitRaw < 1 ? 10 : Math.min(limitRaw, 50);

  // Use Yahoo search in production, catalogue as fallback
  if (env.QUOTE_CACHE) {
    return fetchYahooSearch(q, limit)
      .then((results) => {
        const body: SearchResponse = { results, total: results.length };
        return new Response(JSON.stringify(body), {
          status: 200,
          headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=3600" },
        });
      })
      .catch(() => catalogueSearch(q, limit));
  }

  return catalogueSearch(q, limit);
}

function catalogueSearch(q: string, limit: number): Response {
  const scored = CATALOGUE.map((hit) => ({ hit, score: score(hit, q) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);

  const results = scored.slice(0, limit).map((x) => x.hit);
  const body: SearchResponse = { results, total: scored.length };

  return new Response(JSON.stringify(body), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
