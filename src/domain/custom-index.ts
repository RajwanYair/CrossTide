/**
 * Custom index builder — create equal-weighted or cap-weighted
 * custom indices from a basket of assets.
 */

export interface IndexComponent {
  readonly ticker: string;
  readonly prices: readonly number[]; // daily close prices
  readonly marketCap?: number; // for cap-weighted
}

export interface IndexResult {
  readonly values: readonly number[];
  readonly returns: readonly number[];
  readonly totalReturn: number;
  readonly annualizedReturn: number;
  readonly weights: Record<string, number>;
}

/**
 * Build an equal-weighted custom index from component prices.
 * All components normalized to base 100 then averaged.
 */
export function equalWeightedIndex(components: readonly IndexComponent[]): IndexResult {
  if (components.length === 0 || components[0]!.prices.length === 0) {
    return { values: [], returns: [], totalReturn: 0, annualizedReturn: 0, weights: {} };
  }

  const minLen = Math.min(...components.map((c) => c.prices.length));
  const weight = 1 / components.length;
  const values: number[] = [];

  for (let i = 0; i < minLen; i++) {
    let sum = 0;
    for (const comp of components) {
      const basePrice = comp.prices[0]!;
      if (basePrice > 0) {
        sum += (comp.prices[i]! / basePrice) * 100;
      }
    }
    values.push(sum / components.length);
  }

  const returns = computeReturns(values);
  const totalReturn = values.length > 1 ? (values[values.length - 1]! / values[0]! - 1) * 100 : 0;
  const years = minLen / 252;
  const annualizedReturn =
    years > 0 && values[0]! > 0
      ? (Math.pow(values[values.length - 1]! / values[0]!, 1 / years) - 1) * 100
      : 0;

  const weights: Record<string, number> = {};
  for (const comp of components) {
    weights[comp.ticker] = weight;
  }

  return { values, returns, totalReturn, annualizedReturn, weights };
}

/**
 * Build a market-cap-weighted custom index.
 */
export function capWeightedIndex(components: readonly IndexComponent[]): IndexResult {
  if (components.length === 0 || components[0]!.prices.length === 0) {
    return { values: [], returns: [], totalReturn: 0, annualizedReturn: 0, weights: {} };
  }

  const totalCap = components.reduce((s, c) => s + (c.marketCap ?? 0), 0);
  if (totalCap === 0) return equalWeightedIndex(components); // fallback

  const minLen = Math.min(...components.map((c) => c.prices.length));
  const values: number[] = [];
  const weights: Record<string, number> = {};

  for (const comp of components) {
    weights[comp.ticker] = (comp.marketCap ?? 0) / totalCap;
  }

  for (let i = 0; i < minLen; i++) {
    let sum = 0;
    for (const comp of components) {
      const w = weights[comp.ticker]!;
      const basePrice = comp.prices[0]!;
      if (basePrice > 0) {
        sum += w * (comp.prices[i]! / basePrice) * 100;
      }
    }
    values.push(sum);
  }

  const returns = computeReturns(values);
  const totalReturn = values.length > 1 ? (values[values.length - 1]! / values[0]! - 1) * 100 : 0;
  const years = minLen / 252;
  const annualizedReturn =
    years > 0 && values[0]! > 0
      ? (Math.pow(values[values.length - 1]! / values[0]!, 1 / years) - 1) * 100
      : 0;

  return { values, returns, totalReturn, annualizedReturn, weights };
}

/**
 * Compute daily returns from index values.
 */
function computeReturns(values: readonly number[]): number[] {
  const returns: number[] = [];
  for (let i = 1; i < values.length; i++) {
    returns.push(values[i - 1]! > 0 ? (values[i]! / values[i - 1]! - 1) * 100 : 0);
  }
  return returns;
}

/**
 * Rebalance index weights (recalculate from current prices and caps).
 */
export function rebalanceWeights(
  components: readonly IndexComponent[],
  method: "equal" | "cap" = "equal",
): Record<string, number> {
  const weights: Record<string, number> = {};

  if (method === "equal") {
    const w = 1 / components.length;
    for (const c of components) weights[c.ticker] = w;
  } else {
    const totalCap = components.reduce((s, c) => s + (c.marketCap ?? 0), 0);
    for (const c of components) {
      weights[c.ticker] = totalCap > 0 ? (c.marketCap ?? 0) / totalCap : 1 / components.length;
    }
  }

  return weights;
}
