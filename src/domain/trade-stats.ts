/**
 * Trade performance stats — calculate key trading metrics
 * from a history of completed trades.
 */

export interface Trade {
  readonly entryPrice: number;
  readonly exitPrice: number;
  readonly quantity: number;
  readonly side: "long" | "short";
}

export interface TradeStats {
  readonly totalTrades: number;
  readonly winners: number;
  readonly losers: number;
  readonly winRate: number;
  readonly avgWin: number;
  readonly avgLoss: number;
  readonly profitFactor: number;
  readonly expectancy: number;
  readonly largestWin: number;
  readonly largestLoss: number;
  readonly netPnl: number;
}

/**
 * Calculate P&L for a single trade.
 */
export function tradePnl(trade: Trade): number {
  const diff =
    trade.side === "long" ? trade.exitPrice - trade.entryPrice : trade.entryPrice - trade.exitPrice;
  return diff * trade.quantity;
}

/**
 * Calculate comprehensive trade statistics.
 */
export function computeStats(trades: readonly Trade[]): TradeStats {
  if (trades.length === 0) {
    return {
      totalTrades: 0,
      winners: 0,
      losers: 0,
      winRate: 0,
      avgWin: 0,
      avgLoss: 0,
      profitFactor: 0,
      expectancy: 0,
      largestWin: 0,
      largestLoss: 0,
      netPnl: 0,
    };
  }

  const pnls = trades.map(tradePnl);
  const wins = pnls.filter((p) => p > 0);
  const losses = pnls.filter((p) => p < 0);

  const totalWins = wins.reduce((s, p) => s + p, 0);
  const totalLosses = Math.abs(losses.reduce((s, p) => s + p, 0));

  const winRate = wins.length / trades.length;
  const avgWin = wins.length > 0 ? totalWins / wins.length : 0;
  const avgLoss = losses.length > 0 ? totalLosses / losses.length : 0;
  const profitFactor = totalLosses > 0 ? totalWins / totalLosses : totalWins > 0 ? Infinity : 0;
  const expectancy = winRate * avgWin - (1 - winRate) * avgLoss;

  return {
    totalTrades: trades.length,
    winners: wins.length,
    losers: losses.length,
    winRate,
    avgWin,
    avgLoss,
    profitFactor,
    expectancy,
    largestWin: wins.length > 0 ? Math.max(...wins) : 0,
    largestLoss: losses.length > 0 ? Math.max(...losses.map(Math.abs)) : 0,
    netPnl: pnls.reduce((s, p) => s + p, 0),
  };
}

/**
 * Calculate consecutive wins/losses streaks.
 */
export function streaks(trades: readonly Trade[]): { maxWinStreak: number; maxLossStreak: number } {
  let maxWin = 0;
  let maxLoss = 0;
  let curWin = 0;
  let curLoss = 0;

  for (const trade of trades) {
    const pnl = tradePnl(trade);
    if (pnl > 0) {
      curWin++;
      curLoss = 0;
      maxWin = Math.max(maxWin, curWin);
    } else if (pnl < 0) {
      curLoss++;
      curWin = 0;
      maxLoss = Math.max(maxLoss, curLoss);
    } else {
      curWin = 0;
      curLoss = 0;
    }
  }

  return { maxWinStreak: maxWin, maxLossStreak: maxLoss };
}

/**
 * Calculate average holding return percent.
 */
export function avgReturnPercent(trades: readonly Trade[]): number {
  if (trades.length === 0) return 0;

  const returns = trades.map((t) => {
    const pnl = tradePnl(t);
    const cost = t.entryPrice * t.quantity;
    return cost > 0 ? (pnl / cost) * 100 : 0;
  });

  return returns.reduce((s, r) => s + r, 0) / returns.length;
}
