/**
 * Consensus Engine — Pure domain logic.
 * Ported from Dart: lib/src/domain/consensus_engine.dart
 *
 * Consensus BUY: Micho BUY + at least one other method BUY.
 * Consensus SELL: Micho SELL + at least one other method SELL.
 *
 * Micho method is the "approved" primary method and carries 3× weight in
 * the strength score (e.g. Micho BUY alone contributes 3/14 to strength,
 * reflecting its gatekeeper role).
 */
import type { ConsensusResult, MethodSignal, SignalDirection } from "../types/domain";

const BUY_METHODS = new Set([
  "Micho",
  "RSI",
  "MACD",
  "Bollinger",
  "Stochastic",
  "OBV",
  "ADX",
  "CCI",
  "SAR",
  "WilliamsR",
  "MFI",
  "SuperTrend",
]);

/** Micho carries 3× weight; other methods carry 1× each. Total weighted = 14. */
const MICHO_WEIGHT = 3;
const TOTAL_WEIGHTED = BUY_METHODS.size - 1 + MICHO_WEIGHT; // 11 + 3 = 14

/**
 * Evaluate consensus from a list of method signals for a single ticker.
 * Signals should include Micho and all secondary method signals.
 */
export function evaluateConsensus(
  ticker: string,
  signals: readonly MethodSignal[],
): ConsensusResult {
  const buySignals = signals.filter((s) => s.direction === "BUY" && BUY_METHODS.has(s.method));
  const sellSignals = signals.filter((s) => s.direction === "SELL" && BUY_METHODS.has(s.method));

  const michoBuy = buySignals.some((s) => s.method === "Micho");
  const michoSell = sellSignals.some((s) => s.method === "Micho");

  const otherBuyCount = buySignals.filter((s) => s.method !== "Micho").length;
  const otherSellCount = sellSignals.filter((s) => s.method !== "Micho").length;

  let direction: SignalDirection;
  let strength: number;

  if (michoBuy && otherBuyCount >= 1) {
    direction = "BUY";
    // Weighted: Micho contributes 3, each other contributes 1
    strength = (MICHO_WEIGHT + otherBuyCount) / TOTAL_WEIGHTED;
  } else if (michoSell && otherSellCount >= 1) {
    direction = "SELL";
    strength = (MICHO_WEIGHT + otherSellCount) / TOTAL_WEIGHTED;
  } else {
    direction = "NEUTRAL";
    strength = 0;
  }

  return {
    ticker,
    direction,
    buyMethods: buySignals,
    sellMethods: sellSignals,
    strength,
  };
}
