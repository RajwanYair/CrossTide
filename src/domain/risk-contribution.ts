/**
 * Risk contribution (Euler decomposition) — marginal and component risk.
 * Decomposes portfolio VaR/volatility into per-asset contributions.
 */

export interface RiskDecomposition {
  readonly portfolioRisk: number;
  readonly marginalRisk: readonly number[]; // ∂σ/∂wᵢ
  readonly componentRisk: readonly number[]; // wᵢ * ∂σ/∂wᵢ
  readonly percentContribution: readonly number[]; // component / total (sums to 1)
}

/**
 * Euler risk decomposition for portfolio volatility.
 *
 * Portfolio variance: σ² = w'Σw
 * Marginal contribution: MC_i = (Σw)_i / σ
 * Component contribution: RC_i = w_i * MC_i
 * Property: Σ RC_i = σ (Euler's theorem for homogeneous functions)
 *
 * @param weights - Portfolio weights
 * @param covarianceMatrix - Asset covariance matrix
 */
export function eulerDecomposition(
  weights: readonly number[],
  covarianceMatrix: readonly (readonly number[])[],
): RiskDecomposition {
  const n = weights.length;
  if (n === 0) return emptyDecomp();

  // Portfolio variance: w'Σw
  let portVariance = 0;
  const sigmaW: number[] = new Array(n).fill(0) as number[];

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const cov = covarianceMatrix[i]?.[j] ?? 0;
      sigmaW[i] += cov * weights[j]!;
      portVariance += weights[i]! * cov * weights[j]!;
    }
  }

  const portfolioRisk = Math.sqrt(Math.max(0, portVariance));
  if (portfolioRisk === 0) return emptyDecomp();

  // Marginal risk: (Σw)_i / σ
  const marginalRisk = sigmaW.map((sw) => sw / portfolioRisk);

  // Component risk: w_i * MC_i
  const componentRisk = weights.map((w, i) => w * marginalRisk[i]!);

  // Percent contribution
  const totalComponent = componentRisk.reduce((s, c) => s + c, 0);
  const percentContribution =
    totalComponent !== 0
      ? componentRisk.map((c) => c / totalComponent)
      : componentRisk.map(() => 1 / n);

  return { portfolioRisk, marginalRisk, componentRisk, percentContribution };
}

/**
 * Risk parity weights — find weights where all assets have equal risk contribution.
 * Uses iterative gradient descent.
 *
 * @param covarianceMatrix - Asset covariance matrix
 * @param maxIter - Maximum iterations
 */
export function riskParityWeights(
  covarianceMatrix: readonly (readonly number[])[],
  maxIter = 500,
  tol = 1e-8,
): readonly number[] {
  const n = covarianceMatrix.length;
  if (n === 0) return [];

  // Start with equal weights
  let weights = new Array(n).fill(1 / n) as number[];
  const targetRC = 1 / n;

  for (let iter = 0; iter < maxIter; iter++) {
    const decomp = eulerDecomposition(weights, covarianceMatrix);
    if (decomp.portfolioRisk === 0) break;

    // Gradient: move toward equal percent contribution
    let maxDiff = 0;
    const newWeights = new Array(n) as number[];
    for (let i = 0; i < n; i++) {
      const diff = decomp.percentContribution[i]! - targetRC;
      maxDiff = Math.max(maxDiff, Math.abs(diff));
      // Adjust weight inversely proportional to its risk contribution
      newWeights[i] = weights[i]! * (targetRC / Math.max(1e-10, decomp.percentContribution[i]!));
    }

    // Normalize
    const sum = newWeights.reduce((s, w) => s + w, 0);
    weights = newWeights.map((w) => w / sum);

    if (maxDiff < tol) break;
  }

  return weights;
}

/**
 * Incremental VaR: how much does adding asset i increase portfolio VaR?
 *
 * IVaR_i = z_α * MC_i * w_i
 * where z_α is the normal quantile for VaR level
 */
export function incrementalVaR(
  weights: readonly number[],
  covarianceMatrix: readonly (readonly number[])[],
  confidenceLevel = 0.95,
): readonly number[] {
  const decomp = eulerDecomposition(weights, covarianceMatrix);
  const zAlpha = normalQuantile(confidenceLevel);
  return decomp.componentRisk.map((cr) => zAlpha * cr);
}

function normalQuantile(p: number): number {
  if (p <= 0) return -Infinity;
  if (p >= 1) return Infinity;
  const t = p < 0.5 ? p : 1 - p;
  const s = Math.sqrt(-2 * Math.log(t));
  const z =
    s -
    (2.515517 + 0.802853 * s + 0.010328 * s * s) /
      (1 + 1.432788 * s + 0.189269 * s * s + 0.001308 * s * s * s);
  return p < 0.5 ? -z : z;
}

function emptyDecomp(): RiskDecomposition {
  return { portfolioRisk: 0, marginalRisk: [], componentRisk: [], percentContribution: [] };
}
