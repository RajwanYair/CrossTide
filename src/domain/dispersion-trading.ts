/**
 * Dispersion trading — index vol vs constituent vol, implied correlation.
 * Exploits difference between index implied vol and weighted constituent vols.
 */

export interface DispersionMetrics {
  readonly indexVol: number;
  readonly avgConstituentVol: number;
  readonly impliedCorrelation: number; // ρ_impl = (σ²_idx - Σw²σ²_i) / (Σᵢ≠ⱼ wᵢwⱼσᵢσⱼ)
  readonly realizedCorrelation: number;
  readonly dispersionSpread: number; // implied - realized correlation
  readonly signal: "sell_correlation" | "buy_correlation" | "neutral";
}

export interface ConstituentData {
  readonly weight: number;
  readonly volatility: number; // annualized vol
  readonly returns: readonly number[];
}

/**
 * Calculate implied correlation from index vol and constituent vols.
 *
 * σ²_index = Σᵢ wᵢ²σᵢ² + 2·ρ_impl · Σᵢ<ⱼ wᵢwⱼσᵢσⱼ
 *
 * Solving for ρ_impl:
 * ρ_impl = (σ²_index - Σᵢ wᵢ²σᵢ²) / (2 · Σᵢ<ⱼ wᵢwⱼσᵢσⱼ)
 *
 * @param indexVol - Index implied/realized volatility
 * @param constituents - Weights and vols of index members
 */
export function impliedCorrelation(
  indexVol: number,
  constituents: readonly ConstituentData[],
): number {
  const n = constituents.length;
  if (n < 2 || indexVol <= 0) return 0;

  // Normalize weights
  const totalW = constituents.reduce((s, c) => s + c.weight, 0);
  if (totalW <= 0) return 0;
  const weights = constituents.map((c) => c.weight / totalW);
  const vols = constituents.map((c) => c.volatility);

  // Σ wᵢ²σᵢ² (variance from individual stocks)
  let sumWiSqSiSq = 0;
  for (let i = 0; i < n; i++) {
    sumWiSqSiSq += weights[i]! ** 2 * vols[i]! ** 2;
  }

  // Σᵢ<ⱼ wᵢwⱼσᵢσⱼ (cross terms)
  let crossSum = 0;
  for (let i = 0; i < n - 1; i++) {
    for (let j = i + 1; j < n; j++) {
      crossSum += weights[i]! * weights[j]! * vols[i]! * vols[j]!;
    }
  }

  if (crossSum <= 0) return 0;

  const rhoImpl = (indexVol ** 2 - sumWiSqSiSq) / (2 * crossSum);
  return Math.max(-1, Math.min(1, rhoImpl));
}

/**
 * Calculate realized correlation from constituent return series.
 */
export function realizedCorrelation(constituents: readonly ConstituentData[]): number {
  const n = constituents.length;
  if (n < 2) return 0;

  let pairCount = 0;
  let corrSum = 0;

  for (let i = 0; i < n - 1; i++) {
    for (let j = i + 1; j < n; j++) {
      const corr = pearsonCorrelation(constituents[i]!.returns, constituents[j]!.returns);
      if (Number.isFinite(corr)) {
        corrSum += corr;
        pairCount++;
      }
    }
  }

  return pairCount > 0 ? corrSum / pairCount : 0;
}

/**
 * Full dispersion trading analysis.
 *
 * @param indexVol - Index volatility (implied or realized)
 * @param constituents - Constituent weights, vols, and return series
 * @param threshold - Signal threshold for correlation spread
 */
export function dispersionAnalysis(
  indexVol: number,
  constituents: readonly ConstituentData[],
  threshold = 0.1,
): DispersionMetrics {
  const n = constituents.length;
  if (n < 2) {
    return {
      indexVol,
      avgConstituentVol: 0,
      impliedCorrelation: 0,
      realizedCorrelation: 0,
      dispersionSpread: 0,
      signal: "neutral",
    };
  }

  const implCorr = impliedCorrelation(indexVol, constituents);
  const realCorr = realizedCorrelation(constituents);
  const avgConstituentVol = constituents.reduce((s, c) => s + c.volatility, 0) / n;
  const spread = implCorr - realCorr;

  let signal: DispersionMetrics["signal"];
  if (spread > threshold) signal = "sell_correlation";
  else if (spread < -threshold) signal = "buy_correlation";
  else signal = "neutral";

  return {
    indexVol,
    avgConstituentVol,
    impliedCorrelation: implCorr,
    realizedCorrelation: realCorr,
    dispersionSpread: spread,
    signal,
  };
}

/**
 * Compute index variance from constituent weights and correlation matrix.
 * Used for "fair value" of index vol.
 */
export function indexVarianceFromConstituents(
  constituents: readonly ConstituentData[],
  correlationMatrix: readonly (readonly number[])[],
): number {
  const n = constituents.length;
  if (n === 0) return 0;

  const totalW = constituents.reduce((s, c) => s + c.weight, 0);
  if (totalW <= 0) return 0;
  const weights = constituents.map((c) => c.weight / totalW);
  const vols = constituents.map((c) => c.volatility);

  let variance = 0;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const rho = correlationMatrix[i]?.[j] ?? (i === j ? 1 : 0);
      variance += weights[i]! * weights[j]! * vols[i]! * vols[j]! * rho;
    }
  }

  return Math.max(0, variance);
}

function pearsonCorrelation(a: readonly number[], b: readonly number[]): number {
  const n = Math.min(a.length, b.length);
  if (n < 3) return 0;

  const meanA = a.slice(0, n).reduce((s, v) => s + v, 0) / n;
  const meanB = b.slice(0, n).reduce((s, v) => s + v, 0) / n;

  let cov = 0,
    varA = 0,
    varB = 0;
  for (let i = 0; i < n; i++) {
    const da = a[i]! - meanA;
    const db = b[i]! - meanB;
    cov += da * db;
    varA += da * da;
    varB += db * db;
  }

  const denom = Math.sqrt(varA * varB);
  return denom > 0 ? cov / denom : 0;
}
