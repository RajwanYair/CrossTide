/**
 * Backtest performance metrics. Pure module that converts an equity
 * curve plus trade list into the metrics traders expect to see:
 * total return, CAGR, max drawdown, Sharpe, win rate, profit factor.
 */

export interface EquityPoint {
  readonly timestamp: number;
  readonly value: number;
}

export interface Trade {
  readonly entryTimestamp: number;
  readonly exitTimestamp: number;
  readonly pnl: number;
}

export interface BacktestMetrics {
  readonly totalReturn: number;
  readonly cagr: number;
  readonly maxDrawdown: number;
  readonly sharpe: number;
  readonly winRate: number;
  readonly profitFactor: number;
  readonly tradeCount: number;
  readonly avgTradePnl: number;
}

const MS_PER_YEAR = 365.25 * 24 * 60 * 60 * 1000;

export function totalReturn(curve: readonly EquityPoint[]): number {
  if (curve.length < 2) return 0;
  const first = curve[0]!;
  const last = curve[curve.length - 1]!;
  if (first.value === 0) return 0;
  return last.value / first.value - 1;
}

export function cagr(curve: readonly EquityPoint[]): number {
  if (curve.length < 2) return 0;
  const first = curve[0]!;
  const last = curve[curve.length - 1]!;
  if (first.value <= 0) return 0;
  const years = (last.timestamp - first.timestamp) / MS_PER_YEAR;
  if (years <= 0) return 0;
  return Math.pow(last.value / first.value, 1 / years) - 1;
}

export function maxDrawdown(curve: readonly EquityPoint[]): number {
  let peak = -Infinity;
  let maxDd = 0;
  for (const p of curve) {
    if (p.value > peak) peak = p.value;
    if (peak > 0) {
      const dd = (peak - p.value) / peak;
      if (dd > maxDd) maxDd = dd;
    }
  }
  return maxDd;
}

/**
 * Annualized Sharpe ratio. Caller provides the periods-per-year
 * sampling rate (252 for daily bars, 12 for monthly, etc.).
 */
export function sharpe(returns: readonly number[], periodsPerYear = 252, riskFreeRate = 0): number {
  if (returns.length < 2) return 0;
  const excess = returns.map((r) => r - riskFreeRate / periodsPerYear);
  const mean = excess.reduce((s, x) => s + x, 0) / excess.length;
  const variance = excess.reduce((s, x) => s + (x - mean) ** 2, 0) / (excess.length - 1);
  const std = Math.sqrt(variance);
  if (std === 0) return 0;
  return (mean / std) * Math.sqrt(periodsPerYear);
}

export function periodReturns(curve: readonly EquityPoint[]): number[] {
  const out: number[] = [];
  for (let i = 1; i < curve.length; i++) {
    const prev = curve[i - 1]!.value;
    const cur = curve[i]!.value;
    if (prev <= 0) {
      out.push(0);
    } else {
      out.push(cur / prev - 1);
    }
  }
  return out;
}

export function winRate(trades: readonly Trade[]): number {
  if (trades.length === 0) return 0;
  const wins = trades.filter((t) => t.pnl > 0).length;
  return wins / trades.length;
}

export function profitFactor(trades: readonly Trade[]): number {
  let gross = 0;
  let loss = 0;
  for (const t of trades) {
    if (t.pnl > 0) gross += t.pnl;
    else loss += -t.pnl;
  }
  if (loss === 0) return gross > 0 ? Infinity : 0;
  return gross / loss;
}

export function computeMetrics(
  curve: readonly EquityPoint[],
  trades: readonly Trade[],
  periodsPerYear = 252,
): BacktestMetrics {
  const rets = periodReturns(curve);
  return {
    totalReturn: totalReturn(curve),
    cagr: cagr(curve),
    maxDrawdown: maxDrawdown(curve),
    sharpe: sharpe(rets, periodsPerYear),
    winRate: winRate(trades),
    profitFactor: profitFactor(trades),
    tradeCount: trades.length,
    avgTradePnl: trades.length === 0 ? 0 : trades.reduce((s, t) => s + t.pnl, 0) / trades.length,
  };
}
