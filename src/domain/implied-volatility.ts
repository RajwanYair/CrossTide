/**
 * Implied volatility surface — construct vol smile/skew from option prices.
 * Uses Newton-Raphson for IV extraction and interpolates across strikes/expiries.
 */

export interface OptionQuote {
  readonly strike: number;
  readonly expiry: number; // time to expiry in years
  readonly price: number; // market price
  readonly type: "call" | "put";
  readonly spot: number;
  readonly rate: number; // risk-free rate
}

export interface IVPoint {
  readonly strike: number;
  readonly expiry: number;
  readonly iv: number;
  readonly moneyness: number; // strike / spot
  readonly delta: number;
}

export interface VolSurface {
  readonly points: readonly IVPoint[];
  readonly atmVol: number; // at-the-money implied vol
  readonly skew: number; // slope of smile (25d put - 25d call)
  readonly kurtosis: number; // curvature of smile (wing vol - atm vol)
  readonly termStructure: readonly { expiry: number; atmVol: number }[];
}

/**
 * Extract implied volatility from an option price using Newton-Raphson.
 * Inverts Black-Scholes to find σ such that BS(σ) = marketPrice.
 *
 * @param quote - Option quote with market price
 * @param maxIter - Maximum Newton-Raphson iterations
 */
export function impliedVolatility(quote: OptionQuote, maxIter = 50): number {
  const { strike, expiry, price, type, spot, rate } = quote;
  if (expiry <= 0 || price <= 0 || spot <= 0 || strike <= 0) return 0;

  // Initial guess: Brenner-Subrahmanyam approximation
  let sigma = Math.sqrt((2 * Math.PI) / expiry) * (price / spot);
  sigma = Math.max(0.01, Math.min(5, sigma));

  for (let i = 0; i < maxIter; i++) {
    const bs = blackScholes(spot, strike, expiry, rate, sigma, type);
    const vega = bsVega(spot, strike, expiry, rate, sigma);

    if (vega < 1e-12) break;

    const diff = bs - price;
    sigma -= diff / vega;
    sigma = Math.max(0.001, Math.min(10, sigma));

    if (Math.abs(diff) < 1e-8) break;
  }

  return sigma;
}

/**
 * Build a volatility surface from multiple option quotes.
 */
export function buildVolSurface(quotes: readonly OptionQuote[]): VolSurface {
  if (quotes.length === 0) {
    return { points: [], atmVol: 0, skew: 0, kurtosis: 0, termStructure: [] };
  }

  const points: IVPoint[] = [];
  const spot = quotes[0]!.spot;

  for (const quote of quotes) {
    const iv = impliedVolatility(quote);
    if (iv > 0.001 && iv < 5) {
      const moneyness = quote.strike / spot;
      const delta = bsDelta(spot, quote.strike, quote.expiry, quote.rate, iv, quote.type);
      points.push({ strike: quote.strike, expiry: quote.expiry, iv, moneyness, delta });
    }
  }

  // ATM vol: closest to moneyness = 1
  const sortedByMoneyness = [...points].sort(
    (a, b) => Math.abs(a.moneyness - 1) - Math.abs(b.moneyness - 1),
  );
  const atmVol = sortedByMoneyness.length > 0 ? sortedByMoneyness[0]!.iv : 0;

  // Skew: difference between OTM put and OTM call vol (25-delta)
  const puts25d = points.filter((p) => p.delta < -0.2 && p.delta > -0.3);
  const calls25d = points.filter((p) => p.delta > 0.2 && p.delta < 0.3);
  const avgPut25d =
    puts25d.length > 0 ? puts25d.reduce((s, p) => s + p.iv, 0) / puts25d.length : atmVol;
  const avgCall25d =
    calls25d.length > 0 ? calls25d.reduce((s, p) => s + p.iv, 0) / calls25d.length : atmVol;
  const skew = avgPut25d - avgCall25d;

  // Kurtosis: average wing vol minus ATM
  const wings = points.filter((p) => Math.abs(p.moneyness - 1) > 0.1);
  const avgWingVol = wings.length > 0 ? wings.reduce((s, p) => s + p.iv, 0) / wings.length : atmVol;
  const kurtosis = avgWingVol - atmVol;

  // Term structure: ATM vol per expiry
  const expiries = [...new Set(points.map((p) => p.expiry))].sort((a, b) => a - b);
  const termStructure = expiries.map((exp) => {
    const expiryPoints = points.filter((p) => p.expiry === exp);
    const closest = expiryPoints.sort(
      (a, b) => Math.abs(a.moneyness - 1) - Math.abs(b.moneyness - 1),
    );
    return { expiry: exp, atmVol: closest.length > 0 ? closest[0]!.iv : 0 };
  });

  return { points, atmVol, skew, kurtosis, termStructure };
}

/**
 * Black-Scholes option price.
 */
export function blackScholes(
  S: number,
  K: number,
  T: number,
  r: number,
  sigma: number,
  type: "call" | "put",
): number {
  const d1 = (Math.log(S / K) + (r + 0.5 * sigma * sigma) * T) / (sigma * Math.sqrt(T));
  const d2 = d1 - sigma * Math.sqrt(T);

  if (type === "call") {
    return S * normalCdf(d1) - K * Math.exp(-r * T) * normalCdf(d2);
  }
  return K * Math.exp(-r * T) * normalCdf(-d2) - S * normalCdf(-d1);
}

/**
 * Black-Scholes vega (∂price/∂σ).
 */
function bsVega(S: number, K: number, T: number, r: number, sigma: number): number {
  const d1 = (Math.log(S / K) + (r + 0.5 * sigma * sigma) * T) / (sigma * Math.sqrt(T));
  return S * Math.sqrt(T) * normalPdf(d1);
}

/**
 * Black-Scholes delta.
 */
function bsDelta(
  S: number,
  K: number,
  T: number,
  r: number,
  sigma: number,
  type: "call" | "put",
): number {
  const d1 = (Math.log(S / K) + (r + 0.5 * sigma * sigma) * T) / (sigma * Math.sqrt(T));
  return type === "call" ? normalCdf(d1) : normalCdf(d1) - 1;
}

function normalCdf(x: number): number {
  return 0.5 * (1 + erf(x / Math.SQRT2));
}

function normalPdf(x: number): number {
  return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
}

function erf(x: number): number {
  const sign = x >= 0 ? 1 : -1;
  const t = 1 / (1 + 0.3275911 * Math.abs(x));
  const y =
    1 -
    ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) *
      t *
      Math.exp(-x * x);
  return sign * y;
}
