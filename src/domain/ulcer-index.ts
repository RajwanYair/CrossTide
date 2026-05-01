/**
 * Ulcer Index (Peter Martin, 1987). Measures depth and duration of
 * drawdowns over a window:
 *   pctDD[i] = 100 * (close[i] - max(close, period)) / max(close, period)
 *   UI       = sqrt( mean(pctDD^2, period) )
 * Higher = more painful drawdowns.
 */

export function computeUlcerIndex(closes: readonly number[], period = 14): number[] {
  if (period <= 0 || closes.length < period) return [];
  const out: number[] = [];
  for (let i = period - 1; i < closes.length; i++) {
    let max = closes[i - period + 1]!;
    for (let j = i - period + 2; j <= i; j++) {
      if (closes[j]! > max) max = closes[j]!;
    }
    let sumSq = 0;
    for (let j = i - period + 1; j <= i; j++) {
      const dd = max === 0 ? 0 : (100 * (closes[j]! - max)) / max;
      sumSq += dd * dd;
    }
    out.push(Math.sqrt(sumSq / period));
  }
  return out;
}
