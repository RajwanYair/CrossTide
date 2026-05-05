/**
 * MFE/MAE Analysis — Max Favorable Excursion / Max Adverse Excursion.
 *
 * For each backtest trade, computes how far price moved in favor (MFE)
 * and against (MAE) the position during the trade's lifetime.
 *
 * This helps determine:
 * - Optimal stop-loss placement (cluster MAE values)
 * - Optimal take-profit targets (cluster MFE values)
 * - Whether winning trades give back too much profit (MFE - final P/L gap)
 *
 * Pure function: no I/O, no DOM, no Date.now().
 */
import type { DailyCandle } from "../types/domain";

export interface TradeExcursion {
  /** Index of entry candle. */
  readonly entryIndex: number;
  /** Index of exit candle. */
  readonly exitIndex: number;
  /** Maximum favorable excursion as a percentage of entry price. */
  readonly mfePercent: number;
  /** Maximum adverse excursion as a percentage of entry price (always >= 0). */
  readonly maePercent: number;
  /** Final trade profit as a percentage of entry price. */
  readonly profitPercent: number;
  /** Ratio of captured profit to MFE (profitPercent / mfePercent). 1.0 = perfect exit. */
  readonly captureRatio: number;
}

export interface ExcursionTrade {
  /** Entry candle index in the candle array. */
  readonly entryIndex: number;
  /** Exit candle index in the candle array. */
  readonly exitIndex: number;
  /** Trade direction. */
  readonly direction: "LONG" | "SHORT";
  /** Entry price. */
  readonly entryPrice: number;
}

export interface ExcursionSummary {
  /** Per-trade excursion data. */
  readonly trades: readonly TradeExcursion[];
  /** Average MFE across all trades (%). */
  readonly avgMfe: number;
  /** Average MAE across all trades (%). */
  readonly avgMae: number;
  /** Average capture ratio. */
  readonly avgCaptureRatio: number;
  /** Suggested stop-loss level: median MAE (%). */
  readonly suggestedStopLoss: number;
  /** Suggested take-profit level: median MFE (%). */
  readonly suggestedTakeProfit: number;
}

/**
 * Compute MFE/MAE for a set of trades against historical candles.
 *
 * @param candles  Full candle array used for backtesting.
 * @param trades  Trade entries with index, direction, and entry price.
 * @returns Summary with per-trade excursions and aggregate statistics.
 */
export function computeExcursions(
  candles: readonly DailyCandle[],
  trades: readonly ExcursionTrade[],
): ExcursionSummary {
  if (trades.length === 0) {
    return {
      trades: [],
      avgMfe: 0,
      avgMae: 0,
      avgCaptureRatio: 0,
      suggestedStopLoss: 0,
      suggestedTakeProfit: 0,
    };
  }

  const excursions: TradeExcursion[] = [];

  for (const trade of trades) {
    if (trade.entryIndex >= trade.exitIndex) continue;
    if (trade.exitIndex >= candles.length) continue;
    if (trade.entryPrice <= 0) continue;

    let maxFav = 0;
    let maxAdv = 0;

    for (let i = trade.entryIndex + 1; i <= trade.exitIndex; i++) {
      const candle = candles[i]!;

      if (trade.direction === "LONG") {
        const favExcursion = (candle.high - trade.entryPrice) / trade.entryPrice;
        const advExcursion = (trade.entryPrice - candle.low) / trade.entryPrice;
        maxFav = Math.max(maxFav, favExcursion);
        maxAdv = Math.max(maxAdv, advExcursion);
      } else {
        const favExcursion = (trade.entryPrice - candle.low) / trade.entryPrice;
        const advExcursion = (candle.high - trade.entryPrice) / trade.entryPrice;
        maxFav = Math.max(maxFav, favExcursion);
        maxAdv = Math.max(maxAdv, advExcursion);
      }
    }

    const exitCandle = candles[trade.exitIndex]!;
    const profitPercent =
      trade.direction === "LONG"
        ? (exitCandle.close - trade.entryPrice) / trade.entryPrice
        : (trade.entryPrice - exitCandle.close) / trade.entryPrice;

    const captureRatio = maxFav > 0 ? profitPercent / maxFav : 0;

    excursions.push({
      entryIndex: trade.entryIndex,
      exitIndex: trade.exitIndex,
      mfePercent: round4(maxFav * 100),
      maePercent: round4(maxAdv * 100),
      profitPercent: round4(profitPercent * 100),
      captureRatio: round4(captureRatio),
    });
  }

  if (excursions.length === 0) {
    return {
      trades: [],
      avgMfe: 0,
      avgMae: 0,
      avgCaptureRatio: 0,
      suggestedStopLoss: 0,
      suggestedTakeProfit: 0,
    };
  }

  const avgMfe = excursions.reduce((s, e) => s + e.mfePercent, 0) / excursions.length;
  const avgMae = excursions.reduce((s, e) => s + e.maePercent, 0) / excursions.length;
  const avgCaptureRatio = excursions.reduce((s, e) => s + e.captureRatio, 0) / excursions.length;

  const sortedMae = [...excursions].sort((a, b) => a.maePercent - b.maePercent);
  const sortedMfe = [...excursions].sort((a, b) => a.mfePercent - b.mfePercent);

  return {
    trades: excursions,
    avgMfe: round4(avgMfe),
    avgMae: round4(avgMae),
    avgCaptureRatio: round4(avgCaptureRatio),
    suggestedStopLoss: median(sortedMae.map((e) => e.maePercent)),
    suggestedTakeProfit: median(sortedMfe.map((e) => e.mfePercent)),
  };
}

function median(sorted: readonly number[]): number {
  if (sorted.length === 0) return 0;
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return round4((sorted[mid - 1]! + sorted[mid]!) / 2);
  }
  return sorted[mid]!;
}

function round4(n: number): number {
  return Math.round(n * 10000) / 10000;
}
