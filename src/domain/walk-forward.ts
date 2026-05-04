/**
 * Walk-forward analysis — out-of-sample backtest validation.
 * Splits data into in-sample (train) and out-of-sample (test) windows,
 * rolls forward, and aggregates out-of-sample performance.
 */

export interface WalkForwardWindow {
  readonly windowIndex: number;
  readonly inSampleStart: number;
  readonly inSampleEnd: number;
  readonly outOfSampleStart: number;
  readonly outOfSampleEnd: number;
  readonly inSampleReturn: number;
  readonly outOfSampleReturn: number;
}

export interface WalkForwardResult {
  readonly windows: readonly WalkForwardWindow[];
  readonly aggregateOosReturn: number;
  readonly avgOosReturn: number;
  readonly winRate: number;
  readonly degradation: number; // ratio of OOS to IS performance
}

/**
 * Simple strategy evaluator: buy-and-hold return over a slice.
 */
function sliceReturn(prices: readonly number[], start: number, end: number): number {
  if (start >= end || start < 0 || end > prices.length) return 0;
  const first = prices[start]!;
  const last = prices[end - 1]!;
  return first > 0 ? (last / first - 1) * 100 : 0;
}

/**
 * Run walk-forward analysis on a price series with a given strategy evaluator.
 *
 * @param prices Price series (daily closes)
 * @param inSampleSize Number of bars in each in-sample window
 * @param outOfSampleSize Number of bars in each out-of-sample window
 * @param stepSize How many bars to advance between windows (default = outOfSampleSize)
 * @param evaluator Custom strategy evaluator (default: buy-and-hold return)
 */
export function walkForward(
  prices: readonly number[],
  inSampleSize: number,
  outOfSampleSize: number,
  stepSize?: number,
  evaluator?: (prices: readonly number[], start: number, end: number) => number,
): WalkForwardResult {
  const step = stepSize ?? outOfSampleSize;
  const eval_ = evaluator ?? sliceReturn;
  const windows: WalkForwardWindow[] = [];

  let idx = 0;
  let windowIndex = 0;

  while (idx + inSampleSize + outOfSampleSize <= prices.length) {
    const isStart = idx;
    const isEnd = idx + inSampleSize;
    const oosStart = isEnd;
    const oosEnd = isEnd + outOfSampleSize;

    const isReturn = eval_(prices, isStart, isEnd);
    const oosReturn = eval_(prices, oosStart, oosEnd);

    windows.push({
      windowIndex,
      inSampleStart: isStart,
      inSampleEnd: isEnd,
      outOfSampleStart: oosStart,
      outOfSampleEnd: oosEnd,
      inSampleReturn: isReturn,
      outOfSampleReturn: oosReturn,
    });

    idx += step;
    windowIndex++;
  }

  if (windows.length === 0) {
    return { windows: [], aggregateOosReturn: 0, avgOosReturn: 0, winRate: 0, degradation: 0 };
  }

  const totalOos = windows.reduce((s, w) => s + w.outOfSampleReturn, 0);
  const totalIs = windows.reduce((s, w) => s + w.inSampleReturn, 0);
  const avgOos = totalOos / windows.length;
  const avgIs = totalIs / windows.length;
  const wins = windows.filter((w) => w.outOfSampleReturn > 0).length;

  return {
    windows,
    aggregateOosReturn: totalOos,
    avgOosReturn: avgOos,
    winRate: wins / windows.length,
    degradation: avgIs !== 0 ? avgOos / avgIs : 0,
  };
}

/**
 * Anchored walk-forward: in-sample grows (always starts at 0),
 * out-of-sample is fixed window rolling forward.
 */
export function anchoredWalkForward(
  prices: readonly number[],
  minInSample: number,
  outOfSampleSize: number,
  stepSize?: number,
  evaluator?: (prices: readonly number[], start: number, end: number) => number,
): WalkForwardResult {
  const step = stepSize ?? outOfSampleSize;
  const eval_ = evaluator ?? sliceReturn;
  const windows: WalkForwardWindow[] = [];

  let oosStart = minInSample;
  let windowIndex = 0;

  while (oosStart + outOfSampleSize <= prices.length) {
    const isReturn = eval_(prices, 0, oosStart);
    const oosReturn = eval_(prices, oosStart, oosStart + outOfSampleSize);

    windows.push({
      windowIndex,
      inSampleStart: 0,
      inSampleEnd: oosStart,
      outOfSampleStart: oosStart,
      outOfSampleEnd: oosStart + outOfSampleSize,
      inSampleReturn: isReturn,
      outOfSampleReturn: oosReturn,
    });

    oosStart += step;
    windowIndex++;
  }

  if (windows.length === 0) {
    return { windows: [], aggregateOosReturn: 0, avgOosReturn: 0, winRate: 0, degradation: 0 };
  }

  const totalOos = windows.reduce((s, w) => s + w.outOfSampleReturn, 0);
  const totalIs = windows.reduce((s, w) => s + w.inSampleReturn, 0);
  const avgOos = totalOos / windows.length;
  const avgIs = totalIs / windows.length;
  const wins = windows.filter((w) => w.outOfSampleReturn > 0).length;

  return {
    windows,
    aggregateOosReturn: totalOos,
    avgOosReturn: avgOos,
    winRate: wins / windows.length,
    degradation: avgIs !== 0 ? avgOos / avgIs : 0,
  };
}
