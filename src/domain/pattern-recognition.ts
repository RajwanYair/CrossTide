/**
 * Candlestick pattern recognition — rule-based detection (I2).
 *
 * Detects classic candlestick patterns from OHLC data using deterministic
 * rules.  Each detector returns a confidence score (0–1) and directional
 * bias (bullish/bearish/neutral).
 *
 * Supported single-candle patterns:
 *   - Doji, Hammer, Shooting Star, Spinning Top, Marubozu
 *
 * Supported multi-candle patterns:
 *   - Engulfing (bullish/bearish), Morning Star, Evening Star,
 *     Three White Soldiers, Three Black Crows
 *
 * Usage:
 *   const patterns = detectAllPatterns(candles);
 *   // → [{ name: "Hammer", type: "bullish", confidence: 0.85, index: 42 }]
 */

// ── Types ─────────────────────────────────────────────────────────────────

export interface PatternCandle {
  open: number;
  high: number;
  low: number;
  close: number;
}

export type PatternDirection = "bullish" | "bearish" | "neutral";

export interface DetectedPattern {
  /** Pattern name (e.g. "Hammer", "Engulfing"). */
  name: string;
  /** Directional bias of the pattern. */
  type: PatternDirection;
  /** Confidence score 0–1. */
  confidence: number;
  /** Index in the candle array where the pattern completes. */
  index: number;
}

// ── Candle metrics ────────────────────────────────────────────────────────

/** Absolute body size (|close - open|). */
export function bodySize(c: PatternCandle): number {
  return Math.abs(c.close - c.open);
}

/** Full candle range (high - low). */
export function candleRange(c: PatternCandle): number {
  return c.high - c.low;
}

/** Upper shadow length. */
export function upperShadow(c: PatternCandle): number {
  return c.high - Math.max(c.open, c.close);
}

/** Lower shadow length. */
export function lowerShadow(c: PatternCandle): number {
  return Math.min(c.open, c.close) - c.low;
}

/** True when close >= open (green candle). */
export function isBullish(c: PatternCandle): boolean {
  return c.close >= c.open;
}

// ── Thresholds ────────────────────────────────────────────────────────────

const DOJI_RATIO = 0.05; // body ≤ 5% of range
const SHADOW_RATIO = 2.0; // shadow ≥ 2× body for hammer/shooting star
const SPINNING_TOP_MAX_BODY = 0.3; // body ≤ 30% of range
const MARUBOZU_MIN_BODY = 0.95; // body ≥ 95% of range

// ── Single-candle detectors ───────────────────────────────────────────────

/** Detect Doji: body is ≤5% of total range. */
export function isDoji(c: PatternCandle): number {
  const range = candleRange(c);
  if (range === 0) return 1; // perfectly flat → maximum doji
  const ratio = bodySize(c) / range;
  return ratio <= DOJI_RATIO ? 1 - ratio / DOJI_RATIO : 0;
}

/**
 * Detect Hammer: small body at the top, long lower shadow (≥2× body).
 * Bullish reversal signal when found at a swing low.
 */
export function isHammer(c: PatternCandle): number {
  const body = bodySize(c);
  const range = candleRange(c);
  if (range === 0 || body === 0) return 0;
  const lower = lowerShadow(c);
  const upper = upperShadow(c);
  if (lower < body * SHADOW_RATIO) return 0;
  if (upper > body * 0.5) return 0; // upper shadow must be small
  return Math.min(lower / (body * SHADOW_RATIO), 1);
}

/**
 * Detect Shooting Star: small body at the bottom, long upper shadow.
 * Bearish reversal signal when found at a swing high.
 */
export function isShootingStar(c: PatternCandle): number {
  const body = bodySize(c);
  const range = candleRange(c);
  if (range === 0 || body === 0) return 0;
  const upper = upperShadow(c);
  const lower = lowerShadow(c);
  if (upper < body * SHADOW_RATIO) return 0;
  if (lower > body * 0.5) return 0;
  return Math.min(upper / (body * SHADOW_RATIO), 1);
}

