/**
 * Gain/loss streak tracker — analyze consecutive up/down days
 * for streak detection and pattern awareness.
 */

export interface StreakResult {
  readonly ticker: string;
  readonly currentStreak: number; // Positive = gains, negative = losses
  readonly direction: "gain" | "loss" | "flat";
  readonly longestGainStreak: number;
  readonly longestLossStreak: number;
}

/**
 * Compute the current streak from a price series.
 * Returns positive number for consecutive gains, negative for consecutive losses.
 */
export function currentStreak(prices: readonly number[]): number {
  if (prices.length < 2) return 0;

  let streak = 0;
  let direction: "gain" | "loss" | null = null;

  for (let i = prices.length - 1; i > 0; i--) {
    const diff = prices[i]! - prices[i - 1]!;
    if (diff > 0) {
      if (direction === null) direction = "gain";
      if (direction !== "gain") break;
      streak++;
    } else if (diff < 0) {
      if (direction === null) direction = "loss";
      if (direction !== "loss") break;
      streak++;
    } else {
      break; // flat day ends the streak
    }
  }

  return direction === "loss" ? -streak : streak;
}

/**
 * Find the longest gain streak in a price series.
 */
export function longestGainStreak(prices: readonly number[]): number {
  let max = 0;
  let current = 0;
  for (let i = 1; i < prices.length; i++) {
    if (prices[i]! > prices[i - 1]!) {
      current++;
      if (current > max) max = current;
    } else {
      current = 0;
    }
  }
  return max;
}

/**
 * Find the longest loss streak in a price series.
 */
export function longestLossStreak(prices: readonly number[]): number {
  let max = 0;
  let current = 0;
  for (let i = 1; i < prices.length; i++) {
    if (prices[i]! < prices[i - 1]!) {
      current++;
      if (current > max) max = current;
    } else {
      current = 0;
    }
  }
  return max;
}

/**
 * Full streak analysis for a ticker.
 */
export function analyzeStreak(ticker: string, prices: readonly number[]): StreakResult {
  const streak = currentStreak(prices);
  return {
    ticker: ticker.toUpperCase(),
    currentStreak: streak,
    direction: streak > 0 ? "gain" : streak < 0 ? "loss" : "flat",
    longestGainStreak: longestGainStreak(prices),
    longestLossStreak: longestLossStreak(prices),
  };
}

/**
 * Analyze streaks for multiple tickers, sorted by longest current streak.
 */
export function rankByStreak(
  tickers: readonly { ticker: string; prices: readonly number[] }[],
): StreakResult[] {
  return tickers
    .map((t) => analyzeStreak(t.ticker, t.prices))
    .sort((a, b) => Math.abs(b.currentStreak) - Math.abs(a.currentStreak));
}

/**
 * Get tickers on a gain streak of at least N days.
 */
export function getGainStreaks(results: readonly StreakResult[], minDays: number): StreakResult[] {
  return results.filter((r) => r.currentStreak >= minDays);
}

/**
 * Get tickers on a loss streak of at least N days.
 */
export function getLossStreaks(results: readonly StreakResult[], minDays: number): StreakResult[] {
  return results.filter((r) => r.currentStreak <= -minDays);
}
