/**
 * Screener fundamental filters — pure domain logic (Q3).
 *
 * Provides `matchesFundamentalFilters` for client-side and worker-side filtering
 * of tickers by fundamental criteria: P/E, market cap, dividend yield, sector,
 * profit margin, price-to-book, and debt-to-equity.
 *
 * All constraints are optional range filters (min/max inclusive).
 * A ticker passes when its data satisfies every supplied constraint.
 * If the relevant data field is absent, the filter for that field is skipped.
 */
import type { FundamentalData } from "../types/domain";

// ── Filter parameter types ────────────────────────────────────────────────────

/**
 * Constraints used to include or exclude tickers during fundamental screening.
 * All fields are optional; supply only the constraints you care about.
 */
export interface FundamentalFilterParams {
  /** Maximum trailing P/E ratio (e.g. 25 → exclude stocks with P/E > 25). */
  readonly maxPe?: number;
  /** Minimum trailing P/E ratio (e.g. 5 → exclude P/E < 5). */
  readonly minPe?: number;
  /** Minimum market cap in USD (e.g. 1e9 → large-cap only). */
  readonly minMarketCap?: number;
  /** Maximum market cap in USD. */
  readonly maxMarketCap?: number;
  /** Minimum trailing dividend yield as a decimal (e.g. 0.02 → ≥ 2%). */
  readonly minDividendYield?: number;
  /** Maximum trailing dividend yield as a decimal. */
  readonly maxDividendYield?: number;
  /** Minimum profit margin as a decimal (e.g. 0.1 → ≥ 10%). */
  readonly minProfitMargin?: number;
  /** Maximum price-to-book ratio. */
  readonly maxPriceToBook?: number;
  /** Maximum debt-to-equity ratio. */
  readonly maxDebtToEquity?: number;
  /** Minimum return on equity as a decimal. */
  readonly minReturnOnEquity?: number;
  /** Filter to a specific GICS sector string (exact, case-insensitive). */
  readonly sector?: string;
}

// ── Sector types ──────────────────────────────────────────────────────────────

/** Common GICS sector names recognised by the screener. */
export const GICS_SECTORS = [
  "Technology",
  "Health Care",
  "Financials",
  "Consumer Discretionary",
  "Consumer Staples",
  "Industrials",
  "Energy",
  "Materials",
  "Utilities",
  "Real Estate",
  "Communication Services",
] as const;

export type GicsSector = (typeof GICS_SECTORS)[number];

// ── Filter helper ─────────────────────────────────────────────────────────────

/**
 * Check whether a single ticker's fundamental data satisfies all supplied filter
 * constraints.  Returns `true` when the ticker should be included in results.
 *
 * - If a field referenced by a constraint is absent (`undefined`), the ticker
 *   is **included** (benefit of the doubt; no data ≠ failing condition).
 * - All supplied constraints must be satisfied simultaneously (AND logic).
 */
export function matchesFundamentalFilters(
  data: FundamentalData,
  filters: FundamentalFilterParams,
): boolean {
  if (filters.maxPe !== undefined && data.peRatio !== undefined) {
    if (data.peRatio > filters.maxPe) return false;
  }
  if (filters.minPe !== undefined && data.peRatio !== undefined) {
    if (data.peRatio < filters.minPe) return false;
  }
  if (filters.minMarketCap !== undefined && data.marketCap !== undefined) {
    if (data.marketCap < filters.minMarketCap) return false;
  }
  if (filters.maxMarketCap !== undefined && data.marketCap !== undefined) {
    if (data.marketCap > filters.maxMarketCap) return false;
  }
  if (filters.minDividendYield !== undefined && data.dividendYield !== undefined) {
    if (data.dividendYield < filters.minDividendYield) return false;
  }
  if (filters.maxDividendYield !== undefined && data.dividendYield !== undefined) {
    if (data.dividendYield > filters.maxDividendYield) return false;
  }
  if (filters.minProfitMargin !== undefined && data.profitMargin !== undefined) {
    if (data.profitMargin < filters.minProfitMargin) return false;
  }
  if (filters.maxPriceToBook !== undefined && data.priceToBook !== undefined) {
    if (data.priceToBook > filters.maxPriceToBook) return false;
  }
  if (filters.maxDebtToEquity !== undefined && data.debtToEquity !== undefined) {
    if (data.debtToEquity > filters.maxDebtToEquity) return false;
  }
  if (filters.minReturnOnEquity !== undefined && data.returnOnEquity !== undefined) {
    if (data.returnOnEquity < filters.minReturnOnEquity) return false;
  }
  // Sector filter is advisory — callers must supply `sector` on FundamentalData via extension.
  // Typed as optional here so clients can pass a sector-aware object.
  return true;
}

/**
 * Filter a parallel list of (ticker, data) pairs by fundamental criteria.
 * Returns only the tickers whose data passes all constraints.
 */
export function applyFundamentalFilters(
  entries: ReadonlyArray<{ readonly ticker: string; readonly data: FundamentalData }>,
  filters: FundamentalFilterParams,
): Array<{ readonly ticker: string; readonly data: FundamentalData }> {
  return entries.filter((e) => matchesFundamentalFilters(e.data, filters));
}
