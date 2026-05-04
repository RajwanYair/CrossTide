/**
 * Commission & slippage model for backtesting.
 *
 * Supports fixed per-trade fees, percentage-based fees, and
 * slippage estimation (% of price applied to entry and exit).
 */

export interface CommissionConfig {
  /** Fixed dollar amount per trade (applied to both entry and exit). */
  readonly fixedPerTrade: number;
  /** Percentage of trade value as commission (e.g. 0.001 = 0.1%). */
  readonly percentOfValue: number;
  /** Slippage as fraction of price (e.g. 0.0005 = 0.05%). */
  readonly slippagePct: number;
}

export const DEFAULT_COMMISSION: CommissionConfig = {
  fixedPerTrade: 0,
  percentOfValue: 0.001,
  slippagePct: 0.0005,
};

export const ZERO_COMMISSION: CommissionConfig = {
  fixedPerTrade: 0,
  percentOfValue: 0,
  slippagePct: 0,
};

/**
 * Calculate total commission for a single trade (entry + exit).
 */
export function calculateCommission(
  entryPrice: number,
  exitPrice: number,
  quantity: number,
  config: CommissionConfig,
): number {
  const entryValue = entryPrice * quantity;
  const exitValue = exitPrice * quantity;
  const entryFee = config.fixedPerTrade + entryValue * config.percentOfValue;
  const exitFee = config.fixedPerTrade + exitValue * config.percentOfValue;
  return entryFee + exitFee;
}

/**
 * Apply slippage to entry/exit prices.
 * For long trades: entry price increases, exit price decreases.
 * For short trades: entry price decreases, exit price increases.
 */
export function applySlippage(
  entryPrice: number,
  exitPrice: number,
  side: "long" | "short",
  slippagePct: number,
): { adjustedEntry: number; adjustedExit: number } {
  if (side === "long") {
    return {
      adjustedEntry: entryPrice * (1 + slippagePct),
      adjustedExit: exitPrice * (1 - slippagePct),
    };
  }
  return {
    adjustedEntry: entryPrice * (1 - slippagePct),
    adjustedExit: exitPrice * (1 + slippagePct),
  };
}

/**
 * Calculate net PnL for a trade after commission and slippage.
 */
export function netTradePnl(
  entryPrice: number,
  exitPrice: number,
  quantity: number,
  side: "long" | "short",
  config: CommissionConfig,
): number {
  const { adjustedEntry, adjustedExit } = applySlippage(
    entryPrice,
    exitPrice,
    side,
    config.slippagePct,
  );
  const direction = side === "long" ? 1 : -1;
  const grossPnl = (adjustedExit - adjustedEntry) * quantity * direction;
  const commission = calculateCommission(adjustedEntry, adjustedExit, quantity, config);
  return grossPnl - commission;
}

/**
 * Calculate total fees (commission + slippage cost) for a series of trades.
 */
export function totalFees(
  trades: readonly {
    entryPrice: number;
    exitPrice: number;
    quantity: number;
    side: "long" | "short";
  }[],
  config: CommissionConfig,
): number {
  let total = 0;
  for (const t of trades) {
    const { adjustedEntry, adjustedExit } = applySlippage(
      t.entryPrice,
      t.exitPrice,
      t.side,
      config.slippagePct,
    );
    const slippageCost =
      Math.abs(adjustedEntry - t.entryPrice) * t.quantity +
      Math.abs(adjustedExit - t.exitPrice) * t.quantity;
    const commission = calculateCommission(adjustedEntry, adjustedExit, t.quantity, config);
    total += commission + slippageCost;
  }
  return total;
}
