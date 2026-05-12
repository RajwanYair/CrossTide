/**
 * GET /api/fred?series=VIX — FRED economic data series overlay.
 *
 * Fetches daily observation data from the St. Louis Fed FRED API.
 * Supports a curated set of macro series. Caches 24 h in KV.
 *
 * P8: Delegates to worker/providers/fred.ts instead of inline fetch.
 */
import type { Env } from "../index.js";
import { kvGet, kvPut } from "../kv-cache.js";
import {
  fetchFredSeries,
  FredApiError,
  resolveSeriesId,
  seriesLabel,
  supportedAliases,
} from "../providers/fred.js";

const FRED_TTL = 86_400; // 24 h — daily series, stale-by-EOD acceptable

export interface FredSeriesResponse {
  readonly series: string;
  readonly label: string;
  readonly observations: readonly { readonly date: string; readonly value: number | null }[];
  readonly source: "fred" | "cache";
}

export async function handleFred(url: URL, env: Env): Promise<Response> {
  const rawSeries = url.searchParams.get("series");
  if (!rawSeries || rawSeries.length > 20) {
    return Response.json(
      {
        error: "Missing or invalid 'series' query parameter",
        supported: supportedAliases(),
      },
      { status: 400 },
    );
  }

  const seriesId = resolveSeriesId(rawSeries);
  if (!seriesId) {
    return Response.json(
      {
        error: `Unknown series '${rawSeries}'`,
        supported: supportedAliases(),
      },
      { status: 400 },
    );
  }

  const cacheKey = `fred:${seriesId}`;

  if (env.QUOTE_CACHE) {
    const cached = await kvGet<FredSeriesResponse>(env.QUOTE_CACHE, cacheKey);
    if (cached) {
      return Response.json({ ...cached, source: "cache" });
    }
  }

  try {
    const result = await fetchFredSeries(seriesId, env.FRED_KEY);

    const payload: FredSeriesResponse = {
      series: result.series,
      label: seriesLabel(seriesId),
      observations: result.observations,
      source: "fred",
    };

    if (env.QUOTE_CACHE) {
      await kvPut(env.QUOTE_CACHE, cacheKey, payload, FRED_TTL);
    }

    return Response.json(payload);
  } catch (err) {
    if (err instanceof FredApiError) {
      return Response.json(
        { error: `FRED upstream error: ${err.status.toString()}` },
        { status: 502 },
      );
    }
    return Response.json({ error: "Failed to reach FRED API" }, { status: 502 });
  }
}
