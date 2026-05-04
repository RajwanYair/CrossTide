/**
 * Yahoo Finance provider — fetches real market data via Yahoo's v8 chart API.
 *
 * Endpoints used:
 *  - Chart: query1.finance.yahoo.com/v8/finance/chart/{symbol}
 *  - Search: query2.finance.yahoo.com/v1/finance/search?q={query}
 *
 * P1: Initial real-data wiring for /api/chart and /api/quote routes.
 */

export interface YahooCandle {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface YahooChartResult {
  ticker: string;
  currency: string;
  candles: YahooCandle[];
}

export interface YahooQuoteResult {
  ticker: string;
  shortName: string;
  currency: string;
  price: number;
  change: number;
  changePercent: number;
  previousClose: number;
  open: number;
  dayHigh: number;
  dayLow: number;
  volume: number;
  marketCap: number;
  fiftyTwoWeekHigh: number;
  fiftyTwoWeekLow: number;
  exchange: string;
  marketState: "PRE" | "REGULAR" | "POST" | "CLOSED";
}

export interface YahooSearchHit {
  ticker: string;
  name: string;
  exchange: string;
  type: "EQUITY" | "ETF" | "CRYPTO" | "INDEX" | "MUTUALFUND" | "FUTURES";
}

const CHART_BASE = "https://query1.finance.yahoo.com/v8/finance/chart";
const SEARCH_BASE = "https://query2.finance.yahoo.com/v1/finance/search";

const YAHOO_HEADERS = {
  "User-Agent": "CrossTide/1.0",
  Accept: "application/json",
};

/**
 * Fetch OHLCV chart data from Yahoo Finance.
 * @throws {YahooApiError} on non-200 responses or parsing failures.
 */
export async function fetchYahooChart(
  symbol: string,
  range: string,
  interval: string,
): Promise<YahooChartResult> {
  const url = `${CHART_BASE}/${encodeURIComponent(symbol)}?range=${range}&interval=${interval}&includePrePost=false`;

  const res = await fetch(url, { headers: YAHOO_HEADERS });
  if (!res.ok) {
    throw new YahooApiError(`Yahoo chart API returned ${res.status}`, res.status);
  }

  const json = (await res.json()) as YahooChartResponse;
  const result = json?.chart?.result?.[0];
  if (!result) {
    throw new YahooApiError("No chart data in Yahoo response", 404);
  }

  const meta = result.meta;
  const timestamps = result.timestamp ?? [];
  const quote = result.indicators?.quote?.[0];
  if (!quote) {
    throw new YahooApiError("No quote indicators in Yahoo response", 502);
  }

  const candles: YahooCandle[] = [];
  for (let i = 0; i < timestamps.length; i++) {
    const ts = timestamps[i];
    const o = quote.open?.[i];
    const h = quote.high?.[i];
    const l = quote.low?.[i];
    const c = quote.close?.[i];
    const v = quote.volume?.[i];
    // Skip nulls (market holidays, missing data)
    if (ts == null || o == null || h == null || l == null || c == null) continue;
    candles.push({
      date: new Date(ts * 1000).toISOString().slice(0, 10),
      open: round2(o),
      high: round2(h),
      low: round2(l),
      close: round2(c),
      volume: v ?? 0,
    });
  }

  return {
    ticker: meta.symbol ?? symbol.toUpperCase(),
    currency: meta.currency ?? "USD",
    candles,
  };
}

/**
 * Fetch real-time quote from Yahoo Finance (derived from 1d chart).
 */
export async function fetchYahooQuote(symbol: string): Promise<YahooQuoteResult> {
  const url = `${CHART_BASE}/${encodeURIComponent(symbol)}?range=1d&interval=1m&includePrePost=false`;

  const res = await fetch(url, { headers: YAHOO_HEADERS });
  if (!res.ok) {
    throw new YahooApiError(`Yahoo quote API returned ${res.status}`, res.status);
  }

  const json = (await res.json()) as YahooChartResponse;
  const result = json?.chart?.result?.[0];
  if (!result) {
    throw new YahooApiError("No quote data in Yahoo response", 404);
  }

  const meta = result.meta;
  return {
    ticker: meta.symbol ?? symbol.toUpperCase(),
    shortName: meta.shortName ?? meta.symbol ?? symbol,
    currency: meta.currency ?? "USD",
    price: meta.regularMarketPrice ?? 0,
    change: (meta.regularMarketPrice ?? 0) - (meta.chartPreviousClose ?? meta.previousClose ?? 0),
    changePercent:
      meta.chartPreviousClose || meta.previousClose
        ? (((meta.regularMarketPrice ?? 0) - (meta.chartPreviousClose ?? meta.previousClose ?? 0)) /
            (meta.chartPreviousClose ?? meta.previousClose ?? 1)) *
          100
        : 0,
    previousClose: meta.chartPreviousClose ?? meta.previousClose ?? 0,
    open: meta.regularMarketOpen ?? 0,
    dayHigh: meta.regularMarketDayHigh ?? 0,
    dayLow: meta.regularMarketDayLow ?? 0,
    volume: meta.regularMarketVolume ?? 0,
    marketCap: meta.marketCap ?? 0,
    fiftyTwoWeekHigh: meta.fiftyTwoWeekHigh ?? 0,
    fiftyTwoWeekLow: meta.fiftyTwoWeekLow ?? 0,
    exchange: meta.exchangeName ?? "",
    marketState: (meta.marketState as YahooQuoteResult["marketState"]) ?? "CLOSED",
  };
}

/**
 * Search tickers via Yahoo Finance search API.
 */
export async function fetchYahooSearch(query: string, limit: number): Promise<YahooSearchHit[]> {
  const url = `${SEARCH_BASE}?q=${encodeURIComponent(query)}&quotesCount=${limit}&newsCount=0&listsCount=0`;

  const res = await fetch(url, { headers: YAHOO_HEADERS });
  if (!res.ok) {
    throw new YahooApiError(`Yahoo search API returned ${res.status}`, res.status);
  }

  const json = (await res.json()) as YahooSearchResponse;
  const quotes = json?.quotes ?? [];

  return quotes.slice(0, limit).map((q) => ({
    ticker: q.symbol,
    name: q.shortname ?? q.longname ?? q.symbol,
    exchange: q.exchange ?? q.exchDisp ?? "",
    type: mapYahooType(q.quoteType),
  }));
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function mapYahooType(
  quoteType: string | undefined,
): "EQUITY" | "ETF" | "CRYPTO" | "INDEX" | "MUTUALFUND" | "FUTURES" {
  switch (quoteType?.toUpperCase()) {
    case "EQUITY":
      return "EQUITY";
    case "ETF":
      return "ETF";
    case "CRYPTOCURRENCY":
      return "CRYPTO";
    case "INDEX":
      return "INDEX";
    case "MUTUALFUND":
      return "MUTUALFUND";
    case "FUTURE":
      return "FUTURES";
    default:
      return "EQUITY";
  }
}

export class YahooApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "YahooApiError";
  }
}

