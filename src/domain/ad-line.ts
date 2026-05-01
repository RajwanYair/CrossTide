/**
 * Accumulation/Distribution Line (Marc Chaikin). Cumulative volume-weighted
 * money-flow indicator:
 *   MFM    = ((close - low) - (high - close)) / (high - low)   (0 if h===l)
 *   MFV    = MFM * volume
 *   AD[i]  = AD[i-1] + MFV[i]   with AD[-1] = 0
 */

export interface AdCandle {
  readonly high: number;
  readonly low: number;
  readonly close: number;
  readonly volume: number;
}

export function computeAdLine(candles: readonly AdCandle[]): number[] {
  const out: number[] = new Array(candles.length).fill(0);
  let acc = 0;
  for (let i = 0; i < candles.length; i++) {
    const c = candles[i]!;
    const range = c.high - c.low;
    const mfm = range === 0 ? 0 : (c.close - c.low - (c.high - c.close)) / range;
    acc += mfm * c.volume;
    out[i] = acc;
  }
  return out;
}
