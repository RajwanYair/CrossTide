/**
 * Candlestick pattern detector — identify common bullish/bearish
 * single and multi-bar patterns from OHLC data.
 */

export interface Candle {
  readonly open: number;
  readonly high: number;
  readonly low: number;
  readonly close: number;
}

export interface PatternMatch {
  readonly index: number;
  readonly pattern: string;
  readonly type: "bullish" | "bearish" | "neutral";
  readonly confidence: number; // 0–1
}

function bodySize(c: Candle): number {
  return Math.abs(c.close - c.open);
}

function range(c: Candle): number {
  return c.high - c.low;
}

function upperShadow(c: Candle): number {
  return c.high - Math.max(c.open, c.close);
}

function lowerShadow(c: Candle): number {
  return Math.min(c.open, c.close) - c.low;
}

function isBullish(c: Candle): boolean {
  return c.close > c.open;
}

function isBearish(c: Candle): boolean {
  return c.close < c.open;
}

/**
 * Detect a Doji (very small body relative to range).
 */
export function isDoji(c: Candle): boolean {
  const r = range(c);
  if (r === 0) return true;
  return bodySize(c) / r < 0.1;
}

/**
 * Detect a Hammer (small body at top, long lower shadow).
 */
export function isHammer(c: Candle): boolean {
  const body = bodySize(c);
  const lower = lowerShadow(c);
  const upper = upperShadow(c);
  return lower >= body * 2 && upper <= body && body > 0;
}

/**
 * Detect a Shooting Star (small body at bottom, long upper shadow).
 */
export function isShootingStar(c: Candle): boolean {
  const body = bodySize(c);
  const upper = upperShadow(c);
  const lower = lowerShadow(c);
  return upper >= body * 2 && lower <= body && body > 0;
}

/**
 * Detect an Engulfing pattern (2-bar).
 */
export function isEngulfing(prev: Candle, curr: Candle): "bullish" | "bearish" | null {
  if (isBearish(prev) && isBullish(curr) && curr.open <= prev.close && curr.close >= prev.open) {
    return "bullish";
  }
  if (isBullish(prev) && isBearish(curr) && curr.open >= prev.close && curr.close <= prev.open) {
    return "bearish";
  }
  return null;
}

/**
 * Detect a Marubozu (full body, minimal shadows).
 */
export function isMarubozu(c: Candle): boolean {
  const r = range(c);
  if (r === 0) return false;
  return bodySize(c) / r > 0.9;
}

/**
 * Scan a candle series for all recognized patterns.
 */
export function scanPatterns(candles: readonly Candle[]): PatternMatch[] {
  const matches: PatternMatch[] = [];

  for (let i = 0; i < candles.length; i++) {
    const c = candles[i]!;

    if (isDoji(c)) {
      matches.push({ index: i, pattern: "doji", type: "neutral", confidence: 0.6 });
    }

    if (isHammer(c)) {
      matches.push({ index: i, pattern: "hammer", type: "bullish", confidence: 0.7 });
    }

    if (isShootingStar(c)) {
      matches.push({ index: i, pattern: "shooting-star", type: "bearish", confidence: 0.7 });
    }

    if (isMarubozu(c)) {
      const type = isBullish(c) ? "bullish" : "bearish";
      matches.push({ index: i, pattern: "marubozu", type, confidence: 0.8 });
    }

    if (i > 0) {
      const engulf = isEngulfing(candles[i - 1]!, c);
      if (engulf) {
        matches.push({
          index: i,
          pattern: `${engulf}-engulfing`,
          type: engulf,
          confidence: 0.85,
        });
      }
    }
  }

  return matches;
}

/**
 * Filter patterns by type.
 */
export function filterByType(
  patterns: readonly PatternMatch[],
  type: "bullish" | "bearish" | "neutral",
): PatternMatch[] {
  return patterns.filter((p) => p.type === type);
}

/**
 * Get the most recent pattern.
 */
export function lastPattern(patterns: readonly PatternMatch[]): PatternMatch | null {
  return patterns.length > 0 ? patterns[patterns.length - 1]! : null;
}