// ── Yahoo response types (internal) ─────────────────────────────────────────

interface YahooChartResponse {
  chart?: {
    result?: Array<{
      meta: {
        symbol?: string;
        currency?: string;
        shortName?: string;
        regularMarketPrice?: number;
        chartPreviousClose?: number;
        previousClose?: number;
        regularMarketOpen?: number;
        regularMarketDayHigh?: number;
        regularMarketDayLow?: number;
        regularMarketVolume?: number;
        marketCap?: number;
        fiftyTwoWeekHigh?: number;
        fiftyTwoWeekLow?: number;
        exchangeName?: string;
        marketState?: string;
      };
      timestamp?: number[];
      indicators?: {
        quote?: Array<{
          open?: (number | null)[];
          high?: (number | null)[];
          low?: (number | null)[];
          close?: (number | null)[];
          volume?: (number | null)[];
        }>;
      };
    }>;
    error?: { code: string; description: string };
  };
}

interface YahooSearchResponse {
  quotes?: Array<{
    symbol: string;
    shortname?: string;
    longname?: string;
    exchange?: string;
    exchDisp?: string;
    quoteType?: string;
  }>;
}

// ── Fundamentals (quoteSummary) ─────────────────────────────────────────────

const QUOTE_SUMMARY_BASE = "https://query2.finance.yahoo.com/v10/finance/quoteSummary";

export interface YahooFundamentals {
  symbol: string;
  shortName: string;
  sector: string;
  industry: string;
  marketCap: number;
  enterpriseValue: number;
  trailingPE: number;
  forwardPE: number;
  pegRatio: number;
  priceToBook: number;
  eps: number;
  revenue: number;
  revenueGrowth: number;
  grossMargin: number;
  operatingMargin: number;
  profitMargin: number;
  returnOnEquity: number;
  debtToEquity: number;
  dividendYield: number;
  beta: number;
}

/**
 * Fetch fundamental data via Yahoo quoteSummary API.
 * Modules: defaultKeyStatistics, financialData, summaryProfile, earnings
 */
