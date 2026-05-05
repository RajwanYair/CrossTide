/**
 * Drawdown recovery analysis — estimate recovery patterns, speeds,
 * and probabilities from historical drawdown data.
 *
 * Pure functions: accept price series, return recovery analytics.
 * Complements drawdown-analyzer.ts which identifies drawdown periods.
 */

import { findDrawdownPeriods } from "./drawdown-analyzer.js";

/** Recovery statistics for a single drawdown event */
export interface RecoveryEvent {
  /** Drawdown depth as a fraction (e.g. 0.20 = 20% drawdown) */
  readonly drawdownPercent: number;
  /** Number of bars from peak to trough */
  readonly drawdownDuration: number;
  /** Number of bars from trough to recovery (null if not recovered) */
  readonly recoveryDuration: number | null;
  /** Ratio of recovery duration to drawdown duration (null if not recovered) */
  readonly recoveryRatio: number | null;
  /** Whether recovery was achieved */
  readonly recovered: boolean;
  /** Index of peak in original series */
  readonly peakIndex: number;
  /** Index of trough in original series */
  readonly troughIndex: number;
}

/** Aggregate recovery statistics across all drawdown events */
export interface RecoveryAnalysis {
  /** All individual recovery events */
  readonly events: readonly RecoveryEvent[];
  /** Total number of drawdown events */
  readonly totalEvents: number;
  /** Number of recovered drawdowns */
  readonly recoveredCount: number;
  /** Recovery rate as fraction (0–1) */
  readonly recoveryRate: number;
  /** Average bars to recover (recovered events only) */
  readonly avgRecoveryDuration: number | null;
  /** Median bars to recover (recovered events only) */
  readonly medianRecoveryDuration: number | null;
  /** Average recovery-to-drawdown ratio (recovered events only) */
  readonly avgRecoveryRatio: number | null;
  /** Fastest recovery (fewest bars to recover, or null) */
  readonly fastestRecovery: RecoveryEvent | null;
  /** Slowest recovery (most bars to recover, or null) */
  readonly slowestRecovery: RecoveryEvent | null;
  /** Largest unrecovered drawdown (or null) */
  readonly largestUnrecovered: RecoveryEvent | null;
}

/**
 * Analyze recovery patterns from a price/value series.
 *
 * @param values Close prices or portfolio values (chronological)
 * @param minDrawdownPercent Minimum drawdown depth to include (default: 0.05 = 5%)
 * @returns Recovery analysis or null if no drawdowns found
 */
export function analyzeRecoveries(
  values: readonly number[],
  minDrawdownPercent: number = 0.05,
): RecoveryAnalysis | null {
  if (values.length < 2) return null;

  const periods = findDrawdownPeriods(values, minDrawdownPercent * 100);
  if (periods.length === 0) return null;

  const events: RecoveryEvent[] = periods.map((p) => ({
    drawdownPercent: p.drawdownPercent / 100,
    drawdownDuration: p.troughIndex - p.peakIndex,
    recoveryDuration: p.recoveryDuration ?? null,
    recoveryRatio:
      p.recoveryDuration !== null && p.troughIndex > p.peakIndex
        ? p.recoveryDuration / (p.troughIndex - p.peakIndex)
        : null,
    recovered: p.recoveryIndex !== null,
    peakIndex: p.peakIndex,
    troughIndex: p.troughIndex,
  }));

  const recovered = events.filter((e) => e.recovered);
  const unrecovered = events.filter((e) => !e.recovered);

  const recoveredDurations = recovered.map((e) => e.recoveryDuration!).sort((a, b) => a - b);

  const recoveryRatios = recovered.map((e) => e.recoveryRatio!).filter((r) => Number.isFinite(r));

  return {
    events,
    totalEvents: events.length,
    recoveredCount: recovered.length,
    recoveryRate: events.length > 0 ? recovered.length / events.length : 0,
    avgRecoveryDuration:
      recoveredDurations.length > 0
        ? recoveredDurations.reduce((a, b) => a + b, 0) / recoveredDurations.length
        : null,
    medianRecoveryDuration: computeMedian(recoveredDurations),
    avgRecoveryRatio:
      recoveryRatios.length > 0
        ? recoveryRatios.reduce((a, b) => a + b, 0) / recoveryRatios.length
        : null,
    fastestRecovery:
      recovered.length > 0
        ? recovered.reduce((min, e) => (e.recoveryDuration! < min.recoveryDuration! ? e : min))
        : null,
    slowestRecovery:
      recovered.length > 0
        ? recovered.reduce((max, e) => (e.recoveryDuration! > max.recoveryDuration! ? e : max))
        : null,
    largestUnrecovered:
      unrecovered.length > 0
        ? unrecovered.reduce((max, e) => (e.drawdownPercent > max.drawdownPercent ? e : max))
        : null,
  };
}

/**
 * Estimate expected recovery time for a given drawdown depth,
 * based on historical recovery patterns.
 *
 * @param values Historical price/value series
 * @param currentDrawdownPercent Current drawdown depth as fraction (e.g. 0.15 = 15%)
 * @param minDrawdownPercent Minimum threshold for historical reference (default: 0.05)
 * @returns Estimated bars to recover, or null if insufficient data
 */
export function estimateRecoveryTime(
  values: readonly number[],
  currentDrawdownPercent: number,
  minDrawdownPercent: number = 0.05,
): number | null {
  const analysis = analyzeRecoveries(values, minDrawdownPercent);
  if (!analysis || analysis.recoveredCount === 0) return null;

  // Find recovered events with similar or deeper drawdowns
  const similar = analysis.events.filter(
    (e) => e.recovered && e.drawdownPercent >= currentDrawdownPercent * 0.5,
  );

  if (similar.length === 0) return null;

  const durations = similar.map((e) => e.recoveryDuration!);
  return durations.reduce((a, b) => a + b, 0) / durations.length;
}

function computeMedian(sorted: readonly number[]): number | null {
  if (sorted.length === 0) return null;
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1]! + sorted[mid]!) / 2;
  }
  return sorted[mid]!;
}