/** Detect Spinning Top: small body with notable shadows on both sides. */
export function isSpinningTop(c: PatternCandle): number {
  const range = candleRange(c);
  if (range === 0) return 0;
  const body = bodySize(c);
  const bodyRatio = body / range;
  if (bodyRatio > SPINNING_TOP_MAX_BODY) return 0;
  const upper = upperShadow(c);
  const lower = lowerShadow(c);
  if (upper < body * 0.5 || lower < body * 0.5) return 0;
  return 1 - bodyRatio / SPINNING_TOP_MAX_BODY;
}

/** Detect Marubozu: body fills ≥95% of the range (very little shadow). */
export function isMarubozu(c: PatternCandle): number {
  const range = candleRange(c);
  if (range === 0) return 0;
  const ratio = bodySize(c) / range;
  return ratio >= MARUBOZU_MIN_BODY ? (ratio - MARUBOZU_MIN_BODY) / (1 - MARUBOZU_MIN_BODY) : 0;
}

// ── Multi-candle detectors ────────────────────────────────────────────────

/**
 * Detect Bullish Engulfing: second candle's body fully engulfs first.
 * First candle is bearish, second is bullish.
 */
export function isBullishEngulfing(prev: PatternCandle, curr: PatternCandle): number {
  if (!isBullish(curr) || isBullish(prev)) return 0;
  if (curr.close <= prev.open || curr.open >= prev.close) return 0;
  const prevBody = bodySize(prev);
  const currBody = bodySize(curr);
  if (prevBody === 0) return 0;
  return Math.min(currBody / prevBody, 2) / 2;
}

/**
 * Detect Bearish Engulfing: second candle's body fully engulfs first.
 * First candle is bullish, second is bearish.
 */
export function isBearishEngulfing(prev: PatternCandle, curr: PatternCandle): number {
  if (isBullish(curr) || !isBullish(prev)) return 0;
  if (curr.open <= prev.close || curr.close >= prev.open) return 0;
  const prevBody = bodySize(prev);
  const currBody = bodySize(curr);
  if (prevBody === 0) return 0;
  return Math.min(currBody / prevBody, 2) / 2;
}

/**
 * Detect Morning Star: three-candle bullish reversal.
 * 1st bearish, 2nd small body (star), 3rd bullish closing above midpoint of 1st.
 */
export function isMorningStar(
  first: PatternCandle,
  second: PatternCandle,
  third: PatternCandle,
): number {
  if (isBullish(first) || !isBullish(third)) return 0;
  const firstBody = bodySize(first);
  const secondBody = bodySize(second);
  const thirdBody = bodySize(third);
  if (firstBody === 0) return 0;
  // Star body must be small relative to first
  if (secondBody > firstBody * 0.5) return 0;
  // Third must close above midpoint of first
  const midpoint = (first.open + first.close) / 2;
  if (third.close < midpoint) return 0;
  return Math.min(thirdBody / firstBody, 1);
}

/**
 * Detect Evening Star: three-candle bearish reversal.
 * 1st bullish, 2nd small body (star), 3rd bearish closing below midpoint of 1st.
 */
export function isEveningStar(
  first: PatternCandle,
  second: PatternCandle,
  third: PatternCandle,
): number {
  if (!isBullish(first) || isBullish(third)) return 0;
  const firstBody = bodySize(first);
  const secondBody = bodySize(second);
  const thirdBody = bodySize(third);
  if (firstBody === 0) return 0;
  if (secondBody > firstBody * 0.5) return 0;
  const midpoint = (first.open + first.close) / 2;
  if (third.close > midpoint) return 0;
  return Math.min(thirdBody / firstBody, 1);
}

/**
 * Detect Three White Soldiers: three consecutive bullish candles,
 * each closing higher with minimal upper shadow.
 */
