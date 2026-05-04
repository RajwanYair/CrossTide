/**
 * Risk parity allocator — compute portfolio weights where each
 * asset contributes equally to total portfolio risk.
 */

export interface RiskParityInput {
  readonly volatilities: readonly number[]; // annualized vol per asset (decimal)
  readonly labels?: readonly string[];
}

export interface RiskParityResult {
  readonly weights: readonly number[];
  readonly labels: readonly string[];
  readonly riskContributions: readonly number[];
  readonly portfolioVol: number;
}

/**
 * Inverse-volatility weighting (simplest risk parity).
 * Each asset weighted by 1/vol, then normalized to sum to 1.
 */
export function inverseVolWeights(volatilities: readonly number[]): number[] {
  if (volatilities.length === 0) return [];

  const invVols = volatilities.map((v) => (v > 0 ? 1 / v : 0));
  const sum = invVols.reduce((s, w) => s + w, 0);

  if (sum === 0) return volatilities.map(() => 1 / volatilities.length);
  return invVols.map((w) => w / sum);
}

/**
 * Compute risk contribution of each asset.
 * Risk contribution = weight * volatility (simplified, assumes no correlation).
 */
export function riskContributions(
  weights: readonly number[],
  volatilities: readonly number[],
): number[] {
  const rawContrib = weights.map((w, i) => w * volatilities[i]!);
  const totalRisk = rawContrib.reduce((s, r) => s + r, 0);
  if (totalRisk === 0) return weights.map(() => 0);
  return rawContrib.map((r) => r / totalRisk);
}

/**
 * Full risk parity allocation.
 */
export function riskParityAllocate(input: RiskParityInput): RiskParityResult {
  const { volatilities, labels } = input;
  const weights = inverseVolWeights(volatilities);
  const contributions = riskContributions(weights, volatilities);

  // Portfolio vol (simplified: weighted sum assuming no correlation = upper bound)
  const portfolioVol = weights.reduce((s, w, i) => s + w * volatilities[i]!, 0);

  return {
    weights,
    labels: labels ?? volatilities.map((_, i) => `Asset ${i + 1}`),
    riskContributions: contributions,
    portfolioVol,
  };
}

/**
 * Equal-weight allocation for comparison.
 */
export function equalWeight(n: number): number[] {
  if (n <= 0) return [];
  return Array.from({ length: n }, () => 1 / n);
}

/**
 * Compare risk parity vs equal weight allocations.
 */
export function compareAllocations(volatilities: readonly number[]): {
  riskParity: number[];
  equalWt: number[];
  riskParityVol: number;
  equalWtVol: number;
} {
  const riskParity = inverseVolWeights(volatilities);
  const equalWt = equalWeight(volatilities.length);

  const rpVol = riskParity.reduce((s, w, i) => s + w * volatilities[i]!, 0);
  const ewVol = equalWt.reduce((s, w, i) => s + w * volatilities[i]!, 0);

  return {
    riskParity,
    equalWt,
    riskParityVol: rpVol,
    equalWtVol: ewVol,
  };
}
