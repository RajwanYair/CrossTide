/**
 * Backtest worker fallback — synchronous SMA crossover for environments
 * where Web Workers are unavailable (tests, SSR).
 */
import { buildEquityCurve, summarizeTrades, type ClosedTrade } from "../domain/equity-curve";
import { maxDrawdown, cagr } from "../domain/risk-ratios";

export interface SmaCrossoverLocalResult {
  trades: ClosedTrade[];
  equityPoints: ReturnType<typeof buildEquityCurve>;
  stats: ReturnType<typeof summarizeTrades>;
  maxDrawdown: number;
  annReturn: number;
  finalEquity: number;
  totalReturnPct: number;
}

function smaAt(prices: readonly number[], n: number, i: number): number {
  let s = 0;
  for (let k = i - n + 1; k <= i; k++) s += prices[k]!;
  return s / n;
}

export function runSmaCrossoverLocal(
  candles: readonly { close: number }[],
  fastPeriod: number,
  slowPeriod: number,
  initialCapital: number,
): SmaCrossoverLocalResult {
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
  const totalReturnPct = ((finalEquity - initialCapital) / initialCapital) * 100;

  return {
    trades,
    equityPoints,
    stats,
    maxDrawdown: dd,
    annReturn,
    finalEquity,
    totalReturnPct,
  };
}
