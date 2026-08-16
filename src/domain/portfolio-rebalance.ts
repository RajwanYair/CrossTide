/**
 * Portfolio rebalance calculator — compute trades needed to
 * bring a portfolio back to target allocation weights.
 */

export interface CurrentHolding {
  readonly ticker: string;
  readonly value: number;
}

export interface TargetAllocation {
  readonly ticker: string;
  readonly weight: number; // 0–1, should sum to 1
}

export interface RebalanceTrade {
  readonly ticker: string;
  readonly currentWeight: number;
  readonly targetWeight: number;
  readonly drift: number; // target - current (positive = buy, negative = sell)
  readonly tradeAmount: number; // dollar amount to trade
  readonly action: "buy" | "sell" | "hold";
}

export interface RebalancePlan {
  readonly trades: readonly RebalanceTrade[];
  readonly totalValue: number;
  readonly maxDrift: number;
  readonly needsRebalance: boolean;
  readonly explanation: RebalanceExplanation;
}

/** Explains why a rebalance plan recommends what it recommends. */
export interface RebalanceExplanation {
  /** Drift fraction beyond which a trade is recommended instead of held. */
  readonly driftThreshold: number;
  /** Ticker with the largest absolute drift from target, or null with no targets. */
  readonly largestDrift: { readonly ticker: string; readonly drift: number } | null;
  /** Holdings present in the portfolio but absent from the target allocation — implicitly targeted at 0% weight. */
  readonly untrackedHoldings: readonly string[];
  /** Caveats a consumer should know before acting on this plan. */
  readonly limitations: readonly string[];
}

/**
 * Calculate rebalance trades to match target allocation.
 */
export function calculateRebalance(
  holdings: readonly CurrentHolding[],
  targets: readonly TargetAllocation[],
  driftThreshold = 0.02,
): RebalancePlan {
  const totalValue = holdings.reduce((sum, h) => sum + h.value, 0);
  if (totalValue === 0) {
    return {
      trades: [],
      totalValue: 0,
      maxDrift: 0,
      needsRebalance: false,
      explanation: {
        driftThreshold,
        largestDrift: null,
        untrackedHoldings: [],
        limitations: ["Portfolio has no value — no trades can be computed."],
      },
    };
  }

  const holdingMap = new Map<string, number>();
  for (const h of holdings) {
    holdingMap.set(h.ticker, (holdingMap.get(h.ticker) ?? 0) + h.value);
  }

  const trades: RebalanceTrade[] = [];
  let maxDrift = 0;
  let largestDrift: { ticker: string; drift: number } | null = null;

  for (const target of targets) {
    const currentValue = holdingMap.get(target.ticker) ?? 0;
    const currentWeight = currentValue / totalValue;
    const drift = target.weight - currentWeight;
    const tradeAmount = drift * totalValue;
    const absDrift = Math.abs(drift);

    if (absDrift > maxDrift) maxDrift = absDrift;
    if (!largestDrift || absDrift > Math.abs(largestDrift.drift)) {
      largestDrift = { ticker: target.ticker, drift };
    }

    let action: "buy" | "sell" | "hold";
    if (drift > driftThreshold) action = "buy";
    else if (drift < -driftThreshold) action = "sell";
    else action = "hold";

    trades.push({
      ticker: target.ticker,
      currentWeight,
      targetWeight: target.weight,
      drift,
      tradeAmount,
      action,
    });
  }

  const targetTickers = new Set(targets.map((t) => t.ticker));
  const untrackedHoldings = [...holdingMap.keys()].filter((ticker) => !targetTickers.has(ticker));

  const limitations: string[] = [];
  if (untrackedHoldings.length > 0) {
    limitations.push(
      `${untrackedHoldings.length} holding(s) have no target weight and are treated as 0% target: ${untrackedHoldings.join(", ")}.`,
    );
  }
  if (targets.length === 0) {
    limitations.push("No target allocation was supplied — no trades can be computed.");
  }

  const needsRebalance = maxDrift > driftThreshold;
  return {
    trades,
    totalValue,
    maxDrift,
    needsRebalance,
    explanation: { driftThreshold, largestDrift, untrackedHoldings, limitations },
  };
}

/**
 * Get only trades that require action (excludes holds).
 */
export function actionableTrades(plan: RebalancePlan): RebalanceTrade[] {
  return plan.trades.filter((t) => t.action !== "hold");
}

/**
 * Get total buy amount needed.
 */
export function totalBuyAmount(plan: RebalancePlan): number {
  return plan.trades.filter((t) => t.action === "buy").reduce((s, t) => s + t.tradeAmount, 0);
}

/**
 * Get total sell amount needed.
 */
export function totalSellAmount(plan: RebalancePlan): number {
  return plan.trades
    .filter((t) => t.action === "sell")
    .reduce((s, t) => s + Math.abs(t.tradeAmount), 0);
}

/**
 * Calculate the number of shares to trade given a price.
 */
export function sharesToTrade(tradeAmount: number, price: number): number {
  if (price <= 0) return 0;
  return Math.floor(Math.abs(tradeAmount) / price);
}

/**
 * Validate that target allocations sum to approximately 1.
 */
export function validateTargets(targets: readonly TargetAllocation[]): boolean {
  const sum = targets.reduce((s, t) => s + t.weight, 0);
  return Math.abs(sum - 1) < 0.001;
}
