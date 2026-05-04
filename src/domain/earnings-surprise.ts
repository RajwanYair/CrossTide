/**
 * Earnings surprise tracker — record and analyze actual vs estimated
 * EPS for post-earnings momentum analysis.
 */

export interface EarningsResult {
  readonly ticker: string;
  readonly date: string; // ISO date
  readonly actualEps: number;
  readonly estimatedEps: number;
  readonly revenue?: number;
  readonly estimatedRevenue?: number;
}

export interface EarningsSurprise {
  readonly ticker: string;
  readonly date: string;
  readonly surpriseAmount: number;
  readonly surprisePercent: number;
  readonly beat: boolean;
  readonly revenueSurprisePercent: number | null;
}

/**
 * Calculate the earnings surprise from a result.
 */
export function calculateSurprise(result: EarningsResult): EarningsSurprise {
  const surpriseAmount = result.actualEps - result.estimatedEps;
  const surprisePercent =
    result.estimatedEps !== 0 ? (surpriseAmount / Math.abs(result.estimatedEps)) * 100 : 0;
  const beat = result.actualEps > result.estimatedEps;

  let revenueSurprisePercent: number | null = null;
  if (result.revenue != null && result.estimatedRevenue != null && result.estimatedRevenue !== 0) {
    revenueSurprisePercent =
      ((result.revenue - result.estimatedRevenue) / result.estimatedRevenue) * 100;
  }

  return {
    ticker: result.ticker,
    date: result.date,
    surpriseAmount,
    surprisePercent,
    beat,
    revenueSurprisePercent,
  };
}

/**
 * Batch calculate surprises for multiple earnings results.
 */
export function batchSurprises(results: readonly EarningsResult[]): EarningsSurprise[] {
  return results.map(calculateSurprise);
}

/**
 * Get the beat rate (proportion that exceeded estimates).
 */
export function beatRate(surprises: readonly EarningsSurprise[]): number {
  if (surprises.length === 0) return 0;
  const beats = surprises.filter((s) => s.beat).length;
  return beats / surprises.length;
}

/**
 * Get the average surprise percentage.
 */
export function averageSurprise(surprises: readonly EarningsSurprise[]): number {
  if (surprises.length === 0) return 0;
  const sum = surprises.reduce((s, item) => s + item.surprisePercent, 0);
  return sum / surprises.length;
}

/**
 * Get tickers with the largest positive surprise.
 */
export function topBeats(surprises: readonly EarningsSurprise[], count = 5): EarningsSurprise[] {
  return [...surprises]
    .filter((s) => s.beat)
    .sort((a, b) => b.surprisePercent - a.surprisePercent)
    .slice(0, count);
}

/**
 * Get tickers with the largest negative surprise (misses).
 */
export function topMisses(surprises: readonly EarningsSurprise[], count = 5): EarningsSurprise[] {
  return [...surprises]
    .filter((s) => !s.beat)
    .sort((a, b) => a.surprisePercent - b.surprisePercent)
    .slice(0, count);
}

/**
 * Get the consecutive beat streak for a ticker.
 */
export function beatStreak(surprises: readonly EarningsSurprise[]): number {
  let streak = 0;
  for (let i = surprises.length - 1; i >= 0; i--) {
    if (surprises[i]!.beat) streak++;
    else break;
  }
  return streak;
}

/**
 * Classify surprise magnitude.
 */
export function classifySurprise(
  surprisePercent: number,
): "massive-beat" | "beat" | "inline" | "miss" | "massive-miss" {
  if (surprisePercent >= 20) return "massive-beat";
  if (surprisePercent > 0) return "beat";
  if (surprisePercent === 0) return "inline";
  if (surprisePercent > -20) return "miss";
  return "massive-miss";
}
