/**
 * Stochastic RSI (Chande & Kroll). Applies the stochastic oscillator
 * formula to the RSI series rather than to price:
 *   RSI(period)
 *   StochRSI = (RSI - min(RSI, stochPeriod)) / (max - min)
 *   %K = SMA(StochRSI*100, kSmooth)
 *   %D = SMA(%K, dSmooth)
 * Returns values in [0, 100].
 */

export interface StochRsiOptions {
  readonly rsiPeriod?: number;
  readonly stochPeriod?: number;
  readonly kSmooth?: number;
  readonly dSmooth?: number;
}

export interface StochRsiPoint {
  readonly index: number;
  readonly k: number;
  readonly d: number | null;
}

const wilderRsi = (closes: readonly number[], period: number): (number | null)[] => {
  const out: (number | null)[] = new Array(closes.length).fill(null);
  if (closes.length <= period) return out;
  let gain = 0;
  let loss = 0;
  for (let i = 1; i <= period; i++) {
    const diff = closes[i]! - closes[i - 1]!;
    if (diff >= 0) gain += diff;
    else loss -= diff;
  }
  let avgGain = gain / period;
  let avgLoss = loss / period;
  out[period] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  for (let i = period + 1; i < closes.length; i++) {
    const diff = closes[i]! - closes[i - 1]!;
    const g = diff > 0 ? diff : 0;
    const l = diff < 0 ? -diff : 0;
    avgGain = (avgGain * (period - 1) + g) / period;
    avgLoss = (avgLoss * (period - 1) + l) / period;
    out[i] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  }
  return out;
};

export function computeStochRsi(
  closes: readonly number[],
  options: StochRsiOptions = {},
): StochRsiPoint[] {
  const rsiPeriod = options.rsiPeriod ?? 14;
  const stochPeriod = options.stochPeriod ?? 14;
  const kSmooth = options.kSmooth ?? 3;
  const dSmooth = options.dSmooth ?? 3;
  if (rsiPeriod <= 0 || stochPeriod <= 0 || kSmooth <= 0 || dSmooth <= 0) return [];

  const rsi = wilderRsi(closes, rsiPeriod);
  // Raw stochRSI*100 series (nullable)
  const raw: (number | null)[] = new Array(closes.length).fill(null);
  for (let i = 0; i < closes.length; i++) {
    if (i < rsiPeriod + stochPeriod - 1) continue;
    let mn = Infinity;
    let mx = -Infinity;
    let ok = true;
    for (let j = i - stochPeriod + 1; j <= i; j++) {
      const r = rsi[j];
      if (r === null || r === undefined) {
        ok = false;
        break;
      }
      if (r < mn) mn = r;
      if (r > mx) mx = r;
    }
    if (!ok) continue;
    const cur = rsi[i]!;
    const range = mx - mn;
    raw[i] = range === 0 ? 0 : ((cur - mn) / range) * 100;
  }
  // %K = SMA(raw, kSmooth)
  const k: (number | null)[] = new Array(closes.length).fill(null);
  for (let i = 0; i < closes.length; i++) {
    let sum = 0;
    let ok = true;
    for (let j = i - kSmooth + 1; j <= i; j++) {
      if (j < 0) { ok = false; break; }
      const v = raw[j];
      if (v === null || v === undefined) { ok = false; break; }
      sum += v;
    }
    if (ok) k[i] = sum / kSmooth;
  }
  // %D = SMA(k, dSmooth)
  const d: (number | null)[] = new Array(closes.length).fill(null);
  for (let i = 0; i < closes.length; i++) {
    let sum = 0;
    let ok = true;
    for (let j = i - dSmooth + 1; j <= i; j++) {
      if (j < 0) { ok = false; break; }
      const v = k[j];
      if (v === null || v === undefined) { ok = false; break; }
      sum += v;
    }
    if (ok) d[i] = sum / dSmooth;
  }
  const out: StochRsiPoint[] = [];
  for (let i = 0; i < closes.length; i++) {
    const kv = k[i];
    if (kv === null || kv === undefined) continue;
    out.push({ index: i, k: kv, d: d[i] ?? null });
  }
  return out;
}
