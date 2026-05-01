/**
 * Klinger Volume Oscillator (KVO). Stephen Klinger's volume-based momentum
 * indicator. Computes signed "volume force" and takes the difference of
 * a fast and slow EMA of it. A signal-line EMA can be derived externally.
 *
 *   trend = sign((H+L+C) - prev(H+L+C))
 *   vf    = volume * trend * 100
 *   KVO   = EMA(vf, fast) - EMA(vf, slow)
 */

import type { Candle } from "./heikin-ashi";

export interface KlingerOptions {
  readonly fast?: number;
  readonly slow?: number;
}

export interface VolumeCandle extends Candle {
  readonly volume: number;
}

export function computeKlingerOscillator(
  candles: readonly VolumeCandle[],
  opts: KlingerOptions = {},
): Array<number | null> {
  const fast = opts.fast ?? 34;
  const slow = opts.slow ?? 55;
  const n = candles.length;
  const out: Array<number | null> = new Array(n).fill(null);
  if (n < 2) return out;

  const vf: number[] = new Array(n).fill(0);
  let prevHlc = candles[0]!.high + candles[0]!.low + candles[0]!.close;
  for (let i = 1; i < n; i++) {
    const c = candles[i]!;
    const hlc = c.high + c.low + c.close;
    const trend = hlc > prevHlc ? 1 : hlc < prevHlc ? -1 : 0;
    vf[i] = c.volume * trend * 100;
    prevHlc = hlc;
  }

  const ema = (period: number): Array<number | null> => {
    const k = 2 / (period + 1);
    const r: Array<number | null> = new Array(n).fill(null);
    let prev = vf[1]!;
    r[1] = prev;
    for (let i = 2; i < n; i++) {
      prev = vf[i]! * k + prev * (1 - k);
      r[i] = prev;
    }
    return r;
  };

  const ef = ema(fast);
  const es = ema(slow);
  for (let i = 0; i < n; i++) {
    if (ef[i] !== null && es[i] !== null) out[i] = ef[i]! - es[i]!;
  }
  return out;
}
