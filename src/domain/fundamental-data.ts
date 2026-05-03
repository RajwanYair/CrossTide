/**
 * Fundamental Data — fetches P/E, EPS, Revenue, Market Cap from Yahoo quoteSummary.
 *
 * Uses the same YAHOO_BASE pattern as data-service.ts: dev proxy in dev mode,
 * direct Yahoo Finance API in production.
 */
import type { FundamentalData } from "../types/domain";
import { fetchWithTimeout } from "../core/fetch";
import { safeParse, YahooQuoteSummarySchema } from "../types/valibot-schemas";

const YAHOO_BASE: string = import.meta.env.DEV ? "/api/yahoo" : "https://query1.finance.yahoo.com";

/** In-memory cache to avoid redundant quoteSummary calls within a session. */
const cache = new Map<string, { data: FundamentalData; ts: number }>();

/** Cache TTL: 5 minutes (fundamentals don't change rapidly). */
const CACHE_TTL_MS = 5 * 60 * 1000;

/**
 * Fetch fundamental data for a single ticker from Yahoo Finance quoteSummary.
 * Returns null if the request fails or the ticker has no fundamental data.
 */
export async function fetchFundamentals(
  ticker: string,
  signal?: AbortSignal,
): Promise<FundamentalData | null> {
  const now = Date.now();
  const cached = cache.get(ticker);
  if (cached && now - cached.ts < CACHE_TTL_MS) {
    return cached.data;
  }

  const modules = "defaultKeyStatistics,financialData,summaryDetail,earnings";
  const url = `${YAHOO_BASE}/v10/finance/quoteSummary/${encodeURIComponent(ticker)}?modules=${modules}`;

  try {
    const res = await fetchWithTimeout(url, {}, 10_000, signal);
    const raw: unknown = await res.json();

    const parsed = safeParse(YahooQuoteSummarySchema, raw);
    if (!parsed.success) return null;

    const result = parsed.output.quoteSummary?.result?.[0];
    if (!result) return null;

    const summary = result.summaryDetail;
    const keyStats = result.defaultKeyStatistics;
    const financial = result.financialData;
    const earnings = result.earnings;

    // Extract EPS from latest yearly earnings data
    const yearlyData = earnings?.financialsChart?.yearly;
    const latestYear = yearlyData?.length ? yearlyData[yearlyData.length - 1] : undefined;
    const earningsValue = latestYear?.earnings?.raw;
    const revenueFromEarnings = latestYear?.revenue?.raw;

    const revenue = financial?.totalRevenue?.raw ?? revenueFromEarnings;
    const peRatio = summary?.trailingPE?.raw ?? keyStats?.trailingPE?.raw;
    const forwardPe = summary?.forwardPE?.raw ?? keyStats?.forwardPE?.raw;
    const priceToBook = summary?.priceToBook?.raw ?? keyStats?.priceToBook?.raw;
    const debtToEquity = financial?.debtToEquity?.raw;
    const returnOnEquity = financial?.returnOnEquity?.raw ?? keyStats?.returnOnEquity?.raw;
    const profitMargin = financial?.profitMargins?.raw ?? keyStats?.profitMargins?.raw;
    const dividendYield = summary?.dividendYield?.raw;
    const marketCap = summary?.marketCap?.raw;

    const data: FundamentalData = {
      fetchedAt: new Date().toISOString(),
      ...(peRatio != null && { peRatio }),
      ...(forwardPe != null && { forwardPe }),
      ...(earningsValue != null && { eps: earningsValue }),
      ...(revenue != null && { revenue }),
      ...(marketCap != null && { marketCap }),
      ...(dividendYield != null && { dividendYield }),
      ...(priceToBook != null && { priceToBook }),
      ...(debtToEquity != null && { debtToEquity }),
      ...(returnOnEquity != null && { returnOnEquity }),
      ...(profitMargin != null && { profitMargin }),
    };

    cache.set(ticker, { data, ts: now });
    return data;
  } catch {
    return null;
  }
}

/** Clear the fundamentals cache (useful for testing). */
export function clearFundamentalsCache(): void {
  cache.clear();
}
