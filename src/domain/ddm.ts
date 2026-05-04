/**
 * Dividend Discount Model (DDM) — intrinsic value estimation.
 * Implements Gordon Growth Model and multi-stage DDM.
 */

export interface DDMResult {
  readonly intrinsicValue: number;
  readonly dividendYield: number;
  readonly impliedGrowth: number;
  readonly marginOfSafety: number; // (intrinsic - price) / intrinsic
}

/**
 * Gordon Growth Model: P = D1 / (r - g)
 * @param dividend - Current annual dividend (D0)
 * @param growthRate - Perpetual dividend growth rate (g)
 * @param discountRate - Required rate of return (r)
 * @returns Intrinsic value per share
 */
export function gordonGrowthModel(
  dividend: number,
  growthRate: number,
  discountRate: number,
): number {
  if (discountRate <= growthRate) return Infinity; // Model invalid
  if (dividend <= 0) return 0;
  const d1 = dividend * (1 + growthRate);
  return d1 / (discountRate - growthRate);
}

/**
 * Two-stage DDM: high growth for N years, then terminal perpetuity.
 * @param dividend - Current annual dividend (D0)
 * @param highGrowth - Growth rate during high-growth phase
 * @param terminalGrowth - Perpetual growth rate after transition
 * @param discountRate - Required rate of return
 * @param highGrowthYears - Duration of high-growth phase
 */
export function twoStageDDM(
  dividend: number,
  highGrowth: number,
  terminalGrowth: number,
  discountRate: number,
  highGrowthYears: number,
): number {
  if (discountRate <= terminalGrowth) return Infinity;
  if (dividend <= 0) return 0;

  let pvDividends = 0;
  let currentDiv = dividend;

  // Phase 1: high growth dividends
  for (let t = 1; t <= highGrowthYears; t++) {
    currentDiv *= 1 + highGrowth;
    pvDividends += currentDiv / Math.pow(1 + discountRate, t);
  }

  // Phase 2: terminal value (Gordon Growth on last dividend)
  const terminalDiv = currentDiv * (1 + terminalGrowth);
  const terminalValue = terminalDiv / (discountRate - terminalGrowth);
  const pvTerminal = terminalValue / Math.pow(1 + discountRate, highGrowthYears);

  return pvDividends + pvTerminal;
}

/**
 * H-Model: smooth transition from high to stable growth.
 * P = D0 * (1+g_l) / (r - g_l) + D0 * H * (g_s - g_l) / (r - g_l)
 * where H = half-life of high-growth period.
 */
export function hModelDDM(
  dividend: number,
  shortTermGrowth: number,
  longTermGrowth: number,
  discountRate: number,
  halfLife: number,
): number {
  if (discountRate <= longTermGrowth) return Infinity;
  if (dividend <= 0) return 0;

  const stableValue = (dividend * (1 + longTermGrowth)) / (discountRate - longTermGrowth);
  const growthPremium =
    (dividend * halfLife * (shortTermGrowth - longTermGrowth)) / (discountRate - longTermGrowth);

  return stableValue + growthPremium;
}

/**
 * Implied growth rate from current price and dividend.
 * Solves P = D1 / (r - g) for g.
 */
export function impliedGrowthRate(price: number, dividend: number, discountRate: number): number {
  if (price <= 0 || dividend <= 0) return 0;
  // g = r - D1/P = r - D0*(1+g)/P ... approximate: g ≈ r - D0/P (first order)
  // Exact: P*(r-g) = D0*(1+g) => Pr - Pg = D0 + D0*g => g(P + D0) = Pr - D0 => g = (Pr - D0)/(P + D0)
  return (price * discountRate - dividend) / (price + dividend);
}

/**
 * Full DDM analysis given current price.
 */
export function ddmAnalysis(
  price: number,
  dividend: number,
  growthRate: number,
  discountRate: number,
): DDMResult {
  const intrinsicValue = gordonGrowthModel(dividend, growthRate, discountRate);
  const dividendYield = dividend / price;
  const impliedGrowth = impliedGrowthRate(price, dividend, discountRate);
  const marginOfSafety =
    intrinsicValue === Infinity ? 1 : (intrinsicValue - price) / intrinsicValue;

  return { intrinsicValue, dividendYield, impliedGrowth, marginOfSafety };
}
