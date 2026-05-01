/**
 * Rate of Change (ROC). Percentage form of momentum:
 *   ROC[i] = 100 * (close[i] - close[i - period]) / close[i - period]
 * Returns null when previous close is 0 (division by zero).
 */

export function computeRoc(values: readonly number[], period = 10): (number | null)[] {
  const out: (number | null)[] = new Array(values.length).fill(null);
  if (period <= 0) return out;
  for (let i = period; i < values.length; i++) {
    const prev = values[i - period]!;
    if (prev === 0) continue;
    out[i] = (100 * (values[i]! - prev)) / prev;
  }
  return out;
}
