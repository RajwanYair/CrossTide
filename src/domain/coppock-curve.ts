/**
 * Coppock Curve (Edwin Coppock, 1962). Long-term momentum:
 *   coppock = WMA( ROC(close, longRoc) + ROC(close, shortRoc), wmaPeriod )
 * Defaults: longRoc=14, shortRoc=11, wmaPeriod=10 (monthly bars).
 * Crossing above zero is a bullish long-term signal.
 */

const roc = (closes: readonly number[], period: number): (number | null)[] => {
  const out: (number | null)[] = new Array(closes.length).fill(null);
  for (let i = period; i < closes.length; i++) {
    const past = closes[i - period]!;
    if (past === 0) continue;
    out[i] = (100 * (closes[i]! - past)) / past;
  }
  return out;
};

const wma = (values: readonly (number | null)[], period: number): (number | null)[] => {
  const out: (number | null)[] = new Array(values.length).fill(null);
  const denom = (period * (period + 1)) / 2;
  for (let i = period - 1; i < values.length; i++) {
    let sum = 0;
    let ok = true;
    for (let j = 0; j < period; j++) {
      const v = values[i - period + 1 + j];
      if (v === null || v === undefined) {
        ok = false;
        break;
      }
      sum += v * (j + 1);
    }
    if (ok) out[i] = sum / denom;
  }
  return out;
};

export function computeCoppockCurve(
  closes: readonly number[],
  longRoc = 14,
  shortRoc = 11,
  wmaPeriod = 10,
): (number | null)[] {
  if (longRoc <= 0 || shortRoc <= 0 || wmaPeriod <= 0) return [];
  const r1 = roc(closes, longRoc);
  const r2 = roc(closes, shortRoc);
  const sum: (number | null)[] = closes.map((_, i) => {
    const a = r1[i];
    const b = r2[i];
    return a === null || a === undefined || b === null || b === undefined ? null : a + b;
  });
  return wma(sum, wmaPeriod);
}
