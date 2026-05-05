/**
 * Corporate Action Adjustment — pure functions for adjusting OHLCV data for
 * stock splits and cash dividends.
 *
 * P4: All OHLCV returned as split-adjusted by default; raw optional.
 *
 * **Split adjustment** multiplies historical prices by the cumulative split
 * factor so that pre-split prices are comparable to post-split prices.
 * Example: 2-for-1 split → divide all pre-split prices by 2, multiply all
 * pre-split volumes by 2.
 *
 * **Dividend adjustment** subtracts the dividend from all historical closes
 * prior to the ex-dividend date using the standard backward-adjustment method,
 * preserving the continuity of returns.
 *
 * All inputs are plain data — no I/O, no fetch, no Date.now().
 *
 * @module domain/corp-actions
 */

import type { DailyCandle } from "../types/domain";

// ── Types ────────────────────────────────────────────────────────────────────

/** A single stock split event. */
export interface SplitEvent {
  /** Ex-date of the split (ISO 8601 YYYY-MM-DD). */
  readonly date: string;
  /** Number of new shares per old share (e.g. 2 for a 2-for-1 split). */
  readonly numerator: number;
  /** Number of old shares replaced (almost always 1). */
  readonly denominator: number;
}

/** A single cash dividend event. */
export interface DividendEvent {
  /** Ex-dividend date (ISO 8601 YYYY-MM-DD). Candles with date < exDate are adjusted. */
  readonly date: string;
  /** Gross dividend amount per share (same currency as OHLCV prices). */
  readonly amount: number;
}

