/**
 * Fibonacci retracement & extension calculator — compute key
 * Fibonacci levels from swing high/low points.
 */

export interface FibLevel {
  readonly ratio: number;
  readonly label: string;
  readonly price: number;
}

export interface FibResult {
  readonly high: number;
  readonly low: number;
  readonly direction: "up" | "down";
  readonly retracements: readonly FibLevel[];
  readonly extensions: readonly FibLevel[];
}

const RETRACEMENT_RATIOS = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1] as const;
const EXTENSION_RATIOS = [1.0, 1.272, 1.618, 2.0, 2.618, 3.618] as const;

/**
 * Compute Fibonacci retracement levels between a swing high and low.
 * Direction "up" means price moved from low to high (retracements are below high).
 * Direction "down" means price moved from high to low (retracements are above low).
 */
export function fibRetracements(
  high: number,
  low: number,
  direction: "up" | "down" = "up",
): FibLevel[] {
  const range = high - low;

  return RETRACEMENT_RATIOS.map((ratio) => ({
    ratio,
    label: `${(ratio * 100).toFixed(1)}%`,
    price: direction === "up" ? high - range * ratio : low + range * ratio,
  }));
}

/**
 * Compute Fibonacci extension levels beyond the swing range.
 */
export function fibExtensions(
  high: number,
  low: number,
  direction: "up" | "down" = "up",
): FibLevel[] {
  const range = high - low;

  return EXTENSION_RATIOS.map((ratio) => ({
    ratio,
    label: `${(ratio * 100).toFixed(1)}%`,
    price: direction === "up" ? low + range * ratio : high - range * ratio,
  }));
}

/**
 * Full Fibonacci analysis (retracements + extensions).
 */
export function fibAnalysis(high: number, low: number, direction: "up" | "down" = "up"): FibResult {
  return {
    high,
    low,
    direction,
    retracements: fibRetracements(high, low, direction),
    extensions: fibExtensions(high, low, direction),
  };
}

/**
 * Find the nearest Fibonacci level to a given price.
 */
export function nearestFibLevel(price: number, levels: readonly FibLevel[]): FibLevel | null {
  if (levels.length === 0) return null;

  let closest = levels[0]!;
  let minDist = Math.abs(price - closest.price);

  for (let i = 1; i < levels.length; i++) {
    const dist = Math.abs(price - levels[i]!.price);
    if (dist < minDist) {
      minDist = dist;
      closest = levels[i]!;
    }
  }

  return closest;
}

/**
 * Auto-detect swing high/low from a price array and compute fibs.
 */
export function autoFib(prices: readonly number[]): FibResult | null {
  if (prices.length < 3) return null;

  const high = Math.max(...prices);
  const low = Math.min(...prices);
  if (high === low) return null;

  const highIdx = prices.indexOf(high);
  const lowIdx = prices.indexOf(low);
  const direction = lowIdx < highIdx ? "up" : "down";

  return fibAnalysis(high, low, direction);
}
