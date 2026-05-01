/**
 * Keltner channels: EMA midline ± multiplier × ATR. Common defaults
 * are length=20, atrLength=10, multiplier=2.
 */

import type { Candle } from "./heikin-ashi";

export interface KeltnerPoint {
  readonly time: number;
  readonly middle: number;
  readonly upper: number;
  readonly lower: number;
}

export interface KeltnerOptions {
  readonly length?: number;
  readonly atrLength?: number;
  readonly multiplier?: number;
}

function ema(values: readonly number[], length: number): number[] {
  const k = 2 / (length + 1);
  const out: number[] = [];
  let prev = 0;
  let sum = 0;
  for (let i = 0; i < values.length; i++) {
    const v = values[i]!;
    if (i < length) {
      sum += v;
      if (i === length - 1) {
        prev = sum / length;
        out.push(prev);
      }
    } else {
      prev = v * k + prev * (1 - k);
      out.push(prev);
    }
  }
  return out;
}

function atrSeries(candles: readonly Candle[], length: number): number[] {
  if (candles.length === 0) return [];
  const tr: number[] = [];
  for (let i = 0; i < candles.length; i++) {
    const c = candles[i]!;
    if (i === 0) {
      tr.push(c.high - c.low);
      continue;
    }
    const prev = candles[i - 1]!;
    const a = c.high - c.low;
    const b = Math.abs(c.high - prev.close);
    const d = Math.abs(c.low - prev.close);
    tr.push(Math.max(a, b, d));
  }
  // Wilder smoothing: first ATR = SMA(length); subsequent rolled.
  const out: number[] = [];
  let sum = 0;
  for (let i = 0; i < tr.length; i++) {
    if (i < length) {
      sum += tr[i]!;
      if (i === length - 1) out.push(sum / length);
    } else {
      const prev = out[out.length - 1]!;
      out.push((prev * (length - 1) + tr[i]!) / length);
    }
  }
  return out;
}

export function computeKeltner(
  candles: readonly Candle[],
  options: KeltnerOptions = {},
): KeltnerPoint[] {
  const length = options.length ?? 20;
  const atrLength = options.atrLength ?? 10;
  const mult = options.multiplier ?? 2;
  if (length <= 0 || atrLength <= 0) {
    throw new RangeError("length and atrLength must be positive");
  }
  if (candles.length < Math.max(length, atrLength)) return [];
  const closes = candles.map((c) => c.close);
  const ema20 = ema(closes, length);
  const atr = atrSeries(candles, atrLength);
  // ema20[0] aligns with candles[length-1], atr[0] aligns with candles[atrLength-1].
  const startIdx = Math.max(length, atrLength) - 1;
  const out: KeltnerPoint[] = [];
  for (let i = startIdx; i < candles.length; i++) {
    const emaVal = ema20[i - (length - 1)]!;
    const atrVal = atr[i - (atrLength - 1)]!;
    out.push({
      time: candles[i]!.time,
      middle: emaVal,
      upper: emaVal + mult * atrVal,
      lower: emaVal - mult * atrVal,
    });
  }
  return out;
}
