/**
 * Pearson correlation between aligned numeric series. Produces a
 * symmetric N×N matrix with 1.0 on the diagonal. Inputs that are not
 * the same length are truncated to the shortest.
 */

export interface CorrelationInput {
  readonly id: string;
  readonly values: readonly number[];
}

export interface CorrelationResult {
  readonly ids: readonly string[];
  /** matrix[i][j] = correlation between ids[i] and ids[j], in [-1, 1]. */
  readonly matrix: readonly (readonly number[])[];
}

export function pearson(a: readonly number[], b: readonly number[]): number {
  const n = Math.min(a.length, b.length);
  if (n < 2) return 0;
  let sumA = 0;
  let sumB = 0;
  for (let i = 0; i < n; i++) {
    sumA += a[i]!;
    sumB += b[i]!;
  }
  const meanA = sumA / n;
  const meanB = sumB / n;
  let num = 0;
  let denA = 0;
  let denB = 0;
  for (let i = 0; i < n; i++) {
    const da = a[i]! - meanA;
    const db = b[i]! - meanB;
    num += da * db;
    denA += da * da;
    denB += db * db;
  }
  const den = Math.sqrt(denA * denB);
  if (den === 0) return 0;
  const r = num / den;
  if (r > 1) return 1;
  if (r < -1) return -1;
  return r;
}

export function correlationMatrix(
  series: readonly CorrelationInput[],
): CorrelationResult {
  const ids = series.map((s) => s.id);
  const n = series.length;
  const matrix: number[][] = Array.from({ length: n }, () =>
    new Array<number>(n).fill(0),
  );
  for (let i = 0; i < n; i++) {
    matrix[i]![i] = 1;
    for (let j = i + 1; j < n; j++) {
      const r = pearson(series[i]!.values, series[j]!.values);
      matrix[i]![j] = r;
      matrix[j]![i] = r;
    }
  }
  return { ids, matrix };
}