export async function fetchYahooFundamentals(symbol: string): Promise<YahooFundamentals> {
  const modules = "defaultKeyStatistics,financialData,summaryProfile";
  const url = `${QUOTE_SUMMARY_BASE}/${encodeURIComponent(symbol)}?modules=${modules}`;

  const res = await fetch(url, { headers: YAHOO_HEADERS });
  if (!res.ok) {
    throw new YahooApiError(`Yahoo quoteSummary API returned ${res.status}`, res.status);
  }

  const json = (await res.json()) as YahooQuoteSummaryResponse;
  const result = json?.quoteSummary?.result?.[0];
  if (!result) {
    throw new YahooApiError("No fundamental data in Yahoo response", 404);
  }

  const stats = result.defaultKeyStatistics ?? {};
  const fin = result.financialData ?? {};
  const profile = result.summaryProfile ?? {};

  return {
    symbol: symbol.toUpperCase(),
    shortName: profile.shortName ?? symbol,
    sector: profile.sector ?? "",
    industry: profile.industry ?? "",
    marketCap: rawValue(fin.marketCap),
    enterpriseValue: rawValue(stats.enterpriseValue),
    trailingPE: rawValue(stats.trailingPE),
    forwardPE: rawValue(stats.forwardPE),
    pegRatio: rawValue(stats.pegRatio),
    priceToBook: rawValue(stats.priceToBook),
    eps: rawValue(fin.earningsPerShare ?? stats.trailingEps),
    revenue: rawValue(fin.totalRevenue),
    revenueGrowth: rawValue(fin.revenueGrowth),
    grossMargin: rawValue(fin.grossMargins),
    operatingMargin: rawValue(fin.operatingMargins),
    profitMargin: rawValue(fin.profitMargins),
    returnOnEquity: rawValue(fin.returnOnEquity),
    debtToEquity: rawValue(fin.debtToEquity),
    dividendYield: rawValue(stats.dividendYield),
    beta: rawValue(stats.beta),
  };
}

function rawValue(field: { raw?: number } | undefined): number {
  return field?.raw ?? 0;
}

interface YahooQuoteSummaryResponse {
  quoteSummary?: {
    result?: Array<{
      defaultKeyStatistics?: Record<string, { raw?: number }>;
      financialData?: Record<string, { raw?: number }>;
      summaryProfile?: { shortName?: string; sector?: string; industry?: string };
      calendarEvents?: {
        earnings?: {
          earningsDate?: Array<{ raw?: number; fmt?: string }>;
          earningsAverage?: { raw?: number };
          earningsHigh?: { raw?: number };
          earningsLow?: { raw?: number };
          revenueAverage?: { raw?: number };
        };
      };
      earnings?: {
        earningsChart?: {
          quarterly?: Array<{
            date?: string;
            actual?: { raw?: number };
            estimate?: { raw?: number };
          }>;
        };
      };
    }>;
  };
}

// ── Earnings Calendar ─────────────────────────────────────────────────────────

export interface EarningsQuarter {
  date: string;
  actual: number;
  estimate: number;
  surprisePct: number;
}

export interface YahooEarningsCalendar {
  symbol: string;
  earningsDate: string | null;
  epsEstimate: number;
  epsHigh: number;
  epsLow: number;
  revenueEstimate: number;
  history: EarningsQuarter[];
}

/**
 * Fetch earnings calendar data via Yahoo quoteSummary API.
 * Modules: calendarEvents, earnings
 */
export async function fetchYahooEarningsCalendar(symbol: string): Promise<YahooEarningsCalendar> {
  const modules = "calendarEvents,earnings";
  const url = `${QUOTE_SUMMARY_BASE}/${encodeURIComponent(symbol)}?modules=${modules}`;

  const res = await fetch(url, { headers: YAHOO_HEADERS });
  if (!res.ok) {
    throw new YahooApiError(`Yahoo earnings API returned ${res.status}`, res.status);
  }

  const json = (await res.json()) as YahooQuoteSummaryResponse;
  const result = json?.quoteSummary?.result?.[0];
  if (!result) {
    throw new YahooApiError("No earnings data in Yahoo response", 404);
  }

  const cal = result.calendarEvents?.earnings;
  const earningsChart = result.earnings?.earningsChart?.quarterly ?? [];

  const earningsDate = cal?.earningsDate?.[0]?.fmt ?? null;
  const history: EarningsQuarter[] = earningsChart.map((q) => {
    const actual = q.actual?.raw ?? 0;
    const estimate = q.estimate?.raw ?? 0;
    const surprisePct = estimate !== 0 ? ((actual - estimate) / Math.abs(estimate)) * 100 : 0;
    return {
      date: q.date ?? "",
      actual,
      estimate,
      surprisePct: Math.round(surprisePct * 100) / 100,
    };
  });

  return {
    symbol: symbol.toUpperCase(),
    earningsDate,
    epsEstimate: cal?.earningsAverage?.raw ?? 0,
    epsHigh: cal?.earningsHigh?.raw ?? 0,
    epsLow: cal?.earningsLow?.raw ?? 0,
    revenueEstimate: cal?.revenueAverage?.raw ?? 0,
    history,
  };
}
