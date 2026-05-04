/**
 * Risk/reward ratio calculator — evaluate trade setups
 * with entry, stop loss, and target price.
 */

export interface TradeSetup {
  readonly entry: number;
  readonly stopLoss: number;
  readonly target: number;
  readonly direction: "long" | "short";
}

export interface RiskRewardAnalysis {
  readonly setup: TradeSetup;
  readonly riskPerShare: number;
  readonly rewardPerShare: number;
  readonly ratio: number; // reward / risk
  readonly riskPercent: number;
  readonly rewardPercent: number;
  readonly breakeven: number;
  readonly favorable: boolean; // ratio >= 2
}

/**
 * Calculate risk/reward analysis for a trade setup.
 */
export function analyzeRiskReward(setup: TradeSetup): RiskRewardAnalysis {
  let riskPerShare: number;
  let rewardPerShare: number;

  if (setup.direction === "long") {
    riskPerShare = setup.entry - setup.stopLoss;
    rewardPerShare = setup.target - setup.entry;
  } else {
    riskPerShare = setup.stopLoss - setup.entry;
    rewardPerShare = setup.entry - setup.target;
  }

  const ratio = riskPerShare > 0 ? rewardPerShare / riskPerShare : 0;
  const riskPercent = setup.entry !== 0 ? (riskPerShare / setup.entry) * 100 : 0;
  const rewardPercent = setup.entry !== 0 ? (rewardPerShare / setup.entry) * 100 : 0;

  return {
    setup,
    riskPerShare: Math.abs(riskPerShare),
    rewardPerShare: Math.abs(rewardPerShare),
    ratio,
    riskPercent: Math.abs(riskPercent),
    rewardPercent: Math.abs(rewardPercent),
    breakeven: setup.entry,
    favorable: ratio >= 2,
  };
}

/**
 * Calculate position size based on max risk amount.
 */
export function positionSizeFromRisk(
  entry: number,
  stopLoss: number,
  maxRiskDollars: number,
): number {
  const riskPerShare = Math.abs(entry - stopLoss);
  if (riskPerShare === 0) return 0;
  return Math.floor(maxRiskDollars / riskPerShare);
}

/**
 * Calculate the dollar risk for a given position.
 */
export function dollarRisk(entry: number, stopLoss: number, shares: number): number {
  return Math.abs(entry - stopLoss) * shares;
}

/**
 * Expected value of a trade given win probability and R:R ratio.
 * Returns expected $ per $1 risked.
 */
export function expectedValue(winRate: number, ratio: number): number {
  return winRate * ratio - (1 - winRate);
}

/**
 * Batch analyze multiple trade setups.
 */
export function batchAnalyze(setups: readonly TradeSetup[]): RiskRewardAnalysis[] {
  return setups.map(analyzeRiskReward);
}

/**
 * Filter only favorable setups (R:R >= minRatio).
 */
export function filterFavorable(
  analyses: readonly RiskRewardAnalysis[],
  minRatio = 2,
): RiskRewardAnalysis[] {
  return analyses.filter((a) => a.ratio >= minRatio);
}

/**
 * Sort setups by risk/reward ratio (best first).
 */
export function sortByRatio(analyses: readonly RiskRewardAnalysis[]): RiskRewardAnalysis[] {
  return [...analyses].sort((a, b) => b.ratio - a.ratio);
}
