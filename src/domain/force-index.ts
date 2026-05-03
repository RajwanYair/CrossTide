/**
 * Force Index (Alexander Elder, 1993). Combines price change and volume
 * to gauge the power behind a move.
 *   raw[i]    = (close[i] - close[i-1]) * volume[i]
 *   smoothed  = EMA(raw, period)   (typical period: 13)
 * raw[0] is null (no prior close).
 */

export interface ForceCandle {
  readonly close: number;
  readonly volume: number;
}

const ema = (values: readonly number[], period: number): (number | null)[] => {
  const out: (number | null)[] = new Array(values.length).fill(null);
  if (period <= 0 || values.length < period) return out;
  const k = 2 / (period + 1);
  let seed = 0;
  for (let i = 0; i < period; i++) seed += values[i]!;
  let prev = seed / period;
  out[period - 1] = prev;
  for (let i = period; i < values.length; i++) {
    prev = values[i]! * k + prev * (1 - k);
    out[i] = prev;
  }
  return out;
};

export function computeForceIndexRaw(candles: readonly ForceCandle[]): (number | null)[] {
  const out: (number | null)[] = new Array(candles.length).fill(null);
  for (let i = 1; i < candles.length; i++) {
    const cur = candles[i]!;
    const prev = candles[i - 1]!;
    out[i] = (cur.close - prev.close) * cur.volume;
  }
  return out;
}

export function computeForceIndex(candles: readonly ForceCandle[], period = 13): (number | null)[] {
  const raw = computeForceIndexRaw(candles);
  const out: (number | null)[] = new Array(candles.length).fill(null);
  // Raw[0] is null; smoothed EMA over the dense tail starting at index 1.
  if (raw.length <= 1) return out;
  const dense: number[] = [];
  for (let i = 1; i < raw.length; i++) dense.push(raw[i]!);
  const smoothed = ema(dense, period);
  for (let j = 0; j < smoothed.length; j++) out[j + 1] = smoothed[j] ?? null;
  return out;
}
