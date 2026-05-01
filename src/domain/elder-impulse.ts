/**
 * Elder Impulse System (Alexander Elder, "Come Into My Trading Room").
 * Combines EMA slope and MACD histogram slope into a discrete signal:
 *   - GREEN  = EMA slope rising AND MACD histogram rising
 *   - RED    = EMA slope falling AND MACD histogram falling
 *   - BLUE   = anything else (mixed)
 * Returns nulls until both EMA(13) and MACD histogram are defined for two
 * consecutive bars.
 */

export type Impulse = "GREEN" | "RED" | "BLUE";

export interface ElderImpulseOptions {
  readonly emaPeriod?: number;
  readonly macdFast?: number;
  readonly macdSlow?: number;
  readonly macdSignal?: number;
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

const emaOfNullable = (values: readonly (number | null)[], period: number): (number | null)[] => {
  const out: (number | null)[] = new Array(values.length).fill(null);
  let firstIdx = -1;
  for (let i = 0; i < values.length; i++) if (values[i] !== null) { firstIdx = i; break; }
  if (firstIdx < 0) return out;
  const dense: number[] = [];
  for (let i = firstIdx; i < values.length; i++) dense.push(values[i] as number);
  const ed = ema(dense, period);
  for (let j = 0; j < ed.length; j++) out[firstIdx + j] = ed[j] ?? null;
  return out;
};

export function computeElderImpulse(
  closes: readonly number[],
  options: ElderImpulseOptions = {},
): (Impulse | null)[] {
  const emaPeriod = options.emaPeriod ?? 13;
  const fast = options.macdFast ?? 12;
  const slow = options.macdSlow ?? 26;
  const sig = options.macdSignal ?? 9;
  const out: (Impulse | null)[] = new Array(closes.length).fill(null);
  if (emaPeriod <= 0 || fast <= 0 || slow <= 0 || sig <= 0) return out;

  const ema13 = ema(closes, emaPeriod);
  const eFast = ema(closes, fast);
  const eSlow = ema(closes, slow);
  const macd: (number | null)[] = closes.map((_, i) => {
    const f = eFast[i];
    const s = eSlow[i];
    if (f === null || f === undefined || s === null || s === undefined) return null;
    return f - s;
  });
  const signal = emaOfNullable(macd, sig);
  const hist: (number | null)[] = closes.map((_, i) => {
    const m = macd[i];
    const s = signal[i];
    if (m === null || m === undefined || s === null || s === undefined) return null;
    return m - s;
  });

  for (let i = 1; i < closes.length; i++) {
    const e0 = ema13[i - 1];
    const e1 = ema13[i];
    const h0 = hist[i - 1];
    const h1 = hist[i];
    if (e0 === null || e0 === undefined || e1 === null || e1 === undefined ||
        h0 === null || h0 === undefined || h1 === null || h1 === undefined) continue;
    const emaUp = e1 > e0;
    const emaDown = e1 < e0;
    const histUp = h1 > h0;
    const histDown = h1 < h0;
    if (emaUp && histUp) out[i] = "GREEN";
    else if (emaDown && histDown) out[i] = "RED";
    else out[i] = "BLUE";
  }
  return out;
}
