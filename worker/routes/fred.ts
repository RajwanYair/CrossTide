/**
 * GET /api/fred?series=VIX — FRED economic data series overlay.
 *
 * Fetches daily observation data from the St. Louis Fed FRED API.
 * Supports a curated set of macro series. Caches 24 h in KV.
 *
 * Supported series IDs (case-insensitive alias → FRED id):
 *   VIX       → VIXCLS    CBOE Volatility Index
 *   10Y       → DGS10     10-Year Treasury Constant Maturity Rate
 *   2Y        → DGS2      2-Year Treasury Constant Maturity Rate
 *   M2        → M2SL      M2 Money Stock
 *   FEDFUNDS  → FEDFUNDS  Federal Funds Effective Rate
 *   UNRATE    → UNRATE    Unemployment Rate
 *   CPIAUCSL  → CPIAUCSL  Consumer Price Index
 *   T10Y2Y    → T10Y2Y    10-Year minus 2-Year yield spread
 */
import type { Env } from "../index.js";
import { kvGet, kvPut } from "../kv-cache.js";

const FRED_TTL = 86_400; // 24 h — daily series, stale-by-EOD acceptable
const FRED_BASE = "https://fred.stlouisfed.org/graph/fredgraph.csv";

/** Alias → canonical FRED series ID. */
const SERIES_MAP: Readonly<Record<string, string>> = {
  vix: "VIXCLS",
  "10y": "DGS10",
  "2y": "DGS2",
  m2: "M2SL",
  fedfunds: "FEDFUNDS",
  unrate: "UNRATE",
  cpiaucsl: "CPIAUCSL",
  t10y2y: "T10Y2Y",
};

/** Human-readable label for each FRED series. */
const SERIES_LABELS: Readonly<Record<string, string>> = {
  VIXCLS: "CBOE Volatility Index (VIX)",
  DGS10: "10-Year Treasury Rate",
  DGS2: "2-Year Treasury Rate",
  M2SL: "M2 Money Stock",
  FEDFUNDS: "Federal Funds Rate",
  UNRATE: "Unemployment Rate",
  CPIAUCSL: "Consumer Price Index",
  T10Y2Y: "10Y-2Y Yield Spread",
};

export interface FredObservation {
  readonly date: string;
  readonly value: number | null;
}

export interface FredSeriesResponse {
  readonly series: string;
  readonly label: string;
  readonly observations: readonly FredObservation[];
  readonly source: "fred" | "cache";
}

/** Parse FRED CSV (date,value) into observation objects. */
function parseFredCsv(csv: string): FredObservation[] {
  const lines = csv.trim().split("\n");
  const observations: FredObservation[] = [];
  // Skip header row "DATE,VALUE"
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]!.trim();
    if (!line) continue;
    const commaIdx = line.indexOf(",");
    if (commaIdx === -1) continue;
    const date = line.slice(0, commaIdx).trim();
    const raw = line.slice(commaIdx + 1).trim();
    // FRED uses "." for missing data
    const value = raw === "." ? null : Number(raw);
    if (!date || (value !== null && !Number.isFinite(value))) continue;
    observations.push({ date, value });
  }
  return observations;
}

/** Resolve an alias or direct series ID to the canonical FRED id. Returns null if unknown. */
function resolveSeriesId(raw: string): string | null {
  const lower = raw.toLowerCase();
  const mapped = SERIES_MAP[lower];
  if (mapped) return mapped;
  // Accept direct canonical IDs (uppercase, alphanumeric + underscores)
  const upper = raw.toUpperCase();
  if (Object.values(SERIES_MAP).includes(upper)) return upper;
  return null;
}

export async function handleFred(url: URL, env: Env): Promise<Response> {
  const rawSeries = url.searchParams.get("series");
  if (!rawSeries || rawSeries.length > 20) {
    return Response.json(
      {
        error: "Missing or invalid 'series' query parameter",
        supported: Object.keys(SERIES_MAP),
      },
      { status: 400 },
    );
  }

  const seriesId = resolveSeriesId(rawSeries);
  if (!seriesId) {
    return Response.json(
      {
        error: `Unknown series '${rawSeries}'`,
        supported: Object.keys(SERIES_MAP),
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

  const fredUrl = `${FRED_BASE}?id=${encodeURIComponent(seriesId)}`;
  let res: globalThis.Response;
  try {
    res = await fetch(fredUrl, {
      headers: { "User-Agent": "CrossTide/1.0 (+https://github.com/crosstide)" },
    });
  } catch {
    return Response.json({ error: "Failed to reach FRED API" }, { status: 502 });
  }

  if (!res.ok) {
    return Response.json(
      { error: `FRED upstream error: ${res.status.toString()}` },
      { status: 502 },
    );
  }

  const csv = await res.text();
  const observations = parseFredCsv(csv);

  const payload: FredSeriesResponse = {
    series: seriesId,
    label: SERIES_LABELS[seriesId] ?? seriesId,
    observations,
    source: "fred",
  };

  if (env.QUOTE_CACHE) {
    await kvPut(env.QUOTE_CACHE, cacheKey, payload, { ttl: FRED_TTL });
  }

  return Response.json(payload);
}
