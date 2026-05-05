/**
 * /api/etf/:symbol/holdings — ETF holdings endpoint.
 *
 * Returns top holdings, sector weights, and fund summary for ETFs
 * from Yahoo Finance quoteSummary. Caches in KV with 24-hour TTL.
 */
import type { Env } from "../index.js";
import { kvGet, kvPut } from "../kv-cache.js";

const ETF_TTL = 86400; // 24 hours

interface EtfHolding {
  readonly symbol: string;
  readonly name: string;
  readonly weight: number; // 0–1
}

interface SectorWeight {
  readonly sector: string;
  readonly weight: number; // 0–1
}

interface EtfHoldingsResponse {
  readonly symbol: string;
  readonly holdings: readonly EtfHolding[];
  readonly sectorWeights: readonly SectorWeight[];
  readonly totalAssets: number;
  readonly holdingsCount: number;
  readonly source: string;
}

export async function handleEtfHoldings(symbol: string, env: Env): Promise<Response> {
  const sym = symbol.toUpperCase();

  if (!/^[A-Z0-9.^=-]{1,20}$/.test(sym)) {
    return Response.json({ error: "Invalid symbol" }, { status: 400 });
  }

  const cacheKey = `etf-holdings:${sym}`;

  if (env.QUOTE_CACHE) {
    const cached = await kvGet<EtfHoldingsResponse>(env.QUOTE_CACHE, cacheKey);
    if (cached) {
      return Response.json({ ...cached, source: "cache" });
    }
  }

  try {
    const url = `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(sym)}?modules=topHoldings,defaultKeyStatistics`;

    const res = await fetch(url, {
      headers: { "User-Agent": "CrossTide/1.0" },
    });

    if (!res.ok) {
      return Response.json({ error: "Upstream provider error" }, { status: 502 });
    }

    const json = (await res.json()) as {
      quoteSummary?: {
        result?: Array<{
          topHoldings?: {
            holdings?: Array<{
              symbol?: string;
              holdingName?: string;
              holdingPercent?: { raw?: number };
            }>;
            sectorWeightings?: Array<Record<string, { raw?: number }>>;
          };
          defaultKeyStatistics?: {
            totalAssets?: { raw?: number };
          };
        }>;
      };
    };

    const summary = json.quoteSummary?.result?.[0];
    const rawHoldings = summary?.topHoldings?.holdings ?? [];
    const rawSectors = summary?.topHoldings?.sectorWeightings ?? [];
    const totalAssets = summary?.defaultKeyStatistics?.totalAssets?.raw ?? 0;

    const holdings: EtfHolding[] = rawHoldings
      .filter(
        (h): h is typeof h & { symbol: string } =>
          typeof h.symbol === "string" && h.symbol.length > 0,
      )
      .map((h) => ({
        symbol: h.symbol,
        name: h.holdingName ?? h.symbol,
        weight: h.holdingPercent?.raw ?? 0,
      }))
      .sort((a, b) => b.weight - a.weight);

    const sectorWeights: SectorWeight[] = rawSectors
      .flatMap((entry) =>
        Object.entries(entry)
          .filter(([, v]) => typeof v?.raw === "number")
          .map(([sector, v]) => ({
            sector: formatSectorName(sector),
            weight: (v as { raw: number }).raw,
          })),
      )
      .sort((a, b) => b.weight - a.weight);

    const data: EtfHoldingsResponse = {
      symbol: sym,
      holdings,
      sectorWeights,
      totalAssets,
      holdingsCount: holdings.length,
      source: "yahoo",
    };

    if (env.QUOTE_CACHE) {
      await kvPut(env.QUOTE_CACHE, cacheKey, data, ETF_TTL);
    }

    return Response.json(data);
  } catch {
    return Response.json({ error: "Failed to fetch ETF holdings" }, { status: 502 });
  }
}

function formatSectorName(key: string): string {
  // Yahoo returns camelCase keys like "technology", "healthcare"
  return key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, " $1");
}
