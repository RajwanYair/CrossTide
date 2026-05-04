/**
 * Fama-French factor model — multi-factor attribution for portfolio returns.
 * 3-factor: R - Rf = α + β_mkt(Rm-Rf) + β_smb·SMB + β_hml·HML + ε
 */

export interface FactorExposures {
  readonly alpha: number; // intercept (skill / mispricing)
  readonly betaMarket: number; // market beta
  readonly betaSMB: number; // size factor loading (Small Minus Big)
  readonly betaHML: number; // value factor loading (High Minus Low)
  readonly rSquared: number; // model explanatory power
  readonly residualVol: number; // idiosyncratic volatility
}

export interface FactorAttribution {
  readonly exposures: FactorExposures;
  readonly marketContribution: number;
  readonly smbContribution: number;
  readonly hmlContribution: number;
  readonly alphaContribution: number;
  readonly totalExplained: number;
}

/**
 * Estimate Fama-French 3-factor exposures via OLS.
 *
 * @param excessReturns - Portfolio returns minus risk-free rate
 * @param marketExcess - Market returns minus risk-free rate
 * @param smb - Small-minus-big factor returns
 * @param hml - High-minus-low factor returns
 */
export function famaFrench3Factor(
  excessReturns: readonly number[],
  marketExcess: readonly number[],
  smb: readonly number[],
  hml: readonly number[],
): FactorExposures {
  const n = Math.min(excessReturns.length, marketExcess.length, smb.length, hml.length);
  if (n < 10)
    return { alpha: 0, betaMarket: 1, betaSMB: 0, betaHML: 0, rSquared: 0, residualVol: 0 };

  // Multiple OLS: Y = Xβ via normal equations (X'X)^-1 X'Y
  // X = [1, mkt, smb, hml], β = [α, β_mkt, β_smb, β_hml]
  const k = 4;
  const XtX = new Array(k).fill(0).map(() => new Array(k).fill(0) as number[]);
  const XtY = new Array(k).fill(0) as number[];

  for (let i = 0; i < n; i++) {
    const x = [1, marketExcess[i]!, smb[i]!, hml[i]!];
    const y = excessReturns[i]!;

    for (let j = 0; j < k; j++) {
      XtY[j] += x[j]! * y;
      for (let l = 0; l < k; l++) {
        XtX[j]![l] += x[j]! * x[l]!;
      }
    }
  }

  // Solve via Gaussian elimination
  const beta = solveLinearSystem(XtX, XtY);
  if (!beta)
    return { alpha: 0, betaMarket: 1, betaSMB: 0, betaHML: 0, rSquared: 0, residualVol: 0 };

  // Compute R² and residual volatility
  const meanY = excessReturns.slice(0, n).reduce((s, v) => s + v, 0) / n;
  let ssTot = 0,
    ssRes = 0;
  for (let i = 0; i < n; i++) {
    const predicted =
      beta[0]! + beta[1]! * marketExcess[i]! + beta[2]! * smb[i]! + beta[3]! * hml[i]!;
    const residual = excessReturns[i]! - predicted;
    ssRes += residual ** 2;
    ssTot += (excessReturns[i]! - meanY) ** 2;
  }

  const rSquared = ssTot > 0 ? 1 - ssRes / ssTot : 0;
  const residualVol = Math.sqrt(ssRes / (n - k));

  return {
    alpha: beta[0]!,
    betaMarket: beta[1]!,
    betaSMB: beta[2]!,
    betaHML: beta[3]!,
    rSquared: Math.max(0, Math.min(1, rSquared)),
    residualVol,
  };
}

/**
 * Decompose returns into factor contributions.
 */
export function factorAttribution(
  excessReturns: readonly number[],
  marketExcess: readonly number[],
  smb: readonly number[],
  hml: readonly number[],
): FactorAttribution {
  const exposures = famaFrench3Factor(excessReturns, marketExcess, smb, hml);
  const n = Math.min(excessReturns.length, marketExcess.length, smb.length, hml.length);

  const avgMkt = marketExcess.slice(0, n).reduce((s, v) => s + v, 0) / n;
  const avgSmb = smb.slice(0, n).reduce((s, v) => s + v, 0) / n;
  const avgHml = hml.slice(0, n).reduce((s, v) => s + v, 0) / n;

  const marketContribution = exposures.betaMarket * avgMkt;
  const smbContribution = exposures.betaSMB * avgSmb;
  const hmlContribution = exposures.betaHML * avgHml;
  const alphaContribution = exposures.alpha;
  const totalExplained = marketContribution + smbContribution + hmlContribution + alphaContribution;

  return {
    exposures,
    marketContribution,
    smbContribution,
    hmlContribution,
    alphaContribution,
    totalExplained,
  };
}

/**
 * Single-factor CAPM beta (convenience function).
 */
export function capmBeta(
  assetReturns: readonly number[],
  marketReturns: readonly number[],
): number {
  const n = Math.min(assetReturns.length, marketReturns.length);
  if (n < 3) return 1;

  const meanA = assetReturns.slice(0, n).reduce((s, v) => s + v, 0) / n;
  const meanM = marketReturns.slice(0, n).reduce((s, v) => s + v, 0) / n;

  let cov = 0,
    varM = 0;
  for (let i = 0; i < n; i++) {
    cov += (assetReturns[i]! - meanA) * (marketReturns[i]! - meanM);
    varM += (marketReturns[i]! - meanM) ** 2;
  }

  return varM > 0 ? cov / varM : 1;
}

/**
 * Solve linear system Ax = b using Gaussian elimination with partial pivoting.
 */
function solveLinearSystem(A: number[][], b: number[]): number[] | null {
  const n = A.length;
  const aug = A.map((row, i) => [...row, b[i]!]);

  for (let col = 0; col < n; col++) {
    // Partial pivot
    let maxRow = col;
    for (let row = col + 1; row < n; row++) {
      if (Math.abs(aug[row]![col]!) > Math.abs(aug[maxRow]![col]!)) maxRow = row;
    }
    [aug[col], aug[maxRow]] = [aug[maxRow]!, aug[col]!];

    if (Math.abs(aug[col]![col]!) < 1e-12) return null;

    // Eliminate
    for (let row = col + 1; row < n; row++) {
      const factor = aug[row]![col]! / aug[col]![col]!;
      for (let j = col; j <= n; j++) {
        aug[row]![j] -= factor * aug[col]![j]!;
      }
    }
  }

  // Back-substitution
  const x = new Array(n).fill(0) as number[];
  for (let i = n - 1; i >= 0; i--) {
    let sum = aug[i]![n]!;
    for (let j = i + 1; j < n; j++) sum -= aug[i]![j]! * x[j]!;
    x[i] = sum / aug[i]![i]!;
  }

  return x;
}
