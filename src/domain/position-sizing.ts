/**
 * Position sizing helpers — risk-based, fixed-fraction, ATR-based and
 * Kelly criterion sizing. Pure math; suitable for the screener and the
 * backtest engine.
 */

export interface RiskBasedSizingInput {
  /** Total account equity in account currency. */
  readonly accountEquity: number;
  /** Fraction of equity to risk per trade (e.g. 0.01 for 1%). */
  readonly riskPerTrade: number;
  /** Entry price. */
  readonly entry: number;
  /** Stop-loss price (must differ from entry). */
  readonly stopLoss: number;
}

/**
 * Position size (in shares/units) such that the loss from entry to
 * stop equals `accountEquity * riskPerTrade`.
 */
export function riskBasedSize(input: RiskBasedSizingInput): number {
  const { accountEquity, riskPerTrade, entry, stopLoss } = input;
  if (accountEquity <= 0 || riskPerTrade <= 0) return 0;
  const perUnitRisk = Math.abs(entry - stopLoss);
  if (perUnitRisk === 0) return 0;
  const dollarRisk = accountEquity * riskPerTrade;
  return dollarRisk / perUnitRisk;
}

export interface AtrSizingInput {
  readonly accountEquity: number;
  readonly riskPerTrade: number;
  readonly atr: number;
  /** ATR multiplier for stop distance. Default 2. */
  readonly atrMultiplier?: number;
}

/**
 * Position size based on ATR. Equivalent to risk-based sizing where
 * stop distance is `atrMultiplier * atr`.
 */
export function atrBasedSize(input: AtrSizingInput): number {
  const { accountEquity, riskPerTrade, atr } = input;
  const mult = input.atrMultiplier ?? 2;
  if (accountEquity <= 0 || riskPerTrade <= 0 || atr <= 0 || mult <= 0) return 0;
  return (accountEquity * riskPerTrade) / (atr * mult);
}

/**
 * Fixed-fractional sizing — invest a fixed fraction of account equity.
 */
export function fixedFractionalSize(
  accountEquity: number,
  fraction: number,
  price: number,
): number {
  if (accountEquity <= 0 || fraction <= 0 || price <= 0) return 0;
  return (accountEquity * fraction) / price;
}

export interface KellyInput {
  /** Win probability in [0,1]. */
  readonly winRate: number;
  /** Average win amount (positive). */
  readonly avgWin: number;
  /** Average loss amount (positive). */
  readonly avgLoss: number;
}

/**
 * Kelly fraction (in [0,1]). Returns 0 when inputs are nonsensical or
 * the formula would suggest a negative size. The classic formula is
 * f* = W - (1-W)/R where R = avgWin/avgLoss.
 */
export function kellyFraction(input: KellyInput): number {
  const { winRate, avgWin, avgLoss } = input;
  if (winRate <= 0 || winRate >= 1) return 0;
  if (avgWin <= 0 || avgLoss <= 0) return 0;
  const r = avgWin / avgLoss;
  const f = winRate - (1 - winRate) / r;
  if (f <= 0) return 0;
  return Math.min(1, f);
}

/**
 * "Half-Kelly" sized share count — practical compromise that reduces
 * the variance of full-Kelly sizing.
 */
export function halfKellySize(input: KellyInput, accountEquity: number, price: number): number {
  if (accountEquity <= 0 || price <= 0) return 0;
  const f = kellyFraction(input) / 2;
  return (accountEquity * f) / price;
}

// ── Q9: Unified backtest position sizing config ───────────────────────────────

export type BacktestSizingMode = "fixed" | "percentage" | "kelly";

export interface BacktestSizingConfig {
  readonly mode: BacktestSizingMode;
  /** For "fixed" mode: number of shares per trade. */
  readonly fixedQuantity?: number;
  /** For "percentage" mode: fraction of equity (e.g. 0.1 = 10%). */
  readonly percentOfEquity?: number;
  /** For "kelly" mode: Kelly fraction multiplier (e.g. 0.5 = half Kelly). */
  readonly kellyMultiplier?: number;
}

export const DEFAULT_BACKTEST_SIZING: BacktestSizingConfig = {
  mode: "fixed",
  fixedQuantity: 100,
};

/**
 * Compute share count for a backtest trade using the configured sizing mode.
 */
export function computeBacktestShares(
  config: BacktestSizingConfig,
  equity: number,
  price: number,
  stats?: KellyInput,
): number {
  if (price <= 0 || equity <= 0) return 0;

  switch (config.mode) {
    case "fixed":
      return config.fixedQuantity ?? 100;
    case "percentage": {
      const pct = config.percentOfEquity ?? 0.1;
      return Math.max(1, Math.floor((equity * pct) / price));
    }
    case "kelly": {
      const mult = config.kellyMultiplier ?? 0.5;
      const kf = stats ? kellyFraction(stats) : 0;
      const effectiveFraction = Math.min(kf * mult, 0.25); // Cap at 25%
      if (effectiveFraction <= 0) return 1;
      return Math.max(1, Math.floor((equity * effectiveFraction) / price));
    }
  }
}