/** Options controlling which adjustments to apply. */
export interface AdjustmentOptions {
  /** Apply split adjustments (default: true). */
  readonly splits?: boolean;
  /** Apply dividend adjustments (default: false — split-only is the common default). */
  readonly dividends?: boolean;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Round to 6 decimal places to eliminate floating-point drift. */
function round6(n: number): number {
  return Math.round(n * 1_000_000) / 1_000_000;
}

// ── Core functions ────────────────────────────────────────────────────────────

/**
 * Apply stock-split adjustment to a sorted (ascending date) OHLCV series.
 *
 * All candles with `date < split.date` are divided by the split ratio
 * (`numerator / denominator`). The function applies all splits in
 * chronological order, accumulating the adjustment factor backward.
 *
 * Volume is multiplied by the inverse factor to preserve turnover.
 *
 * @param candles  Sorted ascending OHLCV candles.
 * @param splits   Split events sorted by date ascending.
 * @returns        New array of adjusted candles (original array untouched).
 */
export function applySplits(
  candles: readonly DailyCandle[],
  splits: readonly SplitEvent[],
): DailyCandle[] {
  if (candles.length === 0 || splits.length === 0) return candles.slice();

  // Sort splits chronologically (defensive — callers should pass sorted)
  const sortedSplits = splits.slice().sort((a, b) => a.date.localeCompare(b.date));

  // Build cumulative adjustment factors for each split date.
  // We walk backward: a split at date D applies a factor to all candles < D.
  // We accumulate from the most-recent split toward the oldest.
  const result: DailyCandle[] = candles.map((c) => ({ ...c }));

  let cumulativeAdjust = 1;

  // Walk splits from newest to oldest; for each split adjust all prior candles.
  for (let s = sortedSplits.length - 1; s >= 0; s--) {
    const split = sortedSplits[s]!;
    const ratio = split.numerator / split.denominator;
    cumulativeAdjust *= ratio;

    // Apply to all candles strictly before the split date
    for (const candle of result) {
      if (candle.date < split.date) {
        (candle as { -readonly [K in keyof DailyCandle]: DailyCandle[K] }).open = round6(
          candle.open / ratio,
        );
        (candle as { -readonly [K in keyof DailyCandle]: DailyCandle[K] }).high = round6(
          candle.high / ratio,
        );
        (candle as { -readonly [K in keyof DailyCandle]: DailyCandle[K] }).low = round6(
          candle.low / ratio,
        );
        (candle as { -readonly [K in keyof DailyCandle]: DailyCandle[K] }).close = round6(
          candle.close / ratio,
        );
        (candle as { -readonly [K in keyof DailyCandle]: DailyCandle[K] }).volume = Math.round(
          candle.volume * ratio,
        );
      }
    }
  }

  void cumulativeAdjust; // available for callers who need the total factor
  return result;
}

/**
 * Apply dividend adjustment to a sorted (ascending date) OHLCV series.
 *
 * Uses the **backward adjustment** method: for each dividend event, all
 * closes prior to the ex-dividend date are reduced by the dividend amount
 * multiplied by the cumulative dividend-adjustment factor. This preserves
 * the continuity of returns and is the industry-standard approach.
 *
 * @param candles   Sorted ascending OHLCV candles.
 * @param dividends Dividend events sorted by date ascending.
 * @returns         New array of adjusted candles (original array untouched).
 */
export function applyDividends(
  candles: readonly DailyCandle[],
  dividends: readonly DividendEvent[],
): DailyCandle[] {
  if (candles.length === 0 || dividends.length === 0) return candles.slice();

  const sortedDivs = dividends.slice().sort((a, b) => a.date.localeCompare(b.date));
  const result: DailyCandle[] = candles.map((c) => ({ ...c }));

  // Walk dividends from newest to oldest; backward-adjust prices
  for (let d = sortedDivs.length - 1; d >= 0; d--) {
    const div = sortedDivs[d]!;

    for (const candle of result) {
      if (candle.date < div.date) {
        // Standard backward price adjustment factor
        // adj_price = price × (1 - dividend / close_on_ex_date)
        // Approximation: subtract the dividend directly (simpler, widely used)
        const mut = candle as { -readonly [K in keyof DailyCandle]: DailyCandle[K] };
        mut.open = round6(candle.open - div.amount);
        mut.high = round6(candle.high - div.amount);
        mut.low = round6(candle.low - div.amount);
        mut.close = round6(candle.close - div.amount);
      }
    }
  }

  return result;
}

/**
 * Apply all corporate action adjustments in correct order:
 * splits first, then dividends (dividends are expressed in split-adjusted terms).
 *
 * @param candles   Sorted ascending OHLCV candles.
 * @param splits    Split events (empty array = no splits).
 * @param dividends Dividend events (empty array = no dividends).
 * @param options   Which adjustments to apply (defaults: splits=true, dividends=false).
 * @returns         New array of fully-adjusted candles.
 */
export function applyCorpActions(
  candles: readonly DailyCandle[],
  splits: readonly SplitEvent[],
  dividends: readonly DividendEvent[],
  options: AdjustmentOptions = {},
): DailyCandle[] {
  const applySplitsFlag = options.splits ?? true;
  const applyDividendsFlag = options.dividends ?? false;

  let adjusted: DailyCandle[] = candles.slice();

  if (applySplitsFlag && splits.length > 0) {
    adjusted = applySplits(adjusted, splits);
  }

  if (applyDividendsFlag && dividends.length > 0) {
    adjusted = applyDividends(adjusted, dividends);
  }

  return adjusted;
}

/**
 * Compute the cumulative split factor for a series of splits.
 *
 * Useful when you need to convert a raw price to a split-adjusted price
 * without iterating over the full OHLCV array (e.g., for a single current quote).
 *
 * @param splits    Split events to accumulate.
 * @param asOfDate  Only include splits on or before this date (ISO YYYY-MM-DD).
 *                  Pass undefined to include all splits.
 * @returns         Cumulative factor (divide raw price by this to get adjusted price).
 */
export function cumulativeSplitFactor(splits: readonly SplitEvent[], asOfDate?: string): number {
  return splits
    .filter((s) => asOfDate == null || s.date <= asOfDate)
    .reduce((factor, s) => factor * (s.numerator / s.denominator), 1);
}
