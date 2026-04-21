/**
 * Backtest Engine — run method signals against historical candles.
 *
 * Pure domain logic: given a set of method detectors and historical data,
 * produce an equity curve and performance metrics.
 */
import type { DailyCandle, MethodSignal, MethodName } from "../types/domain";
import { aggregateSignals } from "./signal-aggregator";

export interface BacktestConfig {
  readonly ticker: string;
  readonly initialCapital: number;
  readonly methods: readonly MethodName[];
  readonly windowSize: number; // lookback candles for each signal evaluation
}

export interface BacktestTrade {
  readonly entryDate: string;
  readonly exitDate: string;
  readonly entryPrice: number;
  readonly exitPrice: number;
  readonly direction: "LONG" | "SHORT";
  readonly profit: number;
  readonly profitPercent: number;
}

export interface BacktestResult {
  readonly ticker: string;
  readonly trades: readonly BacktestTrade[];
  readonly totalReturn: number;
  readonly totalReturnPercent: number;
  readonly winRate: number;
  readonly maxDrawdown: number;
  readonly equityCurve: readonly { date: string; equity: number }[];
}

/**
 * Run a simple consensus-based backtest.
 *
 * Strategy: BUY when majority of selected methods signal BUY, SELL when they signal SELL.
 * Evaluates signals on a rolling window.
 */
export function runBacktest(
  candles: readonly DailyCandle[],
  config: BacktestConfig,
): BacktestResult {
  const { ticker, initialCapital, methods, windowSize } = config;

  if (candles.length < windowSize + 1) {
    return {
      ticker,
      trades: [],
      totalReturn: 0,
      totalReturnPercent: 0,
      winRate: 0,
      maxDrawdown: 0,
      equityCurve: [{ date: candles[0]?.date ?? "", equity: initialCapital }],
    };
  }

  const trades: BacktestTrade[] = [];
  let equity = initialCapital;
  let position: { entryDate: string; entryPrice: number } | null = null;
  let peakEquity = equity;
  let maxDrawdown = 0;

  const equityCurve: { date: string; equity: number }[] = [];

  for (let i = windowSize; i < candles.length; i++) {
    const window = candles.slice(i - windowSize, i);
    const signals = aggregateSignals(ticker, window);

    // Filter to selected methods
    const relevant = signals.filter((s) => methods.includes(s.method));
    const buyCount = relevant.filter((s) => s.direction === "BUY").length;
    const sellCount = relevant.filter((s) => s.direction === "SELL").length;

    const candle = candles[i]!;

    if (!position && buyCount > sellCount && buyCount > relevant.length / 2) {
      // Enter long
      position = { entryDate: candle.date, entryPrice: candle.close };
    } else if (position && sellCount > buyCount && sellCount > relevant.length / 2) {
      // Exit long
      const profit = candle.close - position.entryPrice;
      const profitPct = (profit / position.entryPrice) * 100;
      trades.push({
        entryDate: position.entryDate,
        exitDate: candle.date,
        entryPrice: position.entryPrice,
        exitPrice: candle.close,
        direction: "LONG",
        profit,
        profitPercent: profitPct,
      });
      equity += (equity / position.entryPrice) * profit;
      position = null;
    }

    if (equity > peakEquity) peakEquity = equity;
    const dd = peakEquity > 0 ? (peakEquity - equity) / peakEquity : 0;
    if (dd > maxDrawdown) maxDrawdown = dd;

    equityCurve.push({ date: candle.date, equity });
  }

  // Close open position at end
  if (position) {
    const lastCandle = candles[candles.length - 1]!;
    const profit = lastCandle.close - position.entryPrice;
    const profitPct = (profit / position.entryPrice) * 100;
    trades.push({
      entryDate: position.entryDate,
      exitDate: lastCandle.date,
      entryPrice: position.entryPrice,
      exitPrice: lastCandle.close,
      direction: "LONG",
      profit,
      profitPercent: profitPct,
    });
    equity += (equity / position.entryPrice) * profit;
  }

  const totalReturn = equity - initialCapital;
  const wins = trades.filter((t) => t.profit > 0).length;

  return {
    ticker,
    trades,
    totalReturn,
    totalReturnPercent: initialCapital > 0 ? (totalReturn / initialCapital) * 100 : 0,
    winRate: trades.length > 0 ? wins / trades.length : 0,
    maxDrawdown,
    equityCurve,
  };
}
