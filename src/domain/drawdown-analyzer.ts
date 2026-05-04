/**
 * Drawdown analyzer — compute peak-to-trough drawdowns from
 * an equity curve or price series for risk assessment.
 */

export interface DrawdownPeriod {
  readonly peakIndex: number;
  readonly troughIndex: number;
  readonly recoveryIndex: number | null; // null if not recovered
  readonly peakValue: number;
  readonly troughValue: number;
  readonly drawdownPercent: number;
  readonly duration: number; // bars from peak to trough
  readonly recoveryDuration: number | null; // bars from trough to recovery
}

export interface DrawdownSummary {
  readonly maxDrawdown: number;
  readonly avgDrawdown: number;
  readonly currentDrawdown: number;
  readonly drawdownCount: number;
  readonly longestDuration: number;
  readonly isInDrawdown: boolean;
}

/**
 * Calculate the drawdown series (% below running peak at each point).
 */
export function drawdownSeries(values: readonly number[]): number[] {
  const result: number[] = [];
  let peak = -Infinity;

  for (const v of values) {
    if (v > peak) peak = v;
    result.push(peak > 0 ? ((v - peak) / peak) * 100 : 0);
  }

  return result;
}

/**
 * Identify all drawdown periods from a value series.
 */
export function findDrawdownPeriods(
  values: readonly number[],
  minDrawdownPercent = 1,
): DrawdownPeriod[] {
  const periods: DrawdownPeriod[] = [];
  let peak = values[0] ?? 0;
  let peakIdx = 0;
  let trough = peak;
  let troughIdx = 0;
  let inDrawdown = false;

  for (let i = 1; i < values.length; i++) {
    const v = values[i]!;

    if (v >= peak) {
      // Recovery or new high
      if (inDrawdown) {
        const dd = peak > 0 ? ((trough - peak) / peak) * 100 : 0;
        if (Math.abs(dd) >= minDrawdownPercent) {
          periods.push({
            peakIndex: peakIdx,
            troughIndex: troughIdx,
            recoveryIndex: i,
            peakValue: peak,
            troughValue: trough,
            drawdownPercent: dd,
            duration: troughIdx - peakIdx,
            recoveryDuration: i - troughIdx,
          });
        }
        inDrawdown = false;
      }
      peak = v;
      peakIdx = i;
      trough = v;
      troughIdx = i;
    } else {
      inDrawdown = true;
      if (v < trough) {
        trough = v;
        troughIdx = i;
      }
    }
  }

  // Handle ongoing drawdown
  if (inDrawdown) {
    const dd = peak > 0 ? ((trough - peak) / peak) * 100 : 0;
    if (Math.abs(dd) >= minDrawdownPercent) {
      periods.push({
        peakIndex: peakIdx,
        troughIndex: troughIdx,
        recoveryIndex: null,
        peakValue: peak,
        troughValue: trough,
        drawdownPercent: dd,
        duration: troughIdx - peakIdx,
        recoveryDuration: null,
      });
    }
  }

  return periods;
}

/**
 * Get a summary of drawdown characteristics.
 */
export function drawdownSummary(values: readonly number[]): DrawdownSummary {
  const series = drawdownSeries(values);
  const periods = findDrawdownPeriods(values);

  const maxDrawdown = Math.min(...series);
  const currentDrawdown = series.length > 0 ? series[series.length - 1]! : 0;
  const isInDrawdown = currentDrawdown < 0;

  const avgDrawdown =
    periods.length > 0 ? periods.reduce((s, p) => s + p.drawdownPercent, 0) / periods.length : 0;

  const longestDuration = periods.length > 0 ? Math.max(...periods.map((p) => p.duration)) : 0;

  return {
    maxDrawdown,
    avgDrawdown,
    currentDrawdown,
    drawdownCount: periods.length,
    longestDuration,
    isInDrawdown,
  };
}

/**
 * Get the worst N drawdowns.
 */
export function worstDrawdowns(values: readonly number[], count = 5): DrawdownPeriod[] {
  const periods = findDrawdownPeriods(values);
  return periods.sort((a, b) => a.drawdownPercent - b.drawdownPercent).slice(0, count);
}

/**
 * Calculate time underwater (bars since last peak).
 */
export function timeUnderwater(values: readonly number[]): number {
  let peak = -Infinity;
  let peakIdx = 0;

  for (let i = 0; i < values.length; i++) {
    if (values[i]! >= peak) {
      peak = values[i]!;
      peakIdx = i;
    }
  }

  return values.length > 0 ? values.length - 1 - peakIdx : 0;
}
