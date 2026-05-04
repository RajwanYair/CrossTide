/**
 * Backtest Engine — run method signals against historical candles.
 *
 * Pure domain logic: given a set of method detectors and historical data,
 * produce an equity curve and performance metrics.
 */
import type { DailyCandle, MethodName } from "../types/domain";
import { aggregateSignals } from "./signal-aggregator";
import type { BacktestSizingConfig, KellyInput } from "./position-sizing";
import { computeBacktestShares } from "./position-sizing";

// ── Commission & Slippage (Q8) ────────────────────────────────────────────────

export interface CommissionConfig {
  /** Fixed fee per trade (applies both at entry and exit). Default: 0. */
  readonly fixedPerTrade?: number;
  /** Percentage of trade value charged per trade (e.g. 0.001 = 0.1%). Default: 0. */
  readonly percentPerTrade?: number;
  /** Estimated slippage as a fraction of price (e.g. 0.0005 = 5 bps). Default: 0. */
  readonly slippage?: number;
}

/**
 * Compute total cost for entering or exiting a position.
 * Returns a positive cost value.
 */
export function computeTradeCost(
  price: number,
  shares: number,
  commission: CommissionConfig,
): number {
  const fixed = commission.fixedPerTrade ?? 0;
  const pct = commission.percentPerTrade ?? 0;
  const slip = commission.slippage ?? 0;
  const tradeValue = price * shares;
  return fixed + tradeValue * pct + tradeValue * slip;
}

export interface BacktestConfig {
  readonly ticker: string;
  readonly initialCapital: number;
  readonly methods: readonly MethodName[];
  readonly windowSize: number; // lookback candles for each signal evaluation
  /** Q8: Commission and slippage model. */
  readonly commission?: CommissionConfig;
  /** Q9: Position sizing configuration. Defaults to all-in (percentage 100%). */
  readonly sizing?: BacktestSizingConfig;
}

export interface BacktestTrade {
  readonly entryDate: string;
  readonly exitDate: string;
  readonly entryPrice: number;
  readonly exitPrice: number;
  readonly direction: "LONG" | "SHORT";
  readonly shares: number;
  readonly profit: number;
  readonly profitPercent: number;
  /** Total commission + slippage paid (entry + exit). */
  readonly totalCost: number;
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
  const commission: CommissionConfig = config.commission ?? {};
  const sizing: BacktestSizingConfig = config.sizing ?? {
    mode: "percentage",
    percentOfEquity: 1.0,
  };

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
  let position: {
    entryDate: string;
    entryPrice: number;
    shares: number;
    entryCost: number;
  } | null = null;
  let peakEquity = equity;
  let maxDrawdown = 0;

  // Track running Kelly stats from closed trades
  let wins = 0;
  let totalWinAmt = 0;
  let losses = 0;
  let totalLossAmt = 0;

  function kellyStats(): KellyInput | undefined {
    if (wins === 0 || losses === 0) return undefined;
    return {
      winRate: wins / (wins + losses),
      avgWin: totalWinAmt / wins,
      avgLoss: totalLossAmt / losses,
    };
  }

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
      // Enter long — compute shares from sizing config
      const shares = computeBacktestShares(sizing, equity, candle.close, kellyStats());
      const entryCost = computeTradeCost(candle.close, shares, commission);
      if (shares > 0 && candle.close * shares + entryCost <= equity) {
        position = { entryDate: candle.date, entryPrice: candle.close, shares, entryCost };
        equity -= entryCost; // deduct entry cost immediately
      }
    } else if (position && sellCount > buyCount && sellCount > relevant.length / 2) {
      // Exit long
      const exitCost = computeTradeCost(candle.close, position.shares, commission);
      const grossProfit = (candle.close - position.entryPrice) * position.shares;
      const totalCost = position.entryCost + exitCost;
      const netProfit = grossProfit - exitCost;
      const profitPct =
        position.entryPrice > 0
          ? ((candle.close - position.entryPrice) / position.entryPrice) * 100
          : 0;

      trades.push({
        entryDate: position.entryDate,
        exitDate: candle.date,
        entryPrice: position.entryPrice,
        exitPrice: candle.close,
        direction: "LONG",
        shares: position.shares,
        profit: netProfit,
        profitPercent: profitPct,
        totalCost,
      });

      equity += grossProfit - exitCost;

      // Update Kelly stats
      if (netProfit > 0) {
        wins++;
        totalWinAmt += netProfit;
      } else {
        losses++;
        totalLossAmt += Math.abs(netProfit);
      }

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
    const exitCost = computeTradeCost(lastCandle.close, position.shares, commission);
    const grossProfit = (lastCandle.close - position.entryPrice) * position.shares;
    const totalCost = position.entryCost + exitCost;
    const netProfit = grossProfit - exitCost;
    const profitPct =
      position.entryPrice > 0
        ? ((lastCandle.close - position.entryPrice) / position.entryPrice) * 100
        : 0;
    trades.push({
      entryDate: position.entryDate,
      exitDate: lastCandle.date,
      entryPrice: position.entryPrice,
      exitPrice: lastCandle.close,
      direction: "LONG",
      shares: position.shares,
      profit: netProfit,
      profitPercent: profitPct,
      totalCost,
    });
    equity += grossProfit - exitCost;
  }

  const totalReturn = equity - initialCapital;
  const totalWins = trades.filter((t) => t.profit > 0).length;

  return {
    ticker,
    trades,
    totalReturn,
    totalReturnPercent: initialCapital > 0 ? (totalReturn / initialCapital) * 100 : 0,
    winRate: trades.length > 0 ? totalWins / trades.length : 0,
    maxDrawdown,
    equityCurve,
  };
}
