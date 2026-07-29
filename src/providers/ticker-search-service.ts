/**
 * Ticker search service — resolves symbol suggestions for the watchlist search box.
 *
 * Resolution order:
 *   1. Cloudflare Worker `/api/search` (works from any origin: CORS + CSP allowed)
 *   2. The provider chain (Yahoo/Finnhub/…) — only reachable in dev via the Vite proxy
 *   3. Caller-side offline catalog (see `domain/ticker-catalog`)
 *
 * Never rejects: an empty array is returned when every source fails, so the
 * autocomplete can fall back to the offline catalog.
 */
import type { SearchResult } from "./types";
import { getChain } from "./provider-registry";
import { getApiClient } from "../core/worker-api-client";

const DEFAULT_LIMIT = 8;

/**
 * Search symbols across every available source.
 *
 * @param query - Free-text ticker or company-name fragment.
 * @param limit - Maximum number of hits to return.
 */
export async function searchTickers(
  query: string,
  limit = DEFAULT_LIMIT,
): Promise<readonly SearchResult[]> {
  const q = query.trim();
  if (!q) return [];

  const viaWorker = await getApiClient().search({ q, limit });
  if (viaWorker.ok && viaWorker.value.results.length > 0) {
    return viaWorker.value.results.map(
      (hit): SearchResult => ({
        symbol: hit.ticker,
        name: hit.name,
        exchange: hit.exchange,
        type: hit.type,
      }),
    );
  }

  try {
    return await getChain().search(q);
  } catch {
    return [];
  }
}
