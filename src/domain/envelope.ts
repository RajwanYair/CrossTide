/**
 * Moving Average Envelope. Symmetric upper/lower bands at a fixed
 * percentage above/below an SMA.
 *   middle = SMA(close, period)
 *   upper  = middle * (1 + percent/100)
 *   lower  = middle * (1 - percent/100)
 */

export interface EnvelopePoint {
  readonly index: number;
  readonly middle: number;
  readonly upper: number;
  readonly lower: number;
}

export function computeEnvelope(
  values: readonly number[],
  period = 20,
  percent = 2.5,
): EnvelopePoint[] {
  if (period <= 0 || percent < 0 || values.length < period) return [];
  const out: EnvelopePoint[] = [];
  let sum = 0;
  const factor = percent / 100;
  for (let i = 0; i < values.length; i++) {
    sum += values[i]!;
    if (i >= period) sum -= values[i - period]!;
    if (i < period - 1) continue;
    const middle = sum / period;
    out.push({
      index: i,
      middle,
      upper: middle * (1 + factor),
      lower: middle * (1 - factor),
    });
  }
  return out;
}
