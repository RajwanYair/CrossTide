/**
 * /api/fundamentals/batch — Batch fundamentals endpoint.
 *
 * Fetches fundamentals for multiple symbols in a single request.
 * Checks KV cache per-symbol, fetches missing ones from Yahoo,
 * and returns partial results if some symbols fail.
 */
import type { Env } from "../index.js";
import { kvGet, kvPut } from "../kv-cache.js";
import { fetchYahooFundamentals, type YahooFundamentals } from "../providers/yahoo.js";

const FUNDAMENTALS_TTL = 3600; // 1 hour
const MAX_BATCH = 20;
const SYMBOL_RE = /^[A-Z0-9.^=-]{1,20}$/;

interface BatchResult {
  readonly results: Record<string, YahooFundamentals & { readonly source: string }>;
  readonly errors: readonly string[];
}

export async function handleFundamentalsBatch(req: Request, env: Env): Promise<Response> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body || typeof body !== "object" || !("symbols" in body)) {
    return Response.json({ error: "Missing symbols array" }, { status: 400 });
  }

  const { symbols } = body as { symbols: unknown };

  if (!Array.isArray(symbols) || symbols.length === 0) {
    return Response.json({ error: "symbols must be a non-empty array" }, { status: 400 });
  }

  const validSymbols = symbols
    .filter((s): s is string => typeof s === "string")
    .map((s) => s.toUpperCase())
    .filter((s) => SYMBOL_RE.test(s))
    .slice(0, MAX_BATCH);

  if (validSymbols.length === 0) {
    return Response.json({ error: "No valid symbols provided" }, { status: 400 });
  }

  const results: Record<string, YahooFundamentals & { source: string }> = {};
  const errors: string[] = [];
  const toFetch: string[] = [];

  // Check KV cache for each symbol
  if (env.QUOTE_CACHE) {
    const cacheChecks = await Promise.allSettled(
      validSymbols.map(async (sym) => {
        const cached = await kvGet<YahooFundamentals>(env.QUOTE_CACHE!, `fundamentals:${sym}`);
        return { sym, cached };
      }),
    );

    for (const result of cacheChecks) {
      if (result.status === "fulfilled" && result.value.cached) {
        results[result.value.sym] = { ...result.value.cached, source: "cache" };
      } else if (result.status === "fulfilled") {
        toFetch.push(result.value.sym);
      }
    }
  } else {
    toFetch.push(...validSymbols);
  }

  // Fetch missing symbols from Yahoo
  const fetchResults = await Promise.allSettled(
    toFetch.map(async (sym) => {
      const data = await fetchYahooFundamentals(sym);
      return { sym, data };
    }),
  );

  for (const result of fetchResults) {
    if (result.status === "fulfilled") {
      results[result.value.sym] = { ...result.value.data, source: "yahoo" };
      // Cache individually
      if (env.QUOTE_CACHE) {
        void kvPut(
          env.QUOTE_CACHE,
          `fundamentals:${result.value.sym}`,
          result.value.data,
          FUNDAMENTALS_TTL,
        );
      }
    } else {
      // Find which symbol failed
      const sym = toFetch[fetchResults.indexOf(result)];
      if (sym) errors.push(sym);
    }
  }

  const response: BatchResult = { results, errors };
  return Response.json(response);
}
