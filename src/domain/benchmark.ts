/**
 * Benchmark comparison helpers — compute the normalized "performance
 * vs benchmark" overlay used in Portfolio and Chart cards. Pure math.
 *
 * Both series are rebased to 100 at the first overlapping timestamp so
 * a "vs SPY" overlay reads as percent return since the start.
 */

export interface SeriesPoint {
  readonly timestamp: number;
  readonly value: number;
}

export interface RelativePoint {
  readonly timestamp: number;
  readonly subject: number;
  readonly benchmark: number;
  /** Subject - benchmark, in percent (rebased = 100). */
  readonly excessPct: number;
}

/** Rebase a series so the first point equals 100. */
export function rebaseToHundred(series: readonly SeriesPoint[]): SeriesPoint[] {
  if (series.length === 0) return [];
  const first = series[0]!;
  if (first.value === 0) return series.map((p) => ({ ...p, value: 0 }));
  return series.map((p) => ({
    timestamp: p.timestamp,
    value: (p.value / first.value) * 100,
  }));
}

/**
 * Align two series on shared timestamps and produce a per-bar
 * comparison. Both inputs must be sorted ascending by timestamp.
 */
export function compareToBenchmark(
  subject: readonly SeriesPoint[],
  benchmark: readonly SeriesPoint[],
): RelativePoint[] {
  const benchMap = new Map<number, number>();
  for (const p of benchmark) benchMap.set(p.timestamp, p.value);

  const aligned: { timestamp: number; subject: number; benchmark: number }[] = [];
  for (const s of subject) {
    const b = benchMap.get(s.timestamp);
    if (b !== undefined && Number.isFinite(b)) {
      aligned.push({ timestamp: s.timestamp, subject: s.value, benchmark: b });
    }
  }
  if (aligned.length === 0) return [];
  const baseSubject = aligned[0]!.subject;
  const baseBench = aligned[0]!.benchmark;
  return aligned.map((p) => {
    const sub = baseSubject === 0 ? 0 : (p.subject / baseSubject) * 100;
    const bench = baseBench === 0 ? 0 : (p.benchmark / baseBench) * 100;
    return {
      timestamp: p.timestamp,
      subject: sub,
      benchmark: bench,
      excessPct: sub - bench,
    };
  });
}

/**
 * Beta of subject returns vs benchmark returns (covariance / variance).
 * Returns 0 when inputs are too short or benchmark variance is 0.
 */
export function beta(
  subjectReturns: readonly number[],
  benchmarkReturns: readonly number[],
): number {
  const n = Math.min(subjectReturns.length, benchmarkReturns.length);
  if (n < 2) return 0;
  let sumS = 0;
  let sumB = 0;
  for (let i = 0; i < n; i++) {
    sumS += subjectReturns[i]!;
    sumB += benchmarkReturns[i]!;
  }
  const meanS = sumS / n;
  const meanB = sumB / n;
  let cov = 0;
  let varB = 0;
  for (let i = 0; i < n; i++) {
    const dS = subjectReturns[i]! - meanS;
    const dB = benchmarkReturns[i]! - meanB;
    cov += dS * dB;
    varB += dB * dB;
  }
  if (varB === 0) return 0;
  return cov / varB;
}
