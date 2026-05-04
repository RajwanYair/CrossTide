/**
 * Black-Scholes option pricing model and Greeks.
 * Pure math — no options chain data required.
 */

/**
 * Cumulative standard normal distribution (Abramowitz & Stegun approximation).
 */
function normCdf(x: number): number {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = x < 0 ? -1 : 1;
  const abs = Math.abs(x);
  const t = 1 / (1 + p * abs);
  const y = 1 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp((-abs * abs) / 2);

  return 0.5 * (1 + sign * y);
}

/**
 * Standard normal PDF.
 */
function normPdf(x: number): number {
  return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
}

export interface BlackScholesInput {
  readonly S: number; // Current stock price
  readonly K: number; // Strike price
  readonly T: number; // Time to expiration (years)
  readonly r: number; // Risk-free rate (annual)
  readonly sigma: number; // Implied volatility (annual)
}

export interface OptionPrice {
  readonly call: number;
  readonly put: number;
}

export interface Greeks {
  readonly delta: number;
  readonly gamma: number;
  readonly theta: number; // per day
  readonly vega: number; // per 1% vol move
  readonly rho: number; // per 1% rate move
}

/**
 * Calculate d1 and d2 for Black-Scholes formula.
 */
function d1d2(input: BlackScholesInput): { d1: number; d2: number } {
  const { S, K, T, r, sigma } = input;
  if (T <= 0 || sigma <= 0 || S <= 0 || K <= 0) return { d1: 0, d2: 0 };

  const d1 = (Math.log(S / K) + (r + 0.5 * sigma * sigma) * T) / (sigma * Math.sqrt(T));
  const d2 = d1 - sigma * Math.sqrt(T);
  return { d1, d2 };
}

/**
 * Black-Scholes European option pricing.
 */
export function blackScholes(input: BlackScholesInput): OptionPrice {
  const { S, K, T, r } = input;
  if (T <= 0 || S <= 0 || K <= 0) {
    // At expiration: intrinsic value
    return { call: Math.max(0, S - K), put: Math.max(0, K - S) };
  }

  const { d1, d2 } = d1d2(input);
  const discount = Math.exp(-r * T);

  const call = S * normCdf(d1) - K * discount * normCdf(d2);
  const put = K * discount * normCdf(-d2) - S * normCdf(-d1);

  return { call: Math.max(0, call), put: Math.max(0, put) };
}

/**
 * Calculate option Greeks for a call.
 */
export function callGreeks(input: BlackScholesInput): Greeks {
  const { S, K, T, r, sigma } = input;
  if (T <= 0 || sigma <= 0 || S <= 0 || K <= 0) {
    return { delta: 0, gamma: 0, theta: 0, vega: 0, rho: 0 };
  }

  const { d1, d2 } = d1d2(input);
  const sqrtT = Math.sqrt(T);
  const discount = Math.exp(-r * T);

  const delta = normCdf(d1);
  const gamma = normPdf(d1) / (S * sigma * sqrtT);
  const theta = (-(S * normPdf(d1) * sigma) / (2 * sqrtT) - r * K * discount * normCdf(d2)) / 365;
  const vega = (S * sqrtT * normPdf(d1)) / 100;
  const rho = (K * T * discount * normCdf(d2)) / 100;

  return { delta, gamma, theta, vega, rho };
}

/**
 * Calculate option Greeks for a put.
 */
export function putGreeks(input: BlackScholesInput): Greeks {
  const { S, K, T, r, sigma } = input;
  if (T <= 0 || sigma <= 0 || S <= 0 || K <= 0) {
    return { delta: 0, gamma: 0, theta: 0, vega: 0, rho: 0 };
  }

  const { d1, d2 } = d1d2(input);
  const sqrtT = Math.sqrt(T);
  const discount = Math.exp(-r * T);

  const delta = normCdf(d1) - 1;
  const gamma = normPdf(d1) / (S * sigma * sqrtT);
  const theta = (-(S * normPdf(d1) * sigma) / (2 * sqrtT) + r * K * discount * normCdf(-d2)) / 365;
  const vega = (S * sqrtT * normPdf(d1)) / 100;
  const rho = -(K * T * discount * normCdf(-d2)) / 100;

  return { delta, gamma, theta, vega, rho };
}

/**
 * Implied volatility via bisection method.
 */
export function impliedVolatility(
  marketPrice: number,
  S: number,
  K: number,
  T: number,
  r: number,
  type: "call" | "put",
  tolerance = 0.0001,
  maxIter = 100,
): number {
  let low = 0.001;
  let high = 5.0;

  for (let i = 0; i < maxIter; i++) {
    const mid = (low + high) / 2;
    const price = blackScholes({ S, K, T, r, sigma: mid });
    const modelPrice = type === "call" ? price.call : price.put;

    if (Math.abs(modelPrice - marketPrice) < tolerance) return mid;

    if (modelPrice > marketPrice) {
      high = mid;
    } else {
      low = mid;
    }
  }

  return (low + high) / 2;
}
