/**
 * Multi-timeframe trend — consolidate trend signals across
 * daily, weekly, and monthly timeframes for confluence.
 */

export type Timeframe = "daily" | "weekly" | "monthly";
export type TrendDirection = "up" | "down" | "neutral";

export interface TimeframeTrend {
  readonly timeframe: Timeframe;
  readonly direction: TrendDirection;
  readonly strength: number; // 0-100
  readonly maSlope: number; // slope of primary MA
}

export interface MultiTrendResult {
  readonly trends: readonly TimeframeTrend[];
  readonly consensus: TrendDirection;
  readonly confluenceScore: number; // 0-100
  readonly aligned: boolean;
}

/**
 * Determine trend direction from a price series using SMA slope.
 */
export function detectTrend(
  prices: readonly number[],
  period = 20,
): TimeframeTrend & { timeframe: "daily" } {
  if (prices.length < period + 1) {
    return { timeframe: "daily", direction: "neutral", strength: 0, maSlope: 0 };
  }

  // Compute current and previous SMA
  const currentSlice = prices.slice(-period);
  const prevSlice = prices.slice(-(period + 1), -1);

  const currentSma = currentSlice.reduce((s, p) => s + p, 0) / period;
  const prevSma = prevSlice.reduce((s, p) => s + p, 0) / period;
  const maSlope = currentSma - prevSma;

  // Determine direction with threshold (0.1% of price)
  const threshold = currentSma * 0.001;
  let direction: TrendDirection;
  if (maSlope > threshold) direction = "up";
  else if (maSlope < -threshold) direction = "down";
  else direction = "neutral";

  // Strength: how many bars are above/below the MA
  let aboveCount = 0;
  for (const p of currentSlice) {
    if (p > currentSma) aboveCount++;
  }
  const strength =
    direction === "up"
      ? (aboveCount / period) * 100
      : direction === "down"
        ? ((period - aboveCount) / period) * 100
        : 50;

  return { timeframe: "daily", direction, strength, maSlope };
}

/**
 * Resample daily prices to weekly closes (every 5th bar).
 */
export function resampleWeekly(dailyPrices: readonly number[]): number[] {
  const weekly: number[] = [];
  for (let i = 4; i < dailyPrices.length; i += 5) {
    weekly.push(dailyPrices[i]!);
  }
  return weekly;
}

/**
 * Resample daily prices to monthly closes (every 21st bar).
 */
export function resampleMonthly(dailyPrices: readonly number[]): number[] {
  const monthly: number[] = [];
  for (let i = 20; i < dailyPrices.length; i += 21) {
    monthly.push(dailyPrices[i]!);
  }
  return monthly;
}

/**
 * Compute multi-timeframe trend analysis from daily prices.
 */
export function multiTimeframeTrend(
  dailyPrices: readonly number[],
  periods: { daily?: number; weekly?: number; monthly?: number } = {},
): MultiTrendResult {
  const dailyPeriod = periods.daily ?? 20;
  const weeklyPeriod = periods.weekly ?? 10;
  const monthlyPeriod = periods.monthly ?? 6;

  const dailyTrend = detectTrend(dailyPrices, dailyPeriod);

  const weeklyPrices = resampleWeekly(dailyPrices);
  const weeklyRaw = detectTrend(weeklyPrices, weeklyPeriod);
  const weeklyTrend: TimeframeTrend = { ...weeklyRaw, timeframe: "weekly" };

  const monthlyPrices = resampleMonthly(dailyPrices);
  const monthlyRaw = detectTrend(monthlyPrices, monthlyPeriod);
  const monthlyTrend: TimeframeTrend = { ...monthlyRaw, timeframe: "monthly" };

  const trends = [dailyTrend, weeklyTrend, monthlyTrend] as TimeframeTrend[];

  // Consensus: majority rules
  const directions = trends.map((t) => t.direction);
  const upCount = directions.filter((d) => d === "up").length;
  const downCount = directions.filter((d) => d === "down").length;

  let consensus: TrendDirection;
  if (upCount >= 2) consensus = "up";
  else if (downCount >= 2) consensus = "down";
  else consensus = "neutral";

  const aligned = directions.every((d) => d === consensus) && consensus !== "neutral";

  // Confluence: average strength weighted by timeframe agreement
  const agreeing = trends.filter((t) => t.direction === consensus);
  const confluenceScore =
    agreeing.length > 0 ? agreeing.reduce((s, t) => s + t.strength, 0) / trends.length : 0;

  return { trends, consensus, confluenceScore, aligned };
}

/**
 * Check if all timeframes agree on direction.
 */
export function isFullyAligned(result: MultiTrendResult): boolean {
  return result.aligned;
}
