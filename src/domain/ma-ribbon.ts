/**
 * Moving average ribbon — compute multiple MAs (5,10,20,50,100,200)
 * with spread/convergence metrics for trend analysis.
 */

export interface RibbonPoint {
  readonly index: number;
  readonly values: Record<number, number>;
  readonly spread: number; // difference between fastest and slowest
  readonly aligned: "bullish" | "bearish" | "mixed";
}

export interface RibbonSummary {
  readonly currentAlignment: "bullish" | "bearish" | "mixed";
  readonly spreadPercent: number;
  readonly converging: boolean;
  readonly periods: readonly number[];
}

const DEFAULT_PERIODS = [5, 10, 20, 50, 100, 200] as const;

/**
 * Compute a simple moving average at a given index.
 */
function sma(prices: readonly number[], endIndex: number, period: number): number | null {
  if (endIndex < period - 1) return null;
  let sum = 0;
  for (let i = endIndex - period + 1; i <= endIndex; i++) {
    sum += prices[i]!;
  }
  return sum / period;
}

/**
 * Compute the full ribbon for a price series.
 */
export function computeRibbon(
  prices: readonly number[],
  periods: readonly number[] = DEFAULT_PERIODS,
): RibbonPoint[] {
  const sorted = [...periods].sort((a, b) => a - b);
  const minRequired = sorted[sorted.length - 1]!;
  const ribbon: RibbonPoint[] = [];

  for (let i = minRequired - 1; i < prices.length; i++) {
    const values: Record<number, number> = {};
    for (const p of sorted) {
      const v = sma(prices, i, p);
      if (v !== null) values[p] = v;
    }

    const fastest = values[sorted[0]!]!;
    const slowest = values[sorted[sorted.length - 1]!]!;
    const spread = fastest - slowest;

    // Check alignment: bullish if all MAs in descending period order are ascending value
    let bullish = true;
    let bearish = true;
    for (let j = 1; j < sorted.length; j++) {
      if (values[sorted[j - 1]!]! <= values[sorted[j]!]!) bullish = false;
      if (values[sorted[j - 1]!]! >= values[sorted[j]!]!) bearish = false;
    }

    const aligned = bullish ? "bullish" : bearish ? "bearish" : "mixed";
    ribbon.push({ index: i, values, spread, aligned });
  }

  return ribbon;
}

/**
 * Get ribbon summary for the latest point.
 */
export function ribbonSummary(
  prices: readonly number[],
  periods: readonly number[] = DEFAULT_PERIODS,
): RibbonSummary | null {
  const ribbon = computeRibbon(prices, periods);
  if (ribbon.length === 0) return null;

  const last = ribbon[ribbon.length - 1]!;
  const sorted = [...periods].sort((a, b) => a - b);
  const slowest = last.values[sorted[sorted.length - 1]!]!;
  const spreadPercent = slowest !== 0 ? (last.spread / slowest) * 100 : 0;

  // Check if converging (spread narrowing)
  let converging = false;
  if (ribbon.length >= 5) {
    const recent = ribbon.slice(-5);
    const spreads = recent.map((r) => Math.abs(r.spread));
    converging = spreads[spreads.length - 1]! < spreads[0]!;
  }

  return {
    currentAlignment: last.aligned,
    spreadPercent,
    converging,
    periods: sorted,
  };
}

/**
 * Detect ribbon crossover events (golden/death cross style).
 */
export function findCrossovers(
  prices: readonly number[],
  fastPeriod = 50,
  slowPeriod = 200,
): { index: number; type: "golden" | "death" }[] {
  const crosses: { index: number; type: "golden" | "death" }[] = [];
  const minRequired = Math.max(fastPeriod, slowPeriod);

  let prevFast: number | null = null;
  let prevSlow: number | null = null;

  for (let i = minRequired - 1; i < prices.length; i++) {
    const fast = sma(prices, i, fastPeriod)!;
    const slow = sma(prices, i, slowPeriod)!;

    if (prevFast !== null && prevSlow !== null) {
      const wasBearish = prevFast < prevSlow;
      const isBullish = fast > slow;
      const wasAbove = prevFast > prevSlow;
      const isBelow = fast < slow;

      if (wasBearish && isBullish) {
        crosses.push({ index: i, type: "golden" });
      } else if (wasAbove && isBelow) {
        crosses.push({ index: i, type: "death" });
      }
    }

    prevFast = fast;
    prevSlow = slow;
  }

  return crosses;
}
