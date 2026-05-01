/**
 * Compute Worker — runs CPU-intensive domain operations off the main thread.
 *
 * Exposed API: ComputeApi
 *   runBacktest(config, candles) → BacktestResult
 *   runScreener(inputs, filters) → ScreenerRow[]
 *   runSmaCrossover(candles, fastPeriod, slowPeriod, initialCapital) → SmaCrossoverResult
 *
 * Instantiate via:
 *   new Worker(new URL("./compute-worker.ts", import.meta.url), { type: "module" })
 *
 * The worker is served via Vite's worker inlining in development and as a
 * hashed chunk in production builds.
 */
import type { DailyCandle } from "../types/domain";
import type { BacktestConfig, BacktestResult } from "../domain/backtest-engine";
import { runBacktest } from "../domain/backtest-engine";
import { applyFilters } from "../cards/screener";
import type { ScreenerInput, ScreenerFilter, ScreenerRow } from "../cards/screener";
import { buildEquityCurve, summarizeTrades, type ClosedTrade, type EquityPoint, type CurveStats } from "../domain/equity-curve";
import { maxDrawdown, cagr } from "../domain/risk-ratios";
import { serveWorkerRpc, type WorkerApi } from "./worker-rpc";

export interface SmaCrossoverResult {
  readonly trades: ClosedTrade[];
  readonly equityPoints: readonly EquityPoint[];
  readonly stats: CurveStats;
  readonly finalEquity: number;
  readonly totalReturnPct: number;
  readonly annReturn: number;
  readonly maxDrawdown: number;
}

export interface ComputeApi extends WorkerApi {
  runBacktest(config: BacktestConfig, candles: readonly DailyCandle[]): BacktestResult;
  runScreener(inputs: readonly ScreenerInput[], filters: readonly ScreenerFilter[]): ScreenerRow[];
  runSmaCrossover(
    candles: readonly { close: number }[],
    fastPeriod: number,
    slowPeriod: number,
    initialCapital: number,
  ): SmaCrossoverResult;
}

function smaAt(prices: readonly number[], n: number, i: number): number {
  let s = 0;
  for (let k = i - n + 1; k <= i; k++) s += prices[k]!;
  return s / n;
}

serveWorkerRpc<ComputeApi>({
  runBacktest(config, candles) {
    return runBacktest(candles, config);
  },
  runScreener(inputs, filters) {
    return applyFilters(inputs, filters);
  },
  runSmaCrossover(candles, fastPeriod, slowPeriod, initialCapital) {
    const closes = candles.map((c) => c.close);
    const trades: ClosedTrade[] = [];
    let position: { entryTime: number; entryPrice: number } | null = null;

    for (let i = slowPeriod; i < closes.length; i++) {
      const fast = smaAt(closes, fastPeriod, i);
      const fastPrev = smaAt(closes, fastPeriod, i - 1);
      const slow = smaAt(closes, slowPeriod, i);
      const slowPrev = smaAt(closes, slowPeriod, i - 1);

      if (!position && fastPrev <= slowPrev && fast > slow) {
        position = { entryTime: i, entryPrice: closes[i]! };
      } else if (position && fastPrev >= slowPrev && fast < slow) {
        trades.push({
          entryTime: position.entryTime,
          exitTime: i,
          entryPrice: position.entryPrice,
          exitPrice: closes[i]!,
          side: "long",
        });
        position = null;
      }
    }

    if (position) {
      trades.push({
        entryTime: position.entryTime,
        exitTime: closes.length - 1,
        entryPrice: position.entryPrice,
        exitPrice: closes[closes.length - 1]!,
        side: "long",
      });
    }

    const equityPoints = buildEquityCurve(trades, initialCapital);
    const stats = summarizeTrades(trades);
    const equityValues = equityPoints.map((p) => p.equity);
    const dd = maxDrawdown(equityValues);
    const years = closes.length / 252;
    const annReturn = cagr(equityValues, years);
    const finalEquity = equityValues[equityValues.length - 1] ?? initialCapital;

    return {
      trades,
      equityPoints,
      stats,
      finalEquity,
      totalReturnPct: ((finalEquity - initialCapital) / initialCapital) * 100,
      annReturn,
      maxDrawdown: dd,
    };
  },
});
