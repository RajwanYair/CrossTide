/**
 * Connors RSI (Larry Connors). Composite of three components:
 *   1. RSI(close, rsiPeriod)            — default 3
 *   2. RSI(streak, streakPeriod)        — default 2 (streak = consecutive
 *                                          up/down day count, signed)
 *   3. percentRank(ROC(close, 1), pctRankPeriod) — default 100
 * CRSI = average of the three. Values in [0, 100].
 */

const wilderRsi = (closes: readonly number[], period: number): (number | null)[] => {
  const out: (number | null)[] = new Array(closes.length).fill(null);
  if (period <= 0 || closes.length <= period) return out;
  let avgGain = 0;
  let avgLoss = 0;
  for (let i = 1; i <= period; i++) {
    const d = closes[i]! - closes[i - 1]!;
    if (d > 0) avgGain += d;
    else avgLoss += -d;
  }
  avgGain /= period;
  avgLoss /= period;
  out[period] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  for (let i = period + 1; i < closes.length; i++) {
    const d = closes[i]! - closes[i - 1]!;
    const g = d > 0 ? d : 0;
    const l = d < 0 ? -d : 0;
    avgGain = (avgGain * (period - 1) + g) / period;
    avgLoss = (avgLoss * (period - 1) + l) / period;
    out[i] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  }
  return out;
};

const computeStreak = (closes: readonly number[]): number[] => {
  const out: number[] = new Array(closes.length).fill(0);
  for (let i = 1; i < closes.length; i++) {
    const d = closes[i]! - closes[i - 1]!;
    const prev = out[i - 1]!;
    if (d > 0) out[i] = prev > 0 ? prev + 1 : 1;
    else if (d < 0) out[i] = prev < 0 ? prev - 1 : -1;
    else out[i] = 0;
  }
  return out;
};

const rollingPctRank = (values: readonly number[], window: number): (number | null)[] => {
  const out: (number | null)[] = new Array(values.length).fill(null);
  if (window <= 0) return out;
  for (let i = window - 1; i < values.length; i++) {
    const target = values[i]!;
    let count = 0;
    for (let j = i - window + 1; j < i; j++) if (values[j]! < target) count++;
    out[i] = (100 * count) / (window - 1 || 1);
  }
  return out;
};

export function computeConnorsRsi(
  closes: readonly number[],
  rsiPeriod = 3,
  streakPeriod = 2,
  pctRankPeriod = 100,
): (number | null)[] {
  if (rsiPeriod <= 0 || streakPeriod <= 0 || pctRankPeriod <= 0) {
    return new Array<number | null>(closes.length).fill(null);
  }
  const rsi = wilderRsi(closes, rsiPeriod);
  const streak = computeStreak(closes);
  const streakRsi = wilderRsi(streak, streakPeriod);
  const roc: number[] = new Array(closes.length).fill(0);
  for (let i = 1; i < closes.length; i++) {
    const prev = closes[i - 1]!;
    roc[i] = prev === 0 ? 0 : (100 * (closes[i]! - prev)) / prev;
  }
  const pr = rollingPctRank(roc, pctRankPeriod);

  const out: (number | null)[] = new Array(closes.length).fill(null);
  for (let i = 0; i < closes.length; i++) {
    const a = rsi[i];
    const b = streakRsi[i];
    const c = pr[i];
    if (
      a === null ||
      a === undefined ||
      b === null ||
      b === undefined ||
      c === null ||
      c === undefined
    )
      continue;
    out[i] = (a + b + c) / 3;
  }
  return out;
}
