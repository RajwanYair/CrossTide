/**
 * Position-level risk metrics — stop distance, risk percentage,
 * portfolio heat, and risk-reward assessment per position.
 *
 * Pure functions: accept position parameters, return risk metrics.
 * Complements position-sizing.ts (how many shares) with risk analytics
 * (how much risk a position carries).
 */

/** Input describing a single position */
export interface PositionInput {
  /** Current entry/average price */
  readonly entryPrice: number;
  /** Current market price */
  readonly currentPrice: number;
  /** Stop-loss price (0 if no stop) */
  readonly stopPrice: number;
  /** Number of shares held */
  readonly shares: number;
  /** Optional target/take-profit price */
  readonly targetPrice?: number;
}

/** Risk metrics for a single position */
export interface PositionRisk {
  /** Dollar distance from entry to stop */
  readonly stopDistance: number;
  /** Stop distance as fraction of entry price */
  readonly stopPercent: number;
  /** Total dollar risk (stop distance × shares) */
  readonly dollarRisk: number;
  /** Current position value */
  readonly positionValue: number;
  /** Unrealized P/L in dollars */
  readonly unrealizedPnl: number;
  /** Unrealized P/L as fraction of entry value */
  readonly unrealizedPnlPercent: number;
  /** Risk-reward ratio (reward / risk), or null if no target */
  readonly riskRewardRatio: number | null;
  /** R-multiple: current gain expressed in units of risk */
  readonly rMultiple: number;
}

/** Aggregate portfolio heat metrics */
export interface PortfolioHeat {
  /** Total dollar risk across all positions */
  readonly totalDollarRisk: number;
  /** Portfolio heat = total risk / total equity, as fraction */
  readonly heatPercent: number;
  /** Total portfolio value (sum of all position values) */
  readonly totalValue: number;
  /** Number of positions analyzed */
  readonly positionCount: number;
  /** Per-position risk as fraction of total equity */
  readonly positionRisks: readonly { readonly symbol: string; readonly riskPercent: number }[];
}

/**
 * Calculate risk metrics for a single position.
 *
 * @param position Position parameters
 * @returns Position risk metrics, or null if invalid input
 */
export function computePositionRisk(position: PositionInput): PositionRisk | null {
  const { entryPrice, currentPrice, stopPrice, shares, targetPrice } = position;

  if (entryPrice <= 0 || currentPrice <= 0 || shares <= 0) return null;

  const stopDistance = stopPrice > 0 ? Math.abs(entryPrice - stopPrice) : 0;
  const stopPercent = entryPrice > 0 ? stopDistance / entryPrice : 0;
  const dollarRisk = stopDistance * shares;
  const positionValue = currentPrice * shares;
  const unrealizedPnl = (currentPrice - entryPrice) * shares;
  const unrealizedPnlPercent = (currentPrice - entryPrice) / entryPrice;

  let riskRewardRatio: number | null = null;
  if (targetPrice !== undefined && targetPrice > 0 && stopDistance > 0) {
    const reward = Math.abs(targetPrice - entryPrice);
    riskRewardRatio = reward / stopDistance;
  }

  const rMultiple = stopDistance > 0 ? (currentPrice - entryPrice) / stopDistance : 0;

  return {
    stopDistance,
    stopPercent,
    dollarRisk,
    positionValue,
    unrealizedPnl,
    unrealizedPnlPercent,
    riskRewardRatio,
    rMultiple,
  };
}

/**
 * Calculate aggregate portfolio heat from multiple positions.
 *
 * @param positions Map of symbol → position input
 * @param totalEquity Total portfolio equity (including cash)
 * @returns Portfolio heat metrics, or null if no valid positions
 */
export function computePortfolioHeat(
  positions: ReadonlyMap<string, PositionInput>,
  totalEquity: number,
): PortfolioHeat | null {
  if (totalEquity <= 0 || positions.size === 0) return null;

  let totalDollarRisk = 0;
  let totalValue = 0;
  const positionRisks: { symbol: string; riskPercent: number }[] = [];

  for (const [symbol, pos] of positions) {
    const risk = computePositionRisk(pos);
    if (!risk) continue;

    totalDollarRisk += risk.dollarRisk;
    totalValue += risk.positionValue;
    positionRisks.push({
      symbol,
      riskPercent: risk.dollarRisk / totalEquity,
    });
  }

  if (positionRisks.length === 0) return null;

  // Sort by risk descending
  positionRisks.sort((a, b) => b.riskPercent - a.riskPercent);

  return {
    totalDollarRisk,
    heatPercent: totalDollarRisk / totalEquity,
    totalValue,
    positionCount: positionRisks.length,
    positionRisks,
  };
}
