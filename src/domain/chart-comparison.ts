/**
 * Chart comparison — normalizes multiple ticker candle series to percentage
 * change from their respective starting prices.
 *
 * Used by the comparison card to overlay multiple tickers on one chart
 * with a common Y-axis (% return from base).
 */
import type { DailyCandle } from "../types/domain";

/** A single point in a normalized comparison series. */
export interface ComparisonPoint {
  readonly date: string;
  readonly pctChange: number; // e.g. 0.05 = +5%
}

/** A full normalized series for one ticker. */
export interface ComparisonSeries {
  readonly ticker: string;
  readonly points: readonly ComparisonPoint[];
}

/**
 * Normalize candle series to % change from the first common date.
 *
 * All series are aligned by date — only dates present in ALL series are kept.
 * Each point's value is `(close - baseClose) / baseClose`.
 */
export function normalizeForComparison(
  tickerCandles: ReadonlyMap<string, readonly DailyCandle[]>,
): ComparisonSeries[] {
  if (tickerCandles.size === 0) return [];

  // Build date→close maps for each ticker
  const dateClosesMaps = new Map<string, Map<string, number>>();
  for (const [ticker, candles] of tickerCandles) {
    const dcMap = new Map<string, number>();
    for (const c of candles) {
      dcMap.set(c.date, c.close);
    }
    dateClosesMaps.set(ticker, dcMap);
  }

  // Find common dates (present in ALL tickers), sorted chronologically
  const allTickers = [...dateClosesMaps.keys()];
  const firstMap = dateClosesMaps.get(allTickers[0]!)!;
  const commonDates = [...firstMap.keys()]
    .filter((date) => allTickers.every((t) => dateClosesMaps.get(t)!.has(date)))
    .sort();

  if (commonDates.length === 0) return allTickers.map((t) => ({ ticker: t, points: [] }));

  // Normalize each series to % from first common date's close
  const results: ComparisonSeries[] = [];
  for (const ticker of allTickers) {
    const dcMap = dateClosesMaps.get(ticker)!;
    const baseClose = dcMap.get(commonDates[0]!)!;

    if (baseClose === 0) {
      results.push({ ticker, points: commonDates.map((d) => ({ date: d, pctChange: 0 })) });
      continue;
    }

    const points: ComparisonPoint[] = commonDates.map((date) => ({
      date,
      pctChange: (dcMap.get(date)! - baseClose) / baseClose,
    }));

    results.push({ ticker, points });
  }

  return results;
}

/**
 * Calculate summary stats for a comparison series.
 */
export interface ComparisonStats {
  readonly ticker: string;
  readonly totalReturn: number; // Final % change
  readonly maxDrawdown: number; // Worst peak-to-trough %
  readonly bestDay: number; // Best single-day % move (approximate)
  readonly worstDay: number; // Worst single-day % move (approximate)
}

export function computeComparisonStats(series: ComparisonSeries): ComparisonStats {
  const pts = series.points;
  if (pts.length === 0) {
    return { ticker: series.ticker, totalReturn: 0, maxDrawdown: 0, bestDay: 0, worstDay: 0 };
  }

  const totalReturn = pts[pts.length - 1]!.pctChange;

  // Max drawdown: worst peak-to-trough
  let peak = pts[0]!.pctChange;
  let maxDD = 0;
  for (const p of pts) {
    if (p.pctChange > peak) peak = p.pctChange;
    const dd = peak - p.pctChange;
    if (dd > maxDD) maxDD = dd;
  }

  // Day-over-day changes
  let bestDay = 0;
  let worstDay = 0;
  for (let i = 1; i < pts.length; i++) {
    const dayChange = pts[i]!.pctChange - pts[i - 1]!.pctChange;
    if (dayChange > bestDay) bestDay = dayChange;
    if (dayChange < worstDay) worstDay = dayChange;
  }

  return { ticker: series.ticker, totalReturn, maxDrawdown: maxDD, bestDay, worstDay };
}
