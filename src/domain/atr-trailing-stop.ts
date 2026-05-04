/**
 * ATR trailing stop — dynamic stop-loss levels based on
 * Average True Range for volatility-adjusted exits.
 */

export interface Candle {
  readonly high: number;
  readonly low: number;
  readonly close: number;
}

export interface TrailingStopResult {
  readonly stopLevel: number;
  readonly direction: "long" | "short";
  readonly distance: number; // ATR distance from price
  readonly triggered: boolean;
}

/**
 * Compute True Range for a single candle.
 */
export function trueRange(current: Candle, prevClose: number): number {
  return Math.max(
    current.high - current.low,
    Math.abs(current.high - prevClose),
    Math.abs(current.low - prevClose),
  );
}

/**
 * Compute ATR (Average True Range) over a period.
 */
export function atr(candles: readonly Candle[], period = 14): number {
  if (candles.length < period + 1) return 0;

  let sum = 0;
  for (let i = 1; i <= period; i++) {
    sum += trueRange(candles[i]!, candles[i - 1]!.close);
  }
  let currentAtr = sum / period;

  // Wilder's smoothing for remaining bars
  for (let i = period + 1; i < candles.length; i++) {
    const tr = trueRange(candles[i]!, candles[i - 1]!.close);
    currentAtr = (currentAtr * (period - 1) + tr) / period;
  }

  return currentAtr;
}

/**
 * Compute ATR trailing stop for a long position.
 * Stop is placed `multiplier * ATR` below the highest close.
 */
export function longTrailingStop(
  candles: readonly Candle[],
  multiplier = 3,
  period = 14,
): TrailingStopResult {
  if (candles.length < period + 1) {
    return { stopLevel: 0, direction: "long", distance: 0, triggered: false };
  }

  const atrValue = atr(candles, period);
  const distance = atrValue * multiplier;

  // Track highest close and trailing stop
  let highestClose = candles[0]!.close;
  let stop = highestClose - distance;

  for (const candle of candles) {
    if (candle.close > highestClose) {
      highestClose = candle.close;
      const newStop = highestClose - distance;
      stop = Math.max(stop, newStop); // stop only moves up
    }
  }

  const lastClose = candles[candles.length - 1]!.close;
  const triggered = lastClose < stop;

  return { stopLevel: stop, direction: "long", distance, triggered };
}

/**
 * Compute ATR trailing stop for a short position.
 * Stop is placed `multiplier * ATR` above the lowest close.
 */
export function shortTrailingStop(
  candles: readonly Candle[],
  multiplier = 3,
  period = 14,
): TrailingStopResult {
  if (candles.length < period + 1) {
    return { stopLevel: 0, direction: "short", distance: 0, triggered: false };
  }

  const atrValue = atr(candles, period);
  const distance = atrValue * multiplier;

  let lowestClose = candles[0]!.close;
  let stop = lowestClose + distance;

  for (const candle of candles) {
    if (candle.close < lowestClose) {
      lowestClose = candle.close;
      const newStop = lowestClose + distance;
      stop = Math.min(stop, newStop); // stop only moves down
    }
  }

  const lastClose = candles[candles.length - 1]!.close;
  const triggered = lastClose > stop;

  return { stopLevel: stop, direction: "short", distance, triggered };
}

/**
 * Compute a series of trailing stop levels (for charting).
 */
export function trailingStopSeries(
  candles: readonly Candle[],
  direction: "long" | "short" = "long",
  multiplier = 3,
  period = 14,
): number[] {
  if (candles.length < period + 1) return [];

  const atrValue = atr(candles, period);
  const distance = atrValue * multiplier;
  const stops: number[] = [];

  if (direction === "long") {
    let highestClose = candles[0]!.close;
    let stop = highestClose - distance;

    for (const candle of candles) {
      if (candle.close > highestClose) {
        highestClose = candle.close;
        stop = Math.max(stop, highestClose - distance);
      }
      stops.push(stop);
    }
  } else {
    let lowestClose = candles[0]!.close;
    let stop = lowestClose + distance;

    for (const candle of candles) {
      if (candle.close < lowestClose) {
        lowestClose = candle.close;
        stop = Math.min(stop, lowestClose + distance);
      }
      stops.push(stop);
    }
  }

  return stops;
}
