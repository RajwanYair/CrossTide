/**
 * Garman-Klass and related intraday volatility estimators.
 * More efficient than close-to-close because they use OHLC data.
 */

export interface OHLCBar {
  readonly open: number;
  readonly high: number;
  readonly low: number;
  readonly close: number;
}

/**
 * Garman-Klass volatility estimator for a single bar.
 * Uses high, low, open, close to estimate variance more efficiently.
 */
export function garmanKlassSingle(bar: OHLCBar): number {
  const { open, high, low, close } = bar;
  if (open <= 0 || high <= 0 || low <= 0 || close <= 0) return 0;

  const u = Math.log(high / open);
  const d = Math.log(low / open);
  const c = Math.log(close / open);

  return 0.5 * (u - d) ** 2 - (2 * Math.LN2 - 1) * c ** 2;
}

/**
 * Garman-Klass annualized volatility over a series of OHLC bars.
 * @param bars OHLC price bars
 * @param annFactor Trading days per year (default 252)
 */
export function garmanKlassVol(bars: readonly OHLCBar[], annFactor = 252): number {
  if (bars.length === 0) return 0;

  let sum = 0;
  for (const bar of bars) {
    sum += garmanKlassSingle(bar);
  }
  const variance = sum / bars.length;
  return Math.sqrt(variance * annFactor);
}

/**
 * Parkinson volatility estimator (uses only high and low).
 * More efficient than close-to-close by factor of ~5.
 */
export function parkinsonVol(bars: readonly OHLCBar[], annFactor = 252): number {
  if (bars.length === 0) return 0;

  let sum = 0;
  for (const bar of bars) {
    if (bar.high <= 0 || bar.low <= 0) continue;
    const hl = Math.log(bar.high / bar.low);
    sum += hl * hl;
  }
  const variance = sum / (4 * bars.length * Math.LN2);
  return Math.sqrt(variance * annFactor);
}

/**
 * Rogers-Satchell volatility estimator (drift-independent).
 */
export function rogersSatchellVol(bars: readonly OHLCBar[], annFactor = 252): number {
  if (bars.length === 0) return 0;

  let sum = 0;
  for (const bar of bars) {
    const { open, high, low, close } = bar;
    if (open <= 0 || high <= 0 || low <= 0 || close <= 0) continue;
    const hc = Math.log(high / close);
    const ho = Math.log(high / open);
    const lc = Math.log(low / close);
    const lo = Math.log(low / open);
    sum += hc * ho + lc * lo;
  }
  const variance = sum / bars.length;
  return Math.sqrt(Math.max(0, variance) * annFactor);
}

/**
 * Yang-Zhang volatility estimator (handles overnight gaps).
 * Combines overnight, open-to-close, and Rogers-Satchell components.
 */
export function yangZhangVol(bars: readonly OHLCBar[], annFactor = 252): number {
  if (bars.length < 2) return 0;

  const n = bars.length;
  const k = 0.34 / (1.34 + (n + 1) / (n - 1));

  // Overnight variance (close-to-open)
  let overnightSum = 0;
  for (let i = 1; i < n; i++) {
    const o = Math.log(bars[i]!.open / bars[i - 1]!.close);
    overnightSum += o * o;
  }
  const overnightVar = overnightSum / (n - 1);

  // Open-to-close variance
  let ocSum = 0;
  for (const bar of bars) {
    if (bar.open <= 0 || bar.close <= 0) continue;
    const oc = Math.log(bar.close / bar.open);
    ocSum += oc * oc;
  }
  const openCloseVar = ocSum / (n - 1);

  // Rogers-Satchell variance
  let rsSum = 0;
  for (const bar of bars) {
    const { open, high, low, close } = bar;
    if (open <= 0 || high <= 0 || low <= 0 || close <= 0) continue;
    rsSum +=
      Math.log(high / close) * Math.log(high / open) + Math.log(low / close) * Math.log(low / open);
  }
  const rsVar = rsSum / n;

  const variance = overnightVar + k * openCloseVar + (1 - k) * rsVar;
  return Math.sqrt(Math.max(0, variance) * annFactor);
}

/**
 * Compare all estimators for the same data.
 */
export function compareEstimators(
  bars: readonly OHLCBar[],
  annFactor = 252,
): Record<string, number> {
  return {
    garmanKlass: garmanKlassVol(bars, annFactor),
    parkinson: parkinsonVol(bars, annFactor),
    rogersSatchell: rogersSatchellVol(bars, annFactor),
    yangZhang: yangZhangVol(bars, annFactor),
  };
}
