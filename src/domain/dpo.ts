/**
 * Detrended Price Oscillator (DPO). Removes the trend by subtracting a
 * displaced SMA from price:
 *   shift = floor(period/2) + 1
 *   DPO[i] = close[i] - SMA(close, period)[i - shift]
 * Useful for identifying overbought/oversold cycles without trend bias.
 * Returns nulls where insufficient history.
 */

export function computeDpo(closes: readonly number[], period = 20): (number | null)[] {
  const out: (number | null)[] = new Array(closes.length).fill(null);
  if (period <= 0 || closes.length < period) return out;
  const shift = Math.floor(period / 2) + 1;
  // Compute SMA inline (rolling sum).
  const sma: (number | null)[] = new Array(closes.length).fill(null);
  let sum = 0;
  for (let i = 0; i < closes.length; i++) {
    sum += closes[i]!;
    if (i >= period) sum -= closes[i - period]!;
    if (i >= period - 1) sma[i] = sum / period;
  }
  for (let i = 0; i < closes.length; i++) {
    const refIdx = i - shift;
    if (refIdx < 0) continue;
    const s = sma[refIdx];
    if (s === null || s === undefined) continue;
    out[i] = closes[i]! - s;
  }
  return out;
}
