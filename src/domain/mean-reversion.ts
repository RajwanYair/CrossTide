/**
 * Mean reversion scanner — identify assets that are far from their
 * moving average (z-score based) for potential reversion trades.
 */

export interface MeanReversionSignal {
  readonly ticker: string;
  readonly currentPrice: number;
  readonly mean: number;
  readonly zScore: number;
  readonly deviation: number; // percent from mean
  readonly signal: "oversold" | "overbought" | "neutral";
}

/**
 * Compute z-score of current price relative to a moving average.
 */
export function zScore(prices: readonly number[], period = 20): number {
  if (prices.length < period) return 0;

  const slice = prices.slice(-period);
  const mean = slice.reduce((s, p) => s + p, 0) / period;
  const variance = slice.reduce((s, p) => s + (p - mean) ** 2, 0) / period;
  const stdDev = Math.sqrt(variance);

  if (stdDev === 0) return 0;

  const current = prices[prices.length - 1]!;
  return (current - mean) / stdDev;
}

/**
 * Compute deviation from moving average in percent.
 */
export function deviationFromMa(prices: readonly number[], period = 20): number {
  if (prices.length < period) return 0;

  const slice = prices.slice(-period);
  const mean = slice.reduce((s, p) => s + p, 0) / period;

  if (mean === 0) return 0;
  const current = prices[prices.length - 1]!;
  return ((current - mean) / mean) * 100;
}

/**
 * Analyze a single asset for mean reversion potential.
 */
export function analyzeReversion(
  ticker: string,
  prices: readonly number[],
  period = 20,
  threshold = 2,
): MeanReversionSignal {
  const current = prices.length > 0 ? prices[prices.length - 1]! : 0;
  const z = zScore(prices, period);
  const deviation = deviationFromMa(prices, period);

  const slice = prices.length >= period ? prices.slice(-period) : prices;
  const mean = slice.length > 0 ? slice.reduce((s, p) => s + p, 0) / slice.length : 0;

  let signal: "oversold" | "overbought" | "neutral";
  if (z <= -threshold) signal = "oversold";
  else if (z >= threshold) signal = "overbought";
  else signal = "neutral";

  return { ticker, currentPrice: current, mean, zScore: z, deviation, signal };
}

/**
 * Scan multiple assets and find mean-reversion candidates.
 */
export function scanForReversion(
  assets: readonly { ticker: string; prices: readonly number[] }[],
  period = 20,
  threshold = 2,
): MeanReversionSignal[] {
  return assets
    .map((a) => analyzeReversion(a.ticker, a.prices, period, threshold))
    .filter((s) => s.signal !== "neutral")
    .sort((a, b) => Math.abs(b.zScore) - Math.abs(a.zScore));
}

/**
 * Get the most oversold assets (potential long entries).
 */
export function mostOversold(
  assets: readonly { ticker: string; prices: readonly number[] }[],
  period = 20,
  threshold = 2,
  limit = 10,
): MeanReversionSignal[] {
  return scanForReversion(assets, period, threshold)
    .filter((s) => s.signal === "oversold")
    .slice(0, limit);
}

/**
 * Get the most overbought assets (potential short entries).
 */
export function mostOverbought(
  assets: readonly { ticker: string; prices: readonly number[] }[],
  period = 20,
  threshold = 2,
  limit = 10,
): MeanReversionSignal[] {
  return scanForReversion(assets, period, threshold)
    .filter((s) => s.signal === "overbought")
    .slice(0, limit);
}
