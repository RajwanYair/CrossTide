/**
 * Heikin-Ashi candle transform. Smooths price action by replacing each
 * OHLC bar with a derived bar:
 *   HA close  = (O + H + L + C) / 4
 *   HA open   = (prev HA open + prev HA close) / 2  (seed = (O0 + C0) / 2)
 *   HA high   = max(H, HA open, HA close)
 *   HA low    = min(L, HA open, HA close)
 *
 * Pure transform, no time series alignment beyond the input order.
 */

export interface Candle {
  readonly time: number;
  readonly open: number;
  readonly high: number;
  readonly low: number;
  readonly close: number;
  readonly volume?: number;
}

export interface HeikinAshiCandle extends Candle {
  readonly haOpen: number;
  readonly haHigh: number;
  readonly haLow: number;
  readonly haClose: number;
}

export function heikinAshi(candles: readonly Candle[]): HeikinAshiCandle[] {
  const out: HeikinAshiCandle[] = [];
  let prevHaOpen = 0;
  let prevHaClose = 0;
  for (let i = 0; i < candles.length; i++) {
    const c = candles[i]!;
    const haClose = (c.open + c.high + c.low + c.close) / 4;
    const haOpen = i === 0 ? (c.open + c.close) / 2 : (prevHaOpen + prevHaClose) / 2;
    const haHigh = Math.max(c.high, haOpen, haClose);
    const haLow = Math.min(c.low, haOpen, haClose);
    out.push({ ...c, haOpen, haHigh, haLow, haClose });
    prevHaOpen = haOpen;
    prevHaClose = haClose;
  }
  return out;
}
