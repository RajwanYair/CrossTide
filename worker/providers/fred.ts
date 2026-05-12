/**
 * FRED Worker provider — economic data series from the St. Louis Fed.
 *
 * P9: Server-side FRED integration with API key support.
 * Free tier: 120 requests/minute with API key.
 *
 * Two fetch modes:
 *  1. CSV (no key needed): `fredgraph.csv?id=SERIES` — public, limited to graph data
 *  2. JSON API (key needed): `fred/series/observations?series_id=…&api_key=…` — richer data
 *
 * Falls back to CSV mode when no API key is configured.
 */

const FRED_API_BASE = "https://api.stlouisfed.org/fred";
const FRED_CSV_BASE = "https://fred.stlouisfed.org/graph/fredgraph.csv";

const FRED_HEADERS: HeadersInit = {
  "User-Agent": "CrossTide/1.0 (+https://github.com/crosstide)",
  Accept: "application/json",
};

// ── Error ─────────────────────────────────────────────────────────────────────

export class FredApiError extends Error {
  readonly status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "FredApiError";
    this.status = status;
  }
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface FredObservation {
  readonly date: string;
  readonly value: number | null;
}

export interface FredSeriesResult {
  readonly series: string;
  readonly label: string;
  readonly observations: readonly FredObservation[];
  readonly source: string;
}

// ── Series Mapping ────────────────────────────────────────────────────────────

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
  gdp: "GDP",
  "30y": "DGS30",
  "5y": "DGS5",
  sp500: "SP500",
  nasdaqcom: "NASDAQCOM",
};

/** Human-readable label for each FRED series. */
const SERIES_LABELS: Readonly<Record<string, string>> = {
  VIXCLS: "CBOE Volatility Index (VIX)",
  DGS10: "10-Year Treasury Rate",
  DGS2: "2-Year Treasury Rate",
  DGS30: "30-Year Treasury Rate",
  DGS5: "5-Year Treasury Rate",
  M2SL: "M2 Money Stock",
  FEDFUNDS: "Federal Funds Rate",
  UNRATE: "Unemployment Rate",
  CPIAUCSL: "Consumer Price Index",
  T10Y2Y: "10Y-2Y Yield Spread",
  GDP: "Gross Domestic Product",
  SP500: "S&P 500",
  NASDAQCOM: "NASDAQ Composite",
};

/** Resolve an alias or direct series ID to the canonical FRED ID. Returns null if unknown. */
export function resolveSeriesId(raw: string): string | null {
  const lower = raw.toLowerCase();
  const mapped = SERIES_MAP[lower];
  if (mapped) return mapped;
  // Accept direct canonical IDs (uppercase, alphanumeric + underscores)
  const upper = raw.toUpperCase();
  if (/^[A-Z0-9_]{1,20}$/.test(upper)) return upper;
  return null;
}

/** Get label for a series. Falls back to the series ID itself. */
export function seriesLabel(seriesId: string): string {
  return SERIES_LABELS[seriesId] ?? seriesId;
}

/** Get list of supported aliases. */
export function supportedAliases(): readonly string[] {
  return Object.keys(SERIES_MAP);
}

// ── CSV Parser ────────────────────────────────────────────────────────────────

/** Parse FRED CSV (DATE,VALUE) into observations. Skips header. "." = missing. */
export function parseFredCsv(csv: string): FredObservation[] {
  const lines = csv.trim().split("\n");
  const observations: FredObservation[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]?.trim();
    if (!line) continue;
    const commaIdx = line.indexOf(",");
    if (commaIdx === -1) continue;
    const date = line.slice(0, commaIdx).trim();
    const raw = line.slice(commaIdx + 1).trim();
    const value = raw === "." ? null : Number(raw);
    if (!date || (value !== null && !Number.isFinite(value))) continue;
    observations.push({ date, value });
  }
  return observations;
}

// ── JSON API Parser ───────────────────────────────────────────────────────────

interface FredApiResponse {
  observations?: Array<{
    date?: string;
    value?: string;
  }>;
}

function parseApiResponse(json: FredApiResponse): FredObservation[] {
  const observations: FredObservation[] = [];
  for (const obs of json.observations ?? []) {
    const date = obs.date?.trim();
    if (!date) continue;
    const raw = obs.value?.trim();
    const value = !raw || raw === "." ? null : Number(raw);
    if (value !== null && !Number.isFinite(value)) continue;
    observations.push({ date, value });
  }
  return observations;
}

// ── Fetch Functions ───────────────────────────────────────────────────────────

/**
 * Fetch FRED series data using the JSON API (requires API key).
 * Falls back to CSV endpoint when no key is provided.
 */
export async function fetchFredSeries(
  seriesId: string,
  apiKey?: string,
): Promise<FredSeriesResult> {
  if (apiKey) {
    return fetchFredSeriesApi(seriesId, apiKey);
  }
  return fetchFredSeriesCsv(seriesId);
}

/** Fetch via JSON API with API key. */
async function fetchFredSeriesApi(seriesId: string, apiKey: string): Promise<FredSeriesResult> {
  const url =
    `${FRED_API_BASE}/series/observations` +
    `?series_id=${encodeURIComponent(seriesId)}` +
    `&api_key=${encodeURIComponent(apiKey)}` +
    `&file_type=json` +
    `&sort_order=asc`;

  const res = await fetch(url, { headers: FRED_HEADERS });

  if (!res.ok) {
    throw new FredApiError(`FRED API returned ${res.status}`, res.status);
  }

  const json = (await res.json()) as FredApiResponse;
  const observations = parseApiResponse(json);

  return {
    series: seriesId,
    label: seriesLabel(seriesId),
    observations,
    source: "fred",
  };
}

/** Fetch via public CSV endpoint (no API key needed). */
async function fetchFredSeriesCsv(seriesId: string): Promise<FredSeriesResult> {
  const url = `${FRED_CSV_BASE}?id=${encodeURIComponent(seriesId)}`;

  const res = await fetch(url, { headers: FRED_HEADERS });

  if (!res.ok) {
    throw new FredApiError(`FRED CSV endpoint returned ${res.status}`, res.status);
  }

  const csv = await res.text();
  const observations = parseFredCsv(csv);

  return {
    series: seriesId,
    label: seriesLabel(seriesId),
    observations,
    source: "fred",
  };
}
