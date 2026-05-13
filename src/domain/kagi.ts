/**
 * Kagi chart computation — Q26.
 *
 * Converts a price series into Kagi lines that change direction only when
 * price reverses by a specified threshold (fixed amount or percentage).
 * Thick ("yang") lines represent uptrends; thin ("yin") lines represent
 * downtrends. A shoulder/waist break flips the line weight.
 *
 * Reference: Nison, Steve — "Beyond Candlesticks" (Wiley, 1994).
 */

// ── Types ────────────────────────────────────────────────────────────────────

/** Line weight: yang (thick, bullish) or yin (thin, bearish). */
export type KagiWeight = "yang" | "yin";

/** A single Kagi line segment from one price to another. */
export interface KagiSegment {
  /** Starting price of this segment. */
  readonly from: number;
  /** Ending price of this segment. */
  readonly to: number;
  /** Line weight (yang = thick/bullish, yin = thin/bearish). */
  readonly weight: KagiWeight;
  /** Index in the original price array where this segment ends. */
  readonly endIndex: number;
}

/** Full Kagi chart output. */
export interface KagiChart {
  /** Ordered segments (first = oldest). */
  readonly segments: readonly KagiSegment[];
  /** Reversal threshold used. */
  readonly reversalThreshold: number;
  /** Whether percentage mode was used. */
  readonly isPercentage: boolean;
  /** Shoulder levels (local highs where weight changed to yang). */
  readonly shoulders: readonly number[];
  /** Waist levels (local lows where weight changed to yin). */
  readonly waists: readonly number[];
}

/** Options for `computeKagi()`. */
export interface KagiOptions {
  /**
   * Reversal threshold. If `isPercentage` is true, this is a decimal
   * (e.g. 0.04 = 4%). Otherwise it's an absolute price amount.
   * @default 0.04 (4%)
   */
  reversalThreshold?: number;
  /**
   * Interpret `reversalThreshold` as a percentage of current price.
   * @default true
   */
  isPercentage?: boolean;
}

/** Input data point for Kagi computation. */
export interface KagiInput {
  readonly close: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Auto-calculate a reasonable reversal threshold as a percentage.
 * Uses 4% as default, which works well for most daily equity charts.
 * For low-volatility instruments, 2-3% is better; for crypto, 5-8%.
 */
export function autoReversalThreshold(prices: readonly number[]): number {
  if (prices.length < 20) return 0.04;

  // Use average true range of returns as a heuristic
  let sumAbsReturn = 0;
  for (let i = 1; i < Math.min(prices.length, 60); i++) {
    const prev = prices[i - 1]!;
    if (prev !== 0) {
      sumAbsReturn += Math.abs((prices[i]! - prev) / prev);
    }
  }
  const avgReturn = sumAbsReturn / Math.min(prices.length - 1, 59);

  // Reversal threshold = ~3x average daily return, clamped to [0.02, 0.10]
  return Math.max(0.02, Math.min(0.1, avgReturn * 3));
}

// ── Core computation ─────────────────────────────────────────────────────────

/**
 * Compute a Kagi chart from a series of closing prices.
 *
 * Algorithm:
 * 1. Start with the first price; direction is initially "up".
 * 2. Continue in the current direction as long as price moves favorably.
 * 3. When price reverses by the threshold, start a new segment.
 * 4. When a new high exceeds the previous shoulder → switch to yang (thick).
 *    When a new low goes below the previous waist → switch to yin (thin).
 */
export function computeKagi(data: readonly KagiInput[], options: KagiOptions = {}): KagiChart {
  const { reversalThreshold = 0.04, isPercentage = true } = options;

  if (data.length < 2) {
    return { segments: [], reversalThreshold, isPercentage, shoulders: [], waists: [] };
  }

  const segments: KagiSegment[] = [];
  const shoulders: number[] = [];
  const waists: number[] = [];

  let direction: "up" | "down" = data[1]!.close >= data[0]!.close ? "up" : "down";
  let segStart = data[0]!.close;
  let extreme = data[0]!.close; // Current extreme (high for up, low for down)
  let weight: KagiWeight = "yang";

  // Track previous shoulder/waist for weight transitions
  let lastShoulder = -Infinity;
  let lastWaist = Infinity;

  function getThreshold(price: number): number {
    return isPercentage ? price * reversalThreshold : reversalThreshold;
  }

  for (let i = 1; i < data.length; i++) {
    const price = data[i]!.close;

    if (direction === "up") {
      if (price > extreme) {
        // Continue up — extend the current segment
        extreme = price;
      } else if (extreme - price >= getThreshold(extreme)) {
        // Reversal: push completed up-segment, start down
        const shoulder = extreme;

        // Check for weight change: new high above last shoulder → yang
        if (shoulder > lastShoulder && weight === "yin") {
          weight = "yang";
          shoulders.push(shoulder);
        }
        lastShoulder = shoulder;

        segments.push({ from: segStart, to: extreme, weight, endIndex: i - 1 });
        segStart = extreme;
        extreme = price;
        direction = "down";
      }
    } else {
      if (price < extreme) {
        // Continue down — extend the current segment
        extreme = price;
      } else if (price - extreme >= getThreshold(extreme)) {
        // Reversal: push completed down-segment, start up
        const waist = extreme;

        // Check for weight change: new low below last waist → yin
        if (waist < lastWaist && weight === "yang") {
          weight = "yin";
          waists.push(waist);
        }
        lastWaist = waist;

        segments.push({ from: segStart, to: extreme, weight, endIndex: i - 1 });
        segStart = extreme;
        extreme = price;
        direction = "up";
      }
    }
  }

  // Flush final in-progress segment
  segments.push({
    from: segStart,
    to: extreme,
    weight,
    endIndex: data.length - 1,
  });

  return { segments, reversalThreshold, isPercentage, shoulders, waists };
}
