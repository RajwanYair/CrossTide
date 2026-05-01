/**
 * 52-week (or arbitrary period) range bar geometry. Computes the
 * normalized position of the current price within a [low, high] range
 * for rendering a horizontal range bar.
 */

export interface RangeBarInput {
  readonly low: number;
  readonly high: number;
  readonly current: number;
}

export interface RangeBarGeometry {
  /** 0 to 1 — current position within [low, high]. */
  readonly position: number;
  /** "below"|"above"|"in" — qualitative bucket. */
  readonly zone: "below" | "in" | "above";
  /** Distance from low as percentage (0..100). */
  readonly fromLowPct: number;
  /** Distance from high as percentage (0..100, signed positive). */
  readonly fromHighPct: number;
}

export function computeRangeBar(input: RangeBarInput): RangeBarGeometry {
  const { low, high, current } = input;
  if (!Number.isFinite(low) || !Number.isFinite(high) || !Number.isFinite(current)) {
    return { position: 0, zone: "in", fromLowPct: 0, fromHighPct: 0 };
  }
  if (high <= low) {
    return {
      position: 0.5,
      zone: "in",
      fromLowPct: 0,
      fromHighPct: 0,
    };
  }
  const range = high - low;
  const raw = (current - low) / range;
  const position = Math.max(0, Math.min(1, raw));
  const zone: RangeBarGeometry["zone"] = raw < 0 ? "below" : raw > 1 ? "above" : "in";
  return {
    position,
    zone,
    fromLowPct: ((current - low) / low) * 100,
    fromHighPct: ((high - current) / high) * 100,
  };
}

export function rangeFromCandles(
  candles: readonly { high: number; low: number; close: number }[],
): RangeBarInput | null {
  if (candles.length === 0) return null;
  let lo = Infinity;
  let hi = -Infinity;
  for (const c of candles) {
    if (c.low < lo) lo = c.low;
    if (c.high > hi) hi = c.high;
  }
  const last = candles[candles.length - 1];
  if (!last) return null;
  return { low: lo, high: hi, current: last.close };
}
