/**
 * Dividend Analytics — pure functions for analyzing dividend history:
 * yield calculation, growth rate (CAGR), payout consistency,
 * and DRIP (Dividend Reinvestment Plan) simulation.
 *
 * All inputs are plain data — no I/O, no fetch, no Date.now().
 *
 * @module domain/dividend-analytics
 */

export interface DividendPayment {
  readonly date: string; // ISO 8601 (YYYY-MM-DD)
  readonly amount: number; // Dividend per share
}

export interface DividendSummary {
  /** Total dividend paid over the period. */
  readonly totalDividends: number;
  /** Current annual yield (latest 4 quarterly dividends / current price). */
  readonly currentYield: number;
  /** Compound annual growth rate of dividends. */
  readonly dividendCagr: number;
  /** Number of consecutive years with non-decreasing dividends. */
  readonly growthStreak: number;
  /** Average payout frequency per year. */
  readonly avgPayoutsPerYear: number;
  /** Number of payments in history. */
  readonly paymentCount: number;
}

export interface DripResult {
  /** Final number of shares after reinvestment. */
  readonly finalShares: number;
  /** Total dividends received (cash value). */
  readonly totalDividendsReceived: number;
  /** Total shares purchased via DRIP. */
  readonly sharesFromDrip: number;
  /** Final portfolio value (finalShares × endPrice). */
  readonly finalValue: number;
  /** Value without DRIP (initialShares × endPrice + totalDividends). */
  readonly valueWithoutDrip: number;
  /** Extra return from DRIP reinvestment. */
  readonly dripBenefit: number;
}

/**
 * Compute dividend summary statistics.
 *
 * @param dividends - Chronologically sorted dividend payments.
 * @param currentPrice - Current stock price for yield calculation.
 * @returns Summary or null if insufficient data.
 */
export function computeDividendSummary(
  dividends: readonly DividendPayment[],
  currentPrice: number,
): DividendSummary | null {
  if (dividends.length === 0 || currentPrice <= 0) return null;

  const totalDividends = dividends.reduce((s, d) => s + d.amount, 0);

  // Current yield: sum of last 4 payments / price (approximate trailing 12m)
  const recentCount = Math.min(4, dividends.length);
  const recentSum = dividends.slice(-recentCount).reduce((s, d) => s + d.amount, 0);
  // Annualize if less than 4 payments
  const annualizedRecent = recentCount < 4 ? (recentSum / recentCount) * 4 : recentSum;
  const currentYield = annualizedRecent / currentPrice;

  // CAGR of dividends
  const dividendCagr = computeDividendCagr(dividends);

  // Growth streak (consecutive annual increases)
  const growthStreak = computeGrowthStreak(dividends);

  // Average payouts per year
  const firstDate = dividends[0]!.date;
  const lastDate = dividends[dividends.length - 1]!.date;
  const yearSpan = yearsBetween(firstDate, lastDate);
  const avgPayoutsPerYear = yearSpan > 0 ? dividends.length / yearSpan : dividends.length;

  return {
    totalDividends: round(totalDividends),
    currentYield: round(currentYield),
    dividendCagr: round(dividendCagr),
    growthStreak,
    avgPayoutsPerYear: round(avgPayoutsPerYear),
    paymentCount: dividends.length,
  };
}

/**
 * Simulate Dividend Reinvestment Plan (DRIP).
 *
 * @param initialShares - Starting share count.
 * @param dividends - Chronologically sorted payments.
 * @param priceAtDividend - Price at each dividend date for reinvestment.
 *        Must have same length as dividends.
 * @param endPrice - Final stock price for valuation.
 * @returns DRIP result or null if inputs are invalid.
 */
export function simulateDrip(
  initialShares: number,
  dividends: readonly DividendPayment[],
  priceAtDividend: readonly number[],
  endPrice: number,
): DripResult | null {
  if (dividends.length === 0) return null;
  if (dividends.length !== priceAtDividend.length) return null;
  if (initialShares <= 0 || endPrice <= 0) return null;
  if (priceAtDividend.some((p) => p <= 0)) return null;

  let shares = initialShares;
  let totalDividendsReceived = 0;
  let sharesFromDrip = 0;

  for (let i = 0; i < dividends.length; i++) {
    const dividendCash = shares * dividends[i]!.amount;
    totalDividendsReceived += dividendCash;

    const newShares = dividendCash / priceAtDividend[i]!;
    sharesFromDrip += newShares;
    shares += newShares;
  }

  const finalValue = shares * endPrice;
  const valueWithoutDrip = initialShares * endPrice + totalDividendsReceived;

  return {
    finalShares: round(shares),
    totalDividendsReceived: round(totalDividendsReceived),
    sharesFromDrip: round(sharesFromDrip),
    finalValue: round(finalValue),
    valueWithoutDrip: round(valueWithoutDrip),
    dripBenefit: round(finalValue - valueWithoutDrip),
  };
}

function computeDividendCagr(dividends: readonly DividendPayment[]): number {
  if (dividends.length < 2) return 0;

  // Group by year, sum annual dividends
  const annualMap = new Map<number, number>();
  for (const d of dividends) {
    const year = parseInt(d.date.slice(0, 4), 10);
    annualMap.set(year, (annualMap.get(year) ?? 0) + d.amount);
  }

  const years = [...annualMap.keys()].sort((a, b) => a - b);
  if (years.length < 2) return 0;

  const firstAnnual = annualMap.get(years[0]!)!;
  const lastAnnual = annualMap.get(years[years.length - 1]!)!;

  if (firstAnnual <= 0 || lastAnnual <= 0) return 0;

  const n = years[years.length - 1]! - years[0]!;
  if (n === 0) return 0;

  return Math.pow(lastAnnual / firstAnnual, 1 / n) - 1;
}

function computeGrowthStreak(dividends: readonly DividendPayment[]): number {
  // Group by year
  const annualMap = new Map<number, number>();
  for (const d of dividends) {
    const year = parseInt(d.date.slice(0, 4), 10);
    annualMap.set(year, (annualMap.get(year) ?? 0) + d.amount);
  }

  const years = [...annualMap.keys()].sort((a, b) => a - b);
  if (years.length < 2) return years.length > 0 ? 1 : 0;

  let streak = 1;
  for (let i = years.length - 1; i > 0; i--) {
    const current = annualMap.get(years[i]!)!;
    const previous = annualMap.get(years[i - 1]!)!;
    if (current >= previous) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

function yearsBetween(a: string, b: string): number {
  const da = new Date(a);
  const db = new Date(b);
  return Math.abs(db.getTime() - da.getTime()) / (365.25 * 86400000);
}

function round(n: number): number {
  return Math.round(n * 1e6) / 1e6;
}
