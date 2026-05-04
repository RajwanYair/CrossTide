/**
 * @crosstide/domain — shared domain barrel export.
 *
 * Re-exports core domain modules that are shared between the app and worker.
 * This package serves as the future home for all domain logic once the
 * monorepo migration is complete. Currently re-exports from src/domain.
 */

export { computeRenko, suggestBrickSize } from "../../src/domain/renko";
export type { RenkoBrick, RenkoInput } from "../../src/domain/renko";

export { computeRangeBars, suggestRangeSize } from "../../src/domain/range-bars";
export type { RangeBar, RangeBarInput } from "../../src/domain/range-bars";

export {
  calculateCommission,
  applySlippage,
  netTradePnl,
  totalFees,
} from "../../src/domain/commission";
export type { CommissionConfig } from "../../src/domain/commission";

export { computeBacktestShares } from "../../src/domain/position-sizing";
export type { BacktestSizingMode, BacktestSizingConfig } from "../../src/domain/position-sizing";

export { heikinAshi } from "../../src/domain/heikin-ashi";
export type { Candle, HeikinAshiCandle } from "../../src/domain/heikin-ashi";
