/**
 * CoinGecko Worker provider — crypto quote, OHLC history, and coin search.
 *
 * P8: Server-side CoinGecko integration (free tier, no API key needed).
 * Rate limit: ~30 req/min (free), 500 req/min (Demo plan).
 *
 * Endpoints used:
 *  - GET /api/v3/coins/:id                       → detailed coin data (quote)
 *  - GET /api/v3/coins/:id/ohlc?vs_currency=usd  → OHLC candles
 *  - GET /api/v3/search?query=…                   → coin search
 */

const COINGECKO_BASE = "https://api.coingecko.com/api/v3";

const COINGECKO_HEADERS: HeadersInit = {
  "User-Agent": "CrossTide/1.0",
  Accept: "application/json",
};

// ── Error ─────────────────────────────────────────────────────────────────────

export class CoinGeckoApiError extends Error {
  readonly status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "CoinGeckoApiError";
    this.status = status;
  }
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface CoinGeckoQuoteResult {
  readonly id: string;
  readonly symbol: string;
  readonly name: string;
  readonly price: number;
  readonly marketCap: number;
  readonly volume24h: number;
  readonly change24h: number;
  readonly changePercent24h: number;
  readonly high24h: number;
  readonly low24h: number;
  readonly ath: number;
  readonly athChangePercent: number;
  readonly circulatingSupply: number;
  readonly totalSupply: number | null;
  readonly lastUpdated: string;
  readonly source: string;
}

export interface CoinGeckoCandle {
  readonly date: string;
  readonly open: number;
  readonly high: number;
  readonly low: number;
  readonly close: number;
  readonly volume: number;
}

export interface CoinGeckoChartResult {
  readonly id: string;
  readonly candles: readonly CoinGeckoCandle[];
  readonly source: string;
}

export interface CoinGeckoSearchHit {
  readonly id: string;
  readonly symbol: string;
  readonly name: string;
  readonly marketCapRank: number | null;
}

// ── Internal response shapes ──────────────────────────────────────────────────

interface CoinGeckoDetailRaw {
  id?: string;
  symbol?: string;
  name?: string;
  market_data?: {
    current_price?: { usd?: number };
    market_cap?: { usd?: number };
    total_volume?: { usd?: number };
    price_change_24h?: number;
    price_change_percentage_24h?: number;
    high_24h?: { usd?: number };
    low_24h?: { usd?: number };
    ath?: { usd?: number };
    ath_change_percentage?: { usd?: number };
    circulating_supply?: number;
    total_supply?: number | null;
  };
  last_updated?: string;
}

interface CoinGeckoSearchRaw {
  coins?: Array<{
    id?: string;
    symbol?: string;
    name?: string;
    market_cap_rank?: number | null;
  }>;
}

// ── Quote ─────────────────────────────────────────────────────────────────────

export async function fetchCoinGeckoQuote(coinId: string): Promise<CoinGeckoQuoteResult> {
  const url =
    `${COINGECKO_BASE}/coins/${encodeURIComponent(coinId)}` +
    `?localization=false&tickers=false&community_data=false&developer_data=false&sparkline=false`;

  const res = await fetch(url, { headers: COINGECKO_HEADERS });

  if (!res.ok) {
    if (res.status === 404) {
      throw new CoinGeckoApiError("Coin not found on CoinGecko", 404);
    }
    throw new CoinGeckoApiError(`CoinGecko API returned ${res.status}`, res.status);
  }

  const json = (await res.json()) as CoinGeckoDetailRaw;
  const md = json.market_data;

  return {
    id: json.id ?? coinId,
    symbol: json.symbol ?? coinId,
    name: json.name ?? coinId,
    price: md?.current_price?.usd ?? 0,
    marketCap: md?.market_cap?.usd ?? 0,
    volume24h: md?.total_volume?.usd ?? 0,
    change24h: md?.price_change_24h ?? 0,
    changePercent24h: md?.price_change_percentage_24h ?? 0,
    high24h: md?.high_24h?.usd ?? 0,
    low24h: md?.low_24h?.usd ?? 0,
    ath: md?.ath?.usd ?? 0,
    athChangePercent: md?.ath_change_percentage?.usd ?? 0,
    circulatingSupply: md?.circulating_supply ?? 0,
    totalSupply: md?.total_supply ?? null,
    lastUpdated: json.last_updated ?? new Date().toISOString(),
    source: "coingecko",
  };
}

// ── OHLC Candles ──────────────────────────────────────────────────────────────

/**
 * Map a range string to CoinGecko `days` parameter.
 * CoinGecko OHLC: 1, 7, 14, 30, 90, 180, 365, max
 */
function rangeToDays(range: string): number {
  const map: Record<string, number> = {
    "1d": 1,
    "5d": 7,
    "1mo": 30,
    "3mo": 90,
    "6mo": 180,
    "1y": 365,
    "2y": 365,
    "5y": 365,
    max: 365,
  };
  return map[range] ?? 365;
}

export async function fetchCoinGeckoOhlc(
  coinId: string,
  range: string,
): Promise<CoinGeckoChartResult> {
  const days = rangeToDays(range);
  const url = `${COINGECKO_BASE}/coins/${encodeURIComponent(coinId)}/ohlc?vs_currency=usd&days=${days}`;

  const res = await fetch(url, { headers: COINGECKO_HEADERS });

  if (!res.ok) {
    if (res.status === 404) {
      throw new CoinGeckoApiError("Coin not found on CoinGecko", 404);
    }
    throw new CoinGeckoApiError(`CoinGecko OHLC API returned ${res.status}`, res.status);
  }

  const json = (await res.json()) as number[][];

  if (!Array.isArray(json) || json.length === 0) {
    throw new CoinGeckoApiError("No OHLC data available from CoinGecko", 404);
  }

  // CoinGecko OHLC: [timestamp_ms, open, high, low, close]
  // Deduplicate to daily (last entry per day wins)
  const dayMap = new Map<string, CoinGeckoCandle>();
  for (const entry of json) {
    if (!Array.isArray(entry) || entry.length < 5) continue;
    const [ts, open, high, low, close] = entry as [number, number, number, number, number];
    const date = new Date(ts).toISOString().slice(0, 10);
    dayMap.set(date, { date, open, high, low, close, volume: 0 });
  }

  const candles = Array.from(dayMap.values()).sort((a, b) => a.date.localeCompare(b.date));

  return {
    id: coinId,
    candles,
    source: "coingecko",
  };
}

// ── Search ────────────────────────────────────────────────────────────────────

export async function fetchCoinGeckoSearch(
  query: string,
  limit: number = 10,
): Promise<CoinGeckoSearchHit[]> {
  const url = `${COINGECKO_BASE}/search?query=${encodeURIComponent(query)}`;

  const res = await fetch(url, { headers: COINGECKO_HEADERS });

  if (!res.ok) {
    throw new CoinGeckoApiError(`CoinGecko search API returned ${res.status}`, res.status);
  }

  const json = (await res.json()) as CoinGeckoSearchRaw;
  const coins = json.coins ?? [];

  return coins.slice(0, limit).map((c) => ({
    id: c.id ?? "",
    symbol: (c.symbol ?? "").toUpperCase(),
    name: c.name ?? "",
    marketCapRank: c.market_cap_rank ?? null,
  }));
}
