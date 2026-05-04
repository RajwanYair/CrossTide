/**
 * Kelly criterion calculator — determine optimal position sizing
 * based on win rate and win/loss ratio.
 */

export interface KellyInput {
  readonly winRate: number; // probability of win (0-1)
  readonly avgWin: number; // average win amount
  readonly avgLoss: number; // average loss amount (positive number)
}

export interface KellyResult {
  readonly fullKelly: number; // optimal fraction (can be >1 or negative)
  readonly halfKelly: number; // conservative half-Kelly
  readonly quarterKelly: number; // ultra-conservative quarter-Kelly
  readonly edge: number; // expected edge per trade
  readonly isPositive: boolean; // whether the system has positive expectancy
}

/**
 * Calculate the Kelly fraction.
 * Kelly% = W - (1-W)/R
 * where W = win probability, R = win/loss ratio
 */
export function kellyFraction(winRate: number, winLossRatio: number): number {
  if (winLossRatio <= 0) return 0;
  return winRate - (1 - winRate) / winLossRatio;
}

/**
 * Full Kelly analysis from trade statistics.
 */
export function kellyAnalysis(input: KellyInput): KellyResult {
  const { winRate, avgWin, avgLoss } = input;

  if (avgLoss <= 0 || winRate < 0 || winRate > 1) {
    return { fullKelly: 0, halfKelly: 0, quarterKelly: 0, edge: 0, isPositive: false };
  }

  const winLossRatio = avgWin / avgLoss;
  const full = kellyFraction(winRate, winLossRatio);
  const edge = winRate * avgWin - (1 - winRate) * avgLoss;

  return {
    fullKelly: full,
    halfKelly: full / 2,
    quarterKelly: full / 4,
    edge,
    isPositive: full > 0,
  };
}

/**
 * Calculate Kelly from a series of trade P&Ls.
 */
export function kellyFromTrades(pnls: readonly number[]): KellyResult {
  if (pnls.length === 0) {
    return { fullKelly: 0, halfKelly: 0, quarterKelly: 0, edge: 0, isPositive: false };
  }

  const wins = pnls.filter((p) => p > 0);
  const losses = pnls.filter((p) => p < 0);

  const winRate = wins.length / pnls.length;
  const avgWin = wins.length > 0 ? wins.reduce((s, p) => s + p, 0) / wins.length : 0;
  const avgLoss =
    losses.length > 0 ? Math.abs(losses.reduce((s, p) => s + p, 0) / losses.length) : 0;

  return kellyAnalysis({ winRate, avgWin, avgLoss });
}

/**
 * Calculate optimal position size in currency for a given account.
 */
export function kellyPositionSize(
  accountSize: number,
  kellyPercent: number,
  maxRisk = 0.25,
): number {
  // Clamp Kelly to maxRisk to prevent over-leverage
  const clamped = Math.min(Math.max(kellyPercent, 0), maxRisk);
  return accountSize * clamped;
}
