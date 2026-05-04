/**
 * Profit factor and trade performance metrics from a list of trades.
 */

export interface Trade {
  readonly pnl: number; // profit/loss amount
  readonly holdingPeriod?: number; // bars held
}

export interface ProfitFactorResult {
  readonly profitFactor: number;
  readonly totalWins: number;
  readonly totalLosses: number;
  readonly winCount: number;
  readonly lossCount: number;
  readonly winRate: number;
  readonly avgWin: number;
  readonly avgLoss: number;
  readonly expectancy: number;
  readonly payoffRatio: number;
  readonly largestWin: number;
  readonly largestLoss: number;
  readonly avgHoldingPeriod: number;
  readonly consecutiveWins: number;
  readonly consecutiveLosses: number;
}

/**
 * Calculate profit factor = gross profit / |gross loss|.
 * PF > 1 means net profitable. PF > 2 is strong.
 */
export function profitFactor(trades: readonly Trade[]): ProfitFactorResult {
  if (trades.length === 0) {
    return {
      profitFactor: 0,
      totalWins: 0,
      totalLosses: 0,
      winCount: 0,
      lossCount: 0,
      winRate: 0,
      avgWin: 0,
      avgLoss: 0,
      expectancy: 0,
      payoffRatio: 0,
      largestWin: 0,
      largestLoss: 0,
      avgHoldingPeriod: 0,
      consecutiveWins: 0,
      consecutiveLosses: 0,
    };
  }

  let totalWins = 0;
  let totalLosses = 0;
  let winCount = 0;
  let lossCount = 0;
  let largestWin = 0;
  let largestLoss = 0;
  let holdingSum = 0;
  let holdingCount = 0;

  for (const t of trades) {
    if (t.pnl > 0) {
      totalWins += t.pnl;
      winCount++;
      if (t.pnl > largestWin) largestWin = t.pnl;
    } else if (t.pnl < 0) {
      totalLosses += Math.abs(t.pnl);
      lossCount++;
      if (t.pnl < largestLoss) largestLoss = t.pnl;
    }
    if (t.holdingPeriod !== undefined) {
      holdingSum += t.holdingPeriod;
      holdingCount++;
    }
  }

  const pf = totalLosses > 0 ? totalWins / totalLosses : totalWins > 0 ? Infinity : 0;
  const winRate = trades.length > 0 ? winCount / trades.length : 0;
  const avgWin = winCount > 0 ? totalWins / winCount : 0;
  const avgLoss = lossCount > 0 ? totalLosses / lossCount : 0;
  const expectancy = winRate * avgWin - (1 - winRate) * avgLoss;
  const payoffRatio = avgLoss > 0 ? avgWin / avgLoss : avgWin > 0 ? Infinity : 0;

  const { maxConsecutiveWins, maxConsecutiveLosses } = consecutiveStreaks(trades);

  return {
    profitFactor: pf,
    totalWins,
    totalLosses,
    winCount,
    lossCount,
    winRate,
    avgWin,
    avgLoss,
    expectancy,
    payoffRatio,
    largestWin,
    largestLoss,
    avgHoldingPeriod: holdingCount > 0 ? holdingSum / holdingCount : 0,
    consecutiveWins: maxConsecutiveWins,
    consecutiveLosses: maxConsecutiveLosses,
  };
}

/**
 * Find max consecutive wins and losses.
 */
function consecutiveStreaks(trades: readonly Trade[]): {
  maxConsecutiveWins: number;
  maxConsecutiveLosses: number;
} {
  let maxWins = 0;
  let maxLosses = 0;
  let curWins = 0;
  let curLosses = 0;

  for (const t of trades) {
    if (t.pnl > 0) {
      curWins++;
      curLosses = 0;
      if (curWins > maxWins) maxWins = curWins;
    } else if (t.pnl < 0) {
      curLosses++;
      curWins = 0;
      if (curLosses > maxLosses) maxLosses = curLosses;
    } else {
      curWins = 0;
      curLosses = 0;
    }
  }

  return { maxConsecutiveWins: maxWins, maxConsecutiveLosses: maxLosses };
}

/**
 * Calculate equity curve from a list of trades.
 */
export function equityCurve(trades: readonly Trade[], startingCapital = 10000): number[] {
  const curve: number[] = [startingCapital];
  let equity = startingCapital;
  for (const t of trades) {
    equity += t.pnl;
    curve.push(equity);
  }
  return curve;
}
