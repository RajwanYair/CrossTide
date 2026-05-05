/**
 * /api/sector-heatmap — Sector performance heatmap endpoint.
 *
 * Returns aggregated performance metrics for major market sectors
 * using representative ETFs. Caches in KV with 15-minute TTL.
 */
import type { Env } from "../index.js";
import { kvGet, kvPut } from "../kv-cache.js";

const HEATMAP_TTL = 900; // 15 min

const SECTOR_ETFS: ReadonlyArray<{ readonly symbol: string; readonly sector: string }> = [
  { symbol: "XLK", sector: "Technology" },
  { symbol: "XLF", sector: "Financials" },
  { symbol: "XLV", sector: "Healthcare" },
  { symbol: "XLE", sector: "Energy" },
  { symbol: "XLY", sector: "Consumer Discretionary" },
  { symbol: "XLP", sector: "Consumer Staples" },
  { symbol: "XLI", sector: "Industrials" },
  { symbol: "XLB", sector: "Materials" },
  { symbol: "XLRE", sector: "Real Estate" },
  { symbol: "XLU", sector: "Utilities" },
  { symbol: "XLC", sector: "Communication Services" },
];

interface SectorData {
  readonly sector: string;
  readonly symbol: string;
  readonly price: number;
  readonly change: number;
  readonly changePercent: number;
  readonly volume: number;
}

interface HeatmapResponse {
  readonly sectors: readonly SectorData[];
  readonly timestamp: number;
  readonly source: string;
}

export async function handleSectorHeatmap(env: Env): Promise<Response> {
  const cacheKey = "sector:heatmap";

  if (env.QUOTE_CACHE) {
    const cached = await kvGet<HeatmapResponse>(env.QUOTE_CACHE, cacheKey);
    if (cached) {
      return Response.json({ ...cached, source: "cache" });
    }
  }

  try {
    const symbols = SECTOR_ETFS.map((s) => s.symbol).join(",");
    const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(symbols)}`;
    const res = await fetch(url, {
      headers: { "User-Agent": "CrossTide/1.0" },
    });

    if (!res.ok) {
      return Response.json({ error: "Upstream provider error" }, { status: 502 });
    }

    const json = (await res.json()) as {
      quoteResponse?: {
        result?: Array<{
          symbol?: string;
          regularMarketPrice?: number;
          regularMarketChange?: number;
          regularMarketChangePercent?: number;
          regularMarketVolume?: number;
        }>;
      };
    };

    const results = json.quoteResponse?.result ?? [];
    const sectorMap = new Map(SECTOR_ETFS.map((s) => [s.symbol, s.sector]));

    const sectors: SectorData[] = results
      .filter(
        (r): r is typeof r & { symbol: string; regularMarketPrice: number } =>
          typeof r.symbol === "string" && typeof r.regularMarketPrice === "number",
      )
      .map((r) => ({
        sector: sectorMap.get(r.symbol) ?? r.symbol,
        symbol: r.symbol,
        price: r.regularMarketPrice,
        change: r.regularMarketChange ?? 0,
        changePercent: r.regularMarketChangePercent ?? 0,
        volume: r.regularMarketVolume ?? 0,
      }))
      .sort((a, b) => b.changePercent - a.changePercent);

    const data: HeatmapResponse = {
      sectors,
      timestamp: Date.now(),
      source: "yahoo",
    };

    if (env.QUOTE_CACHE) {
      await kvPut(env.QUOTE_CACHE, cacheKey, data, HEATMAP_TTL);
    }

    return Response.json(data);
  } catch {
    return Response.json({ error: "Failed to fetch sector data" }, { status: 502 });
  }
}
