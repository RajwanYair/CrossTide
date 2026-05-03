/**
 * Consensus Engine — Pure domain logic.
 * Ported from Dart: lib/src/domain/consensus_engine.dart
 *
 * Consensus BUY: Micho BUY + at least one other method BUY.
 * Consensus SELL: Micho SELL + at least one other method SELL.
 *
 * Micho method is the "approved" primary method and carries 3× weight in
 * the strength score by default. Per-method weights (G20) allow users to
 * override this — a weight of 0 disables a method from the tally.
 */
import type {
  ConsensusResult,
  MethodSignal,
  MethodWeights,
  SignalDirection,
} from "../types/domain";
import { DEFAULT_METHOD_WEIGHTS } from "../types/domain";

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
 * Resolve the effective weight for a single method.
 * Uses user-provided weights, falling back to DEFAULT_METHOD_WEIGHTS, then 1.
 */
function resolveWeight(method: string, weights?: MethodWeights): number {
  if (weights && method in weights) {
    const w = weights[method as keyof MethodWeights];
    if (w !== undefined) return w;
  }
  const d = DEFAULT_METHOD_WEIGHTS[method as keyof MethodWeights];
  return d !== undefined ? d : 1;
}

/**
 * Evaluate consensus from a list of method signals for a single ticker.
 * Accepts optional per-method weights (G20); falls back to built-in defaults
 * (Micho = 3×, all others = 1×) when omitted.
 */
export function evaluateConsensus(
  ticker: string,
  signals: readonly MethodSignal[],
  weights?: MethodWeights,
): ConsensusResult {
  const buySignals = signals.filter((s) => s.direction === "BUY" && BUY_METHODS.has(s.method));
  const sellSignals = signals.filter((s) => s.direction === "SELL" && BUY_METHODS.has(s.method));

  const michoBuy = buySignals.some((s) => s.method === "Micho");
  const michoSell = sellSignals.some((s) => s.method === "Micho");

  // Weighted vote tallies
  const michoWeight = resolveWeight("Micho", weights);
  const otherBuyWeight = buySignals
    .filter((s) => s.method !== "Micho")
    .reduce((sum, s) => sum + resolveWeight(s.method, weights), 0);
  const otherSellWeight = sellSignals
    .filter((s) => s.method !== "Micho")
    .reduce((sum, s) => sum + resolveWeight(s.method, weights), 0);

  // Total theoretical denominator = sum of all active method weights
  const totalWeighted = [...BUY_METHODS].reduce((sum, m) => sum + resolveWeight(m, weights), 0);

  let direction: SignalDirection;
  let strength: number;

  const michoEnabled = michoWeight > 0;
  const otherBuyCount = buySignals.filter((s) => s.method !== "Micho").length;
  const otherSellCount = sellSignals.filter((s) => s.method !== "Micho").length;

  if (michoEnabled && michoBuy && otherBuyCount >= 1 && otherBuyWeight > 0) {
    direction = "BUY";
    strength = totalWeighted > 0 ? (michoWeight + otherBuyWeight) / totalWeighted : 0;
  } else if (michoEnabled && michoSell && otherSellCount >= 1 && otherSellWeight > 0) {
    direction = "SELL";
    strength = totalWeighted > 0 ? (michoWeight + otherSellWeight) / totalWeighted : 0;
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
