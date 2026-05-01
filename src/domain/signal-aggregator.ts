/**
 * Signal Aggregator — runs all 12 method detectors for a ticker,
 * then feeds results into the consensus engine.
 *
 * Pure domain logic. No side effects.
 */
import type { ConsensusResult, DailyCandle, MethodSignal } from "../types/domain";
import { evaluateConsensus } from "./consensus-engine";
import { evaluate as evaluateMicho } from "./micho-method";
import { evaluate as evaluateRsi } from "./rsi-method";
import { evaluate as evaluateMacd } from "./macd-method";
import { evaluate as evaluateBollinger } from "./bollinger-method";
import { evaluate as evaluateStochastic } from "./stochastic-method";
import { evaluate as evaluateObv } from "./obv-method";
import { evaluate as evaluateAdx } from "./adx-method";
import { evaluate as evaluateCci } from "./cci-method";
import { evaluate as evaluateSar } from "./sar-method";
import { evaluate as evaluateWilliamsR } from "./williams-r-method";
import { evaluate as evaluateMfi } from "./mfi-method";
import { evaluate as evaluateSuperTrend } from "./supertrend-method";

type Detector = (ticker: string, candles: readonly DailyCandle[]) => MethodSignal | null;

const DETECTORS: readonly Detector[] = [
  evaluateMicho,
  evaluateRsi,
  evaluateMacd,
  evaluateBollinger,
  evaluateStochastic,
  evaluateObv,
  evaluateAdx,
  evaluateCci,
  evaluateSar,
  evaluateWilliamsR,
  evaluateMfi,
  evaluateSuperTrend,
];

/**
 * Run all method detectors and return their individual signals.
 * Null results (insufficient data) are excluded.
 */
export function aggregateSignals(ticker: string, candles: readonly DailyCandle[]): MethodSignal[] {
  const signals: MethodSignal[] = [];
  for (const detect of DETECTORS) {
    const sig = detect(ticker, candles);
    if (sig) signals.push(sig);
  }
  return signals;
}

/**
 * Run all 12 detectors and produce a consensus result.
 */
export function aggregateConsensus(
  ticker: string,
  candles: readonly DailyCandle[],
): ConsensusResult {
  return evaluateConsensus(ticker, aggregateSignals(ticker, candles));
}
