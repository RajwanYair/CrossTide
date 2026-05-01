/**
 * Build an equity curve from a list of closed trades, optionally
 * compounding on a starting balance. Each trade has an entry/exit time,
 * entry/exit price, and direction.
 */

export type Side = "long" | "short";

export interface ClosedTrade {
  readonly entryTime: number;
  readonly exitTime: number;
  readonly entryPrice: number;
  readonly exitPrice: number;
  readonly side: Side;
  /** Quantity (shares/contracts). Defaults to 1. */
  readonly quantity?: number;
}

export interface EquityPoint {
  readonly time: number;
  readonly equity: number;
  /** Realized PnL in absolute units at this point. */
  readonly pnl: number;
}

export function tradePnl(trade: ClosedTrade): number {
  const qty = trade.quantity ?? 1;
  const direction = trade.side === "long" ? 1 : -1;
  return (trade.exitPrice - trade.entryPrice) * qty * direction;
}

/**
 * Build a step equity curve. One point per closed trade, applied at
 * the trade's exit time, in chronological order.
 */
export function buildEquityCurve(
  trades: readonly ClosedTrade[],
  startingBalance = 10_000,
): EquityPoint[] {
  if (trades.length === 0) {
    return [{ time: 0, equity: startingBalance, pnl: 0 }];
  }
  const sorted = [...trades].sort((a, b) => a.exitTime - b.exitTime);
  const out: EquityPoint[] = [];
  let equity = startingBalance;
  for (const t of sorted) {
    const pnl = tradePnl(t);
    equity += pnl;
    out.push({ time: t.exitTime, equity, pnl });
  }
  return out;
}

export interface CurveStats {
  readonly totalPnl: number;
  readonly winRate: number;
  readonly profitFactor: number;
  readonly avgWin: number;
  readonly avgLoss: number;
  readonly trades: number;
}

export function summarizeTrades(trades: readonly ClosedTrade[]): CurveStats {
  if (trades.length === 0) {
    return {
      totalPnl: 0,
      winRate: 0,
      profitFactor: 0,
      avgWin: 0,
      avgLoss: 0,
      trades: 0,
    };
  }
  let wins = 0;
  let losses = 0;
  let grossWin = 0;
  let grossLoss = 0;
  for (const t of trades) {
    const p = tradePnl(t);
    if (p > 0) {
      wins++;
      grossWin += p;
    } else if (p < 0) {
      losses++;
      grossLoss += -p;
    }
  }
  return {
    totalPnl: grossWin - grossLoss,
    winRate: wins / trades.length,
    profitFactor: grossLoss === 0 ? (grossWin > 0 ? Infinity : 0) : grossWin / grossLoss,
    avgWin: wins === 0 ? 0 : grossWin / wins,
    avgLoss: losses === 0 ? 0 : grossLoss / losses,
    trades: trades.length,
  };
}
