/**
 * Optimal portfolio turnover — transaction cost-aware rebalancing.
 * Finds the closest rebalanced portfolio within a no-trade zone.
 */

export interface TurnoverResult {
  readonly currentWeights: readonly number[];
  readonly targetWeights: readonly number[];
  readonly optimalWeights: readonly number[];
  readonly turnover: number; // Σ|w_new - w_old| / 2
  readonly transactionCost: number;
  readonly netBenefit: number; // expected benefit - cost
}

export interface RebalanceConfig {
  readonly costPerTrade: number; // proportional cost per unit traded
  readonly noTradeZone?: number; // threshold below which no trade occurs
  readonly maxTurnover?: number; // cap on single-period turnover
}

/**
 * Calculate optimal weights minimizing tracking error to target
 * subject to transaction cost constraints.
 *
 * Uses no-trade zone approach: if the deviation from target is below
 * cost/benefit threshold, don't trade. Otherwise, trade to the zone boundary.
 *
 * @param currentWeights - Current portfolio weights
 * @param targetWeights - Target (optimal) weights
 * @param expectedAlpha - Expected excess return from rebalancing (per asset)
 * @param config - Transaction cost configuration
 */
export function optimalRebalance(
  currentWeights: readonly number[],
  targetWeights: readonly number[],
  expectedAlpha: readonly number[],
  config: RebalanceConfig,
): TurnoverResult {
  const n = currentWeights.length;
  if (n === 0 || n !== targetWeights.length) {
    return {
      currentWeights: [],
      targetWeights: [],
      optimalWeights: [],
      turnover: 0,
      transactionCost: 0,
      netBenefit: 0,
    };
  }

  const noTradeZone = config.noTradeZone ?? config.costPerTrade * 2;
  const optimal: number[] = new Array(n);

  for (let i = 0; i < n; i++) {
    const deviation = targetWeights[i]! - currentWeights[i]!;
    const benefit = Math.abs(expectedAlpha[i] ?? 0);
    const cost = config.costPerTrade;

    if (Math.abs(deviation) <= noTradeZone && benefit <= cost) {
      // Within no-trade zone: keep current
      optimal[i] = currentWeights[i]!;
    } else {
      // Trade toward target, but stop at zone boundary if cost > benefit
      if (benefit > cost) {
        optimal[i] = targetWeights[i]!;
      } else {
        // Move toward target but only to zone boundary
        const sign = Math.sign(deviation);
        optimal[i] = currentWeights[i]! + sign * Math.max(0, Math.abs(deviation) - noTradeZone);
      }
    }
  }

  // Normalize to sum to 1
  const sum = optimal.reduce((s, w) => s + w, 0);
  if (sum > 0) {
    for (let i = 0; i < n; i++) optimal[i] = optimal[i]! / sum;
  }

  // Apply max turnover constraint
  const rawTurnover = computeTurnover(currentWeights, optimal);
  if (config.maxTurnover !== undefined && rawTurnover > config.maxTurnover) {
    const scale = config.maxTurnover / rawTurnover;
    for (let i = 0; i < n; i++) {
      optimal[i] = currentWeights[i]! + (optimal[i]! - currentWeights[i]!) * scale;
    }
  }

  const turnover = computeTurnover(currentWeights, optimal);
  const transactionCost = turnover * config.costPerTrade;
  const netBenefit =
    expectedAlpha.reduce(
      (s, a, i) => s + (a ?? 0) * Math.abs(optimal[i]! - currentWeights[i]!),
      0,
    ) - transactionCost;

  return {
    currentWeights,
    targetWeights,
    optimalWeights: optimal,
    turnover,
    transactionCost,
    netBenefit,
  };
}

/**
 * Calculate one-way turnover: Σ|w_new - w_old| / 2
 */
export function computeTurnover(w1: readonly number[], w2: readonly number[]): number {
  const n = Math.min(w1.length, w2.length);
  let sum = 0;
  for (let i = 0; i < n; i++) sum += Math.abs(w2[i]! - w1[i]!);
  return sum / 2;
}

/**
 * Estimate break-even frequency: how often to rebalance given costs.
 * Returns optimal rebalance period in units (e.g., days).
 *
 * @param expectedTracking - Expected tracking error per period if not rebalancing
 * @param costPerRebalance - Total cost of a full rebalance
 */
export function breakEvenFrequency(expectedTracking: number, costPerRebalance: number): number {
  if (expectedTracking <= 0 || costPerRebalance <= 0) return Infinity;
  // Optimal = √(2C / σ²) from square-root rule
  return Math.sqrt((2 * costPerRebalance) / expectedTracking ** 2);
}

/**
 * Cumulative turnover over a history of weight snapshots.
 */
export function cumulativeTurnover(weightHistory: readonly (readonly number[])[]): number {
  if (weightHistory.length < 2) return 0;
  let total = 0;
  for (let t = 1; t < weightHistory.length; t++) {
    total += computeTurnover(weightHistory[t - 1]!, weightHistory[t]!);
  }
  return total;
}
