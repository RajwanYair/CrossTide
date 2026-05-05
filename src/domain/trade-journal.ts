/**
 * Trade Journal Analytics — pure functions to analyze a user's
 * trade log and compute performance statistics.
 *
 * All inputs are pre-structured trade entries — no I/O, no Date.now().
 *
 * @module domain/trade-journal
 */

export interface TradeEntry {
  readonly symbol: string;
  readonly side: "long" | "short";
  readonly entryPrice: number;
  readonly exitPrice: number;
  readonly shares: number;
  readonly entryDate: string; // ISO date
  readonly exitDate: string; // ISO date
  /** Optional initial risk per share (stop distance). Used for R-multiple. */
  readonly riskPerShare?: number | undefined;
}

export interface TradeStats {
  readonly totalTrades: number;
  readonly wins: number;
  readonly losses: number;
  readonly breakeven: number;
  readonly winRate: number; // 0–1
  readonly avgWin: number;
  readonly avgLoss: number;
  /** Profit factor = gross wins / gross losses. Infinity if no losses. */
  readonly profitFactor: number;
  readonly totalPnl: number;
  readonly avgPnl: number;
  /** Average R-multiple (only for trades with riskPerShare). */
  readonly avgRMultiple: number | null;
  readonly bestTrade: TradeResult;
  readonly worstTrade: TradeResult;
  /** Expectancy = (winRate × avgWin) - (lossRate × |avgLoss|) per trade. */
  readonly expectancy: number;
  /** Max consecutive wins. */
  readonly maxConsecutiveWins: number;
  /** Max consecutive losses. */
  readonly maxConsecutiveLosses: number;
}

export interface TradeResult {
  readonly symbol: string;
  readonly pnl: number;
  readonly pnlPercent: number;
  readonly rMultiple: number | null;
}

/**
 * Analyze an array of completed trades.
 *
 * @param trades - Completed trade entries (at least 1).
 * @returns Trade statistics or null if empty.
 */
export function analyzeTradeJournal(trades: readonly TradeEntry[]): TradeStats | null {
  if (trades.length === 0) return null;

  const results: Array<{
    symbol: string;
    pnl: number;
    pnlPercent: number;
    rMultiple: number | null;
    isWin: boolean;
    isLoss: boolean;
  }> = [];

  for (const t of trades) {
    if (t.shares <= 0 || t.entryPrice <= 0) continue;

    const rawPnl =
      t.side === "long"
        ? (t.exitPrice - t.entryPrice) * t.shares
        : (t.entryPrice - t.exitPrice) * t.shares;

    const pnlPercent =
      t.side === "long"
        ? (t.exitPrice - t.entryPrice) / t.entryPrice
        : (t.entryPrice - t.exitPrice) / t.entryPrice;

    const rMultiple =
      t.riskPerShare !== undefined && t.riskPerShare > 0
        ? (t.side === "long" ? t.exitPrice - t.entryPrice : t.entryPrice - t.exitPrice) /
          t.riskPerShare
        : null;

    results.push({
      symbol: t.symbol,
      pnl: rawPnl,
      pnlPercent,
      rMultiple,
      isWin: rawPnl > 0,
      isLoss: rawPnl < 0,
    });
  }

  if (results.length === 0) return null;

  const wins = results.filter((r) => r.isWin);
  const losses = results.filter((r) => r.isLoss);
  const breakeven = results.length - wins.length - losses.length;

  const totalPnl = results.reduce((s, r) => s + r.pnl, 0);
  const grossWins = wins.reduce((s, r) => s + r.pnl, 0);
  const grossLosses = Math.abs(losses.reduce((s, r) => s + r.pnl, 0));

  const avgWin = wins.length > 0 ? grossWins / wins.length : 0;
  const avgLoss = losses.length > 0 ? -(grossLosses / losses.length) : 0;
  const winRate = wins.length / results.length;

  const rMultiples = results.map((r) => r.rMultiple).filter((r): r is number => r !== null);
  const avgRMultiple =
    rMultiples.length > 0 ? rMultiples.reduce((s, v) => s + v, 0) / rMultiples.length : null;

  const sorted = [...results].sort((a, b) => a.pnl - b.pnl);
  const best = sorted[sorted.length - 1]!;
  const worst = sorted[0]!;

  const { maxWins, maxLosses } = computeStreaks(results);

  const expectancy = winRate * avgWin - (1 - winRate) * Math.abs(avgLoss);

  return {
    totalTrades: results.length,
    wins: wins.length,
    losses: losses.length,
    breakeven,
    winRate: round6(winRate),
    avgWin: round6(avgWin),
    avgLoss: round6(avgLoss),
    profitFactor: grossLosses > 0 ? round6(grossWins / grossLosses) : Infinity,
    totalPnl: round6(totalPnl),
    avgPnl: round6(totalPnl / results.length),
    avgRMultiple: avgRMultiple !== null ? round6(avgRMultiple) : null,
    bestTrade: {
      symbol: best.symbol,
      pnl: round6(best.pnl),
      pnlPercent: round6(best.pnlPercent),
      rMultiple: best.rMultiple !== null ? round6(best.rMultiple) : null,
    },
    worstTrade: {
      symbol: worst.symbol,
      pnl: round6(worst.pnl),
      pnlPercent: round6(worst.pnlPercent),
      rMultiple: worst.rMultiple !== null ? round6(worst.rMultiple) : null,
    },
    expectancy: round6(expectancy),
    maxConsecutiveWins: maxWins,
    maxConsecutiveLosses: maxLosses,
  };
}

function computeStreaks(results: readonly Array<{ isWin: boolean; isLoss: boolean }>[number][]): {
  maxWins: number;
  maxLosses: number;
} {
  let maxWins = 0;
  let maxLosses = 0;
  let curWins = 0;
  let curLosses = 0;

  for (const r of results) {
    if (r.isWin) {
      curWins++;
      curLosses = 0;
      if (curWins > maxWins) maxWins = curWins;
    } else if (r.isLoss) {
      curLosses++;
      curWins = 0;
      if (curLosses > maxLosses) maxLosses = curLosses;
    } else {
      curWins = 0;
      curLosses = 0;
    }
  }

  return { maxWins, maxLosses };
}

function round6(n: number): number {
  return Math.round(n * 1e6) / 1e6;
}
