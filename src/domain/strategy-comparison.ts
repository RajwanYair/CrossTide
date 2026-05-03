/**
 * Strategy comparison — run two backtest configurations side-by-side
 * on the same candle data and produce comparative metrics.
 *
 * Enables users to evaluate which method combination performs better
 * over the same historical period.
 */
import type { DailyCandle } from "../types/domain";
import { runBacktest, type BacktestConfig, type BacktestResult } from "./backtest-engine";

/** Input for comparing two strategies. */
export interface StrategyComparisonInput {
  readonly candles: readonly DailyCandle[];
  readonly strategyA: BacktestConfig;
  readonly strategyB: BacktestConfig;
}

/** Comparative metrics between two backtest results. */
export interface StrategyComparisonResult {
  readonly resultA: BacktestResult;
  readonly resultB: BacktestResult;
  readonly delta: StrategyDelta;
}

/** Differences between strategy A and strategy B metrics. */
export interface StrategyDelta {
  /** Positive = A better. */
  readonly returnDiff: number;
  /** Positive = A better (higher win rate). */
  readonly winRateDiff: number;
  /** Positive = A better (lower max drawdown). */
  readonly drawdownDiff: number;
  /** Positive = A more trades. */
  readonly tradeCountDiff: number;
  /** Which strategy has better risk-adjusted return (higher return / max drawdown). */
  readonly winner: "A" | "B" | "TIE";
}

/**
 * Compare two backtest strategies on the same candle data.
 *
 * Returns both full results and a delta summary.
 */
export function compareStrategies(input: StrategyComparisonInput): StrategyComparisonResult {
  const { candles, strategyA, strategyB } = input;

  const resultA = runBacktest(candles, strategyA);
  const resultB = runBacktest(candles, strategyB);

  const returnDiff = resultA.totalReturnPercent - resultB.totalReturnPercent;
  const winRateDiff = resultA.winRate - resultB.winRate;
  // Lower drawdown is better, so A-better means B has higher drawdown
  const drawdownDiff = resultB.maxDrawdown - resultA.maxDrawdown;
  const tradeCountDiff = resultA.trades.length - resultB.trades.length;

  // Risk-adjusted: return / max drawdown (avoid div by zero)
  const riskAdjA =
    resultA.maxDrawdown > 0
      ? resultA.totalReturnPercent / resultA.maxDrawdown
      : resultA.totalReturnPercent;
  const riskAdjB =
    resultB.maxDrawdown > 0
      ? resultB.totalReturnPercent / resultB.maxDrawdown
      : resultB.totalReturnPercent;

  let winner: "A" | "B" | "TIE";
  if (Math.abs(riskAdjA - riskAdjB) < 0.01) {
    winner = "TIE";
  } else {
    winner = riskAdjA > riskAdjB ? "A" : "B";
  }

  return {
    resultA,
    resultB,
    delta: { returnDiff, winRateDiff, drawdownDiff, tradeCountDiff, winner },
  };
}

/**
 * Render comparison HTML table summarizing both strategies.
 */
export function renderComparisonTable(result: StrategyComparisonResult): string {
  const { resultA, resultB, delta } = result;

  const fmt = (n: number, suffix = "%"): string => `${n.toFixed(2)}${suffix}`;
  const clr = (v: number): string =>
    v > 0 ? "var(--clr-buy)" : v < 0 ? "var(--clr-sell)" : "inherit";

  return `<table class="mini-table strategy-comparison-table">
    <thead>
      <tr>
        <th>Metric</th>
        <th>Strategy A</th>
        <th>Strategy B</th>
        <th>Δ (A − B)</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Total Return</td>
        <td>${fmt(resultA.totalReturnPercent)}</td>
        <td>${fmt(resultB.totalReturnPercent)}</td>
        <td style="color:${clr(delta.returnDiff)}">${fmt(delta.returnDiff)}</td>
      </tr>
      <tr>
        <td>Win Rate</td>
        <td>${fmt(resultA.winRate * 100)}</td>
        <td>${fmt(resultB.winRate * 100)}</td>
        <td style="color:${clr(delta.winRateDiff)}">${fmt(delta.winRateDiff * 100)}</td>
      </tr>
      <tr>
        <td>Max Drawdown</td>
        <td>${fmt(resultA.maxDrawdown * 100)}</td>
        <td>${fmt(resultB.maxDrawdown * 100)}</td>
        <td style="color:${clr(delta.drawdownDiff)}">${fmt(delta.drawdownDiff * 100)}</td>
      </tr>
      <tr>
        <td>Trades</td>
        <td>${resultA.trades.length}</td>
        <td>${resultB.trades.length}</td>
        <td>${delta.tradeCountDiff > 0 ? "+" : ""}${delta.tradeCountDiff}</td>
      </tr>
      <tr>
        <td><strong>Winner</strong></td>
        <td colspan="3"><strong>${delta.winner === "TIE" ? "Tie" : `Strategy ${delta.winner}`}</strong> (risk-adjusted)</td>
      </tr>
    </tbody>
  </table>`;
}