export function isThreeWhiteSoldiers(a: PatternCandle, b: PatternCandle, c: PatternCandle): number {
  if (!isBullish(a) || !isBullish(b) || !isBullish(c)) return 0;
  if (b.close <= a.close || c.close <= b.close) return 0;
  if (b.open <= a.open || c.open <= b.open) return 0;
  // Each should have small upper shadow
  const avgBody = (bodySize(a) + bodySize(b) + bodySize(c)) / 3;
  const maxUpper = Math.max(upperShadow(a), upperShadow(b), upperShadow(c));
  if (maxUpper > avgBody * 0.5) return 0;
  return Math.min(avgBody / (candleRange(a) || 1), 1);
}

/**
 * Detect Three Black Crows: three consecutive bearish candles,
 * each closing lower with minimal lower shadow.
 */
export function isThreeBlackCrows(a: PatternCandle, b: PatternCandle, c: PatternCandle): number {
  if (isBullish(a) || isBullish(b) || isBullish(c)) return 0;
  if (b.close >= a.close || c.close >= b.close) return 0;
  if (b.open >= a.open || c.open >= b.open) return 0;
  const avgBody = (bodySize(a) + bodySize(b) + bodySize(c)) / 3;
  const maxLower = Math.max(lowerShadow(a), lowerShadow(b), lowerShadow(c));
  if (maxLower > avgBody * 0.5) return 0;
  return Math.min(avgBody / (candleRange(a) || 1), 1);
}

// ── Composite scanner ─────────────────────────────────────────────────────

/**
 * Scan an array of candles and return all detected patterns.
 * Results are sorted by index ascending, then by confidence descending.
 */
export function detectAllPatterns(candles: readonly PatternCandle[]): DetectedPattern[] {
  const results: DetectedPattern[] = [];

  for (let i = 0; i < candles.length; i++) {
    const c = candles[i];

    // Single-candle patterns
    const dojiConf = isDoji(c);
    if (dojiConf > 0)
      results.push({ name: "Doji", type: "neutral", confidence: dojiConf, index: i });

    const hammerConf = isHammer(c);
    if (hammerConf > 0)
      results.push({ name: "Hammer", type: "bullish", confidence: hammerConf, index: i });

    const shootingConf = isShootingStar(c);
    if (shootingConf > 0)
      results.push({ name: "Shooting Star", type: "bearish", confidence: shootingConf, index: i });

    const spinConf = isSpinningTop(c);
    if (spinConf > 0)
      results.push({ name: "Spinning Top", type: "neutral", confidence: spinConf, index: i });

    const maruConf = isMarubozu(c);
    if (maruConf > 0) {
      results.push({
        name: "Marubozu",
        type: isBullish(c) ? "bullish" : "bearish",
        confidence: maruConf,
        index: i,
      });
    }

    // Two-candle patterns
    if (i >= 1) {
      const prev = candles[i - 1];
      const bullEngConf = isBullishEngulfing(prev, c);
      if (bullEngConf > 0)
        results.push({
          name: "Bullish Engulfing",
          type: "bullish",
          confidence: bullEngConf,
          index: i,
        });

      const bearEngConf = isBearishEngulfing(prev, c);
      if (bearEngConf > 0)
        results.push({
          name: "Bearish Engulfing",
          type: "bearish",
          confidence: bearEngConf,
          index: i,
        });
    }

    // Three-candle patterns
    if (i >= 2) {
      const first = candles[i - 2];
      const second = candles[i - 1];

      const morningConf = isMorningStar(first, second, c);
      if (morningConf > 0)
        results.push({ name: "Morning Star", type: "bullish", confidence: morningConf, index: i });

      const eveningConf = isEveningStar(first, second, c);
      if (eveningConf > 0)
        results.push({ name: "Evening Star", type: "bearish", confidence: eveningConf, index: i });

      const soldiersConf = isThreeWhiteSoldiers(first, second, c);
      if (soldiersConf > 0)
        results.push({
          name: "Three White Soldiers",
          type: "bullish",
          confidence: soldiersConf,
          index: i,
        });

      const crowsConf = isThreeBlackCrows(first, second, c);
      if (crowsConf > 0)
        results.push({
          name: "Three Black Crows",
          type: "bearish",
          confidence: crowsConf,
          index: i,
        });
    }
  }

  results.sort((a, b) => a.index - b.index || b.confidence - a.confidence);
  return results;
}
