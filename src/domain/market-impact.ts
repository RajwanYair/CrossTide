/**
 * Market impact model (Almgren-Chriss) — optimal execution with price impact.
 * Estimates expected cost of executing a large order over time.
 */

export interface MarketImpactParams {
  readonly totalShares: number; // order size
  readonly dailyVolume: number; // average daily volume
  readonly volatility: number; // daily return volatility
  readonly spread: number; // bid-ask spread
  readonly riskAversion: number; // trader risk aversion (λ)
}

export interface ExecutionSchedule {
  readonly periods: number;
  readonly tradeList: readonly number[]; // shares per period
  readonly expectedCost: number; // total expected cost in $
  readonly varianceCost: number; // timing risk (variance of cost)
  readonly totalCost: number; // expected + risk penalty
  readonly participationRate: number; // avg % of volume
}

/**
 * Almgren-Chriss optimal execution schedule.
 * Minimizes E[cost] + λ·Var[cost] for linear temporary and permanent impact.
 *
 * @param params - Market and order parameters
 * @param periods - Number of periods to execute over
 */
export function optimalExecution(params: MarketImpactParams, periods = 10): ExecutionSchedule {
  const { totalShares, dailyVolume, volatility, spread, riskAversion } = params;
  if (totalShares <= 0 || dailyVolume <= 0 || periods <= 0) {
    return {
      periods: 0,
      tradeList: [],
      expectedCost: 0,
      varianceCost: 0,
      totalCost: 0,
      participationRate: 0,
    };
  }

  // Impact parameters (simplified linear model)
  const eta = spread / (2 * dailyVolume); // temporary impact coefficient
  const gamma = volatility / Math.sqrt(dailyVolume); // permanent impact coefficient
  const tau = 1 / periods; // time per period

  // Optimal urgency parameter
  const kappa = Math.sqrt((riskAversion * volatility ** 2) / (eta * tau));

  // Optimal trajectory (exponential decay)
  const tradeList: number[] = [];

  if (kappa * tau > 0.01) {
    // Non-trivial urgency: exponential schedule
    const sinhKT = Math.sinh(kappa * periods * tau);
    for (let j = 0; j < periods; j++) {
      const nj =
        (totalShares *
          (Math.sinh(kappa * (periods - j) * tau) - Math.sinh(kappa * (periods - j - 1) * tau))) /
        sinhKT;
      tradeList.push(Math.max(0, nj));
    }
  } else {
    // Low urgency: uniform (TWAP)
    const perPeriod = totalShares / periods;
    for (let j = 0; j < periods; j++) tradeList.push(perPeriod);
  }

  // Expected cost components
  const expectedCost =
    permanentImpactCost(totalShares, gamma) + temporaryImpactCost(tradeList, eta, tau);
  const varianceCost = timingRisk(tradeList, volatility, tau);
  const totalCost = expectedCost + riskAversion * varianceCost;
  const participationRate = totalShares / (dailyVolume * periods);

  return { periods, tradeList, expectedCost, varianceCost, totalCost, participationRate };
}

/**
 * Permanent impact cost: γ * X² / 2
 */
function permanentImpactCost(totalShares: number, gamma: number): number {
  return 0.5 * gamma * totalShares ** 2;
}

/**
 * Temporary impact cost: η * Σ(n_j²) / τ
 */
function temporaryImpactCost(tradeList: readonly number[], eta: number, tau: number): number {
  let cost = 0;
  for (const n of tradeList) cost += (eta * n ** 2) / tau;
  return cost;
}

/**
 * Timing risk: σ² * Σ(x_j² * τ_j) where x_j is remaining inventory.
 */
function timingRisk(tradeList: readonly number[], sigma: number, tau: number): number {
  let risk = 0;
  let remaining = tradeList.reduce((s, n) => s + n, 0);
  for (const n of tradeList) {
    remaining -= n;
    risk += sigma ** 2 * remaining ** 2 * tau;
  }
  return risk;
}

/**
 * Simple square-root market impact estimate (empirical model).
 * Impact ≈ σ * √(Q / V) where Q = order size, V = daily volume.
 */
export function squareRootImpact(
  orderSize: number,
  dailyVolume: number,
  volatility: number,
): number {
  if (dailyVolume <= 0 || orderSize <= 0) return 0;
  return volatility * Math.sqrt(orderSize / dailyVolume);
}

/**
 * VWAP participation rate to achieve target time.
 */
export function vwapParticipation(
  orderSize: number,
  dailyVolume: number,
  targetHours: number,
): number {
  if (dailyVolume <= 0 || targetHours <= 0) return 0;
  const hoursInDay = 6.5; // US market hours
  const volumeInWindow = dailyVolume * (targetHours / hoursInDay);
  return orderSize / volumeInWindow;
}
