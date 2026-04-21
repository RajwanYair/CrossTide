/**
 * Consensus Engine — Pure domain logic.
 * Ported from Dart: lib/src/domain/consensus_engine.dart
 *
 * Consensus BUY: Micho BUY + at least one other method BUY.
 * Consensus SELL: Micho SELL + at least one other method SELL.
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

  const totalMethods = BUY_METHODS.size;

  let direction: SignalDirection;
  let strength: number;

  if (michoBuy && otherBuyCount >= 1) {
    direction = "BUY";
    strength = buySignals.length / totalMethods;
  } else if (michoSell && otherSellCount >= 1) {
    direction = "SELL";
    strength = sellSignals.length / totalMethods;
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
