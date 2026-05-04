/**
 * GARCH(1,1) volatility model — Generalized Autoregressive Conditional Heteroskedasticity.
 * Models time-varying volatility with clustering effects.
 */

export interface GarchParams {
  readonly omega: number; // long-run variance weight
  readonly alpha: number; // ARCH term (yesterday's squared return)
  readonly beta: number; // GARCH term (yesterday's variance)
}

export interface GarchResult {
  readonly params: GarchParams;
  readonly conditionalVol: readonly number[];
  readonly longRunVol: number;
  readonly persistence: number; // alpha + beta (should be < 1)
  readonly halfLife: number;
}

/**
 * Estimate GARCH(1,1) parameters using variance targeting + simplified MLE.
 * Uses iterative approach for parameter estimation.
 */
export function estimateGarch(returns: readonly number[]): GarchParams {
  const n = returns.length;
  if (n < 20) return { omega: 0, alpha: 0.1, beta: 0.85 };

  // Unconditional variance (target)
  const mean = returns.reduce((s, r) => s + r, 0) / n;
  let unconditionalVar = 0;
  for (const r of returns) unconditionalVar += (r - mean) ** 2;
  unconditionalVar /= n;

  // Grid search for alpha and beta (simplified estimation)
  let bestAlpha = 0.1;
  let bestBeta = 0.85;
  let bestLogLik = -Infinity;

  for (let a = 0.01; a <= 0.3; a += 0.02) {
    for (let b = 0.5; b <= 0.98 - a; b += 0.02) {
      const omega = unconditionalVar * (1 - a - b);
      if (omega <= 0) continue;

      const logLik = garchLogLikelihood(returns, { omega, alpha: a, beta: b });
      if (logLik > bestLogLik) {
        bestLogLik = logLik;
        bestAlpha = a;
        bestBeta = b;
      }
    }
  }

  const omega = unconditionalVar * (1 - bestAlpha - bestBeta);
  return { omega: Math.max(0.0001, omega), alpha: bestAlpha, beta: bestBeta };
}

/**
 * GARCH(1,1) log-likelihood (Gaussian).
 */
function garchLogLikelihood(returns: readonly number[], params: GarchParams): number {
  const { omega, alpha, beta } = params;
  const n = returns.length;
  let sigma2 = returns.reduce((s, r) => s + r * r, 0) / n; // initialize with sample variance
  let logLik = 0;

  for (let i = 1; i < n; i++) {
    sigma2 = omega + alpha * returns[i - 1]! * returns[i - 1]! + beta * sigma2;
    if (sigma2 <= 0) sigma2 = 0.0001;
    logLik += -0.5 * (Math.log(sigma2) + (returns[i]! * returns[i]!) / sigma2);
  }

  return logLik;
}

/**
 * Compute conditional volatility series from GARCH parameters.
 */
export function garchVolatility(returns: readonly number[], params: GarchParams): number[] {
  const n = returns.length;
  if (n === 0) return [];

  const { omega, alpha, beta } = params;
  let sigma2 = returns.reduce((s, r) => s + r * r, 0) / n;
  const vols: number[] = [Math.sqrt(sigma2)];

  for (let i = 1; i < n; i++) {
    sigma2 = omega + alpha * returns[i - 1]! * returns[i - 1]! + beta * sigma2;
    if (sigma2 <= 0) sigma2 = 0.0001;
    vols.push(Math.sqrt(sigma2));
  }

  return vols;
}

/**
 * Forecast future volatility N steps ahead.
 */
export function garchForecast(
  returns: readonly number[],
  params: GarchParams,
  steps = 5,
): number[] {
  const n = returns.length;
  if (n === 0) return [];

  const { omega, alpha, beta } = params;
  const persistence = alpha + beta;
  const longRunVar = persistence < 1 ? omega / (1 - persistence) : omega;

  // Get last conditional variance
  let sigma2 = returns.reduce((s, r) => s + r * r, 0) / n;
  for (let i = 1; i < n; i++) {
    sigma2 = omega + alpha * returns[i - 1]! * returns[i - 1]! + beta * sigma2;
  }

  // Forecast (mean-reverts to long-run variance)
  const forecast: number[] = [];
  for (let h = 1; h <= steps; h++) {
    const forecastVar = longRunVar + Math.pow(persistence, h) * (sigma2 - longRunVar);
    forecast.push(Math.sqrt(Math.max(0, forecastVar)));
  }

  return forecast;
}

/**
 * Full GARCH analysis.
 */
export function garchAnalysis(returns: readonly number[]): GarchResult {
  const params = estimateGarch(returns);
  const conditionalVol = garchVolatility(returns, params);
  const persistence = params.alpha + params.beta;
  const longRunVol =
    persistence < 1
      ? Math.sqrt(params.omega / (1 - persistence))
      : (conditionalVol[conditionalVol.length - 1] ?? 0);
  const halfLife =
    persistence > 0 && persistence < 1 ? Math.log(0.5) / Math.log(persistence) : Infinity;

  return { params, conditionalVol, longRunVol, persistence, halfLife };
}
