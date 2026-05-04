/**
 * Realized volatility estimators — range-based and tick-based vol measures.
 * Parkinson, Rogers-Satchell, and Yang-Zhang estimators.
 * (Garman-Klass is in a separate module.)
 */

export interface OHLCBar {
  readonly open: number;
  readonly high: number;
  readonly low: number;
  readonly close: number;
}

export interface VolEstimates {
  readonly parkinson: number;
  readonly rogersSatchell: number;
  readonly yangZhang: number;
  readonly closeToClose: number; // standard close-to-close vol for reference
}

/**
 * Parkinson (1980) estimator — uses high-low range.
 * More efficient than close-to-close (5x for continuous Brownian motion).
 *
 * σ² = (1/4n·ln2) Σ(ln(H/L))²
 */
export function parkinsonVol(bars: readonly OHLCBar[]): number {
  const n = bars.length;
  if (n < 2) return 0;

  let sum = 0;
  for (const bar of bars) {
    if (bar.low <= 0 || bar.high <= 0) continue;
    const hl = Math.log(bar.high / bar.low);
    sum += hl * hl;
  }

  const variance = sum / (4 * n * Math.LN2);
  return Math.sqrt(variance);
}

/**
 * Rogers-Satchell (1991) — accounts for drift, uses OHLC.
 *
 * σ² = (1/n) Σ[ln(H/C)·ln(H/O) + ln(L/C)·ln(L/O)]
 */
export function rogersSatchellVol(bars: readonly OHLCBar[]): number {
  const n = bars.length;
  if (n < 2) return 0;

  let sum = 0;
  for (const bar of bars) {
    if (bar.open <= 0 || bar.high <= 0 || bar.low <= 0 || bar.close <= 0) continue;
    const hc = Math.log(bar.high / bar.close);
    const ho = Math.log(bar.high / bar.open);
    const lc = Math.log(bar.low / bar.close);
    const lo = Math.log(bar.low / bar.open);
    sum += hc * ho + lc * lo;
  }

  return Math.sqrt(Math.max(0, sum / n));
}

/**
 * Yang-Zhang (2000) — combines overnight, open-to-close, and Rogers-Satchell.
 * Most efficient for OHLC data; handles opening jumps.
 *
 * σ²_YZ = σ²_overnight + k·σ²_close + (1-k)·σ²_RS
 * where k = 0.34 / (1.34 + (n+1)/(n-1))
 */
export function yangZhangVol(bars: readonly OHLCBar[]): number {
  const n = bars.length;
  if (n < 3) return 0;

  // Overnight variance: (open_i - close_{i-1})
  const overnightReturns: number[] = [];
  for (let i = 1; i < n; i++) {
    if (bars[i]!.open <= 0 || bars[i - 1]!.close <= 0) continue;
    overnightReturns.push(Math.log(bars[i]!.open / bars[i - 1]!.close));
  }
  const sigmaOvernight = sampleVariance(overnightReturns);

  // Open-to-close variance
  const ocReturns: number[] = [];
  for (const bar of bars) {
    if (bar.open <= 0 || bar.close <= 0) continue;
    ocReturns.push(Math.log(bar.close / bar.open));
  }
  const sigmaClose = sampleVariance(ocReturns);

  // Rogers-Satchell
  const sigmaRS = rogersSatchellVol(bars) ** 2;

  // Combining weight
  const k = 0.34 / (1.34 + (n + 1) / (n - 1));

  const variance = sigmaOvernight + k * sigmaClose + (1 - k) * sigmaRS;
  return Math.sqrt(Math.max(0, variance));
}

/**
 * Standard close-to-close historical volatility.
 */
export function closeToCloseVol(bars: readonly OHLCBar[]): number {
  const n = bars.length;
  if (n < 3) return 0;

  const returns: number[] = [];
  for (let i = 1; i < n; i++) {
    if (bars[i]!.close <= 0 || bars[i - 1]!.close <= 0) continue;
    returns.push(Math.log(bars[i]!.close / bars[i - 1]!.close));
  }

  return Math.sqrt(sampleVariance(returns));
}

/**
 * Compute all volatility estimators for comparison.
 */
export function allVolEstimates(bars: readonly OHLCBar[]): VolEstimates {
  return {
    parkinson: parkinsonVol(bars),
    rogersSatchell: rogersSatchellVol(bars),
    yangZhang: yangZhangVol(bars),
    closeToClose: closeToCloseVol(bars),
  };
}

function sampleVariance(data: readonly number[]): number {
  const n = data.length;
  if (n < 2) return 0;
  const mean = data.reduce((s, v) => s + v, 0) / n;
  let ss = 0;
  for (const v of data) ss += (v - mean) ** 2;
  return ss / (n - 1);
}
