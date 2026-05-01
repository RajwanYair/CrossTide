/**
 * Know Sure Thing (Martin Pring, 1992). Smoothed weighted sum of four
 * rate-of-change values:
 *   ROC1 = SMA(ROC(close, 10), 10)
 *   ROC2 = SMA(ROC(close, 15), 10)
 *   ROC3 = SMA(ROC(close, 20), 10)
 *   ROC4 = SMA(ROC(close, 30), 15)
 *   KST  = ROC1*1 + ROC2*2 + ROC3*3 + ROC4*4
 *   signal = SMA(KST, 9)
 */

export interface KstOptions {
  readonly roc1?: number;
  readonly roc2?: number;
  readonly roc3?: number;
  readonly roc4?: number;
  readonly sma1?: number;
  readonly sma2?: number;
  readonly sma3?: number;
  readonly sma4?: number;
  readonly signal?: number;
}

export interface KstPoint {
  readonly index: number;
  readonly kst: number;
  readonly signal: number | null;
}

const roc = (closes: readonly number[], period: number): (number | null)[] => {
  const out: (number | null)[] = new Array(closes.length).fill(null);
  for (let i = period; i < closes.length; i++) {
    const past = closes[i - period]!;
    if (past === 0) continue;
    out[i] = (100 * (closes[i]! - past)) / past;
  }
  return out;
};

const smaOfNullable = (values: readonly (number | null)[], period: number): (number | null)[] => {
  const out: (number | null)[] = new Array(values.length).fill(null);
  for (let i = period - 1; i < values.length; i++) {
    let sum = 0;
    let ok = true;
    for (let j = i - period + 1; j <= i; j++) {
      const v = values[j];
      if (v === null || v === undefined) {
        ok = false;
        break;
      }
      sum += v;
    }
    if (ok) out[i] = sum / period;
  }
  return out;
};

export function computeKst(closes: readonly number[], options: KstOptions = {}): KstPoint[] {
  const r1 = options.roc1 ?? 10;
  const r2 = options.roc2 ?? 15;
  const r3 = options.roc3 ?? 20;
  const r4 = options.roc4 ?? 30;
  const s1 = options.sma1 ?? 10;
  const s2 = options.sma2 ?? 10;
  const s3 = options.sma3 ?? 10;
  const s4 = options.sma4 ?? 15;
  const sig = options.signal ?? 9;

  const c1 = smaOfNullable(roc(closes, r1), s1);
  const c2 = smaOfNullable(roc(closes, r2), s2);
  const c3 = smaOfNullable(roc(closes, r3), s3);
  const c4 = smaOfNullable(roc(closes, r4), s4);

  const kst: (number | null)[] = closes.map((_, i) => {
    const a = c1[i];
    const b = c2[i];
    const cc = c3[i];
    const d = c4[i];
    if (
      a === null ||
      a === undefined ||
      b === null ||
      b === undefined ||
      cc === null ||
      cc === undefined ||
      d === null ||
      d === undefined
    )
      return null;
    return a * 1 + b * 2 + cc * 3 + d * 4;
  });
  const signal = smaOfNullable(kst, sig);

  const out: KstPoint[] = [];
  for (let i = 0; i < closes.length; i++) {
    const k = kst[i];
    if (k === null || k === undefined) continue;
    out.push({ index: i, kst: k, signal: signal[i] ?? null });
  }
  return out;
}
