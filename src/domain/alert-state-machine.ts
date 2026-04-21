/**
 * Alert State Machine — Pure domain logic.
 * Ported from Dart: lib/src/domain/entities.dart (AlertType, TickerAlertState)
 *
 * Tracks per-ticker alert state to enforce idempotent alerting:
 * a signal only fires once until the opposite condition resets it.
 */
import type { ConsensusResult, MethodSignal, SignalDirection } from "../types/domain";

/** All supported alert event types. */
export type AlertType =
  | "sma200CrossUp"
  | "sma150CrossUp"
  | "sma50CrossUp"
  | "michoMethodBuy"
  | "michoMethodSell"
  | "rsiMethodBuy"
  | "rsiMethodSell"
  | "macdMethodBuy"
  | "macdMethodSell"
  | "bollingerMethodBuy"
  | "bollingerMethodSell"
  | "stochasticMethodBuy"
  | "stochasticMethodSell"
  | "obvMethodBuy"
  | "obvMethodSell"
  | "adxMethodBuy"
  | "adxMethodSell"
  | "cciMethodBuy"
  | "cciMethodSell"
  | "sarMethodBuy"
  | "sarMethodSell"
  | "williamsRMethodBuy"
  | "williamsRMethodSell"
  | "mfiMethodBuy"
  | "mfiMethodSell"
  | "supertrendMethodBuy"
  | "supertrendMethodSell"
  | "consensusBuy"
  | "consensusSell";

/** A fired alert record. */
export interface FiredAlert {
  readonly ticker: string;
  readonly alertType: AlertType;
  readonly direction: SignalDirection;
  readonly description: string;
  readonly firedAt: string; // ISO 8601
}

/** Per-ticker alert state — tracks which alerts have already fired. */
export interface TickerAlertState {
  readonly ticker: string;
  /** Set of alert types that have already fired and not been reset. */
  readonly firedAlerts: ReadonlySet<AlertType>;
  readonly lastEvaluatedAt: string | null;
}

/** Default enabled alert types for a new ticker. */
export const DEFAULT_ENABLED_ALERTS: ReadonlySet<AlertType> = new Set<AlertType>([
  "michoMethodBuy",
  "michoMethodSell",
  "rsiMethodBuy",
  "rsiMethodSell",
  "macdMethodBuy",
  "macdMethodSell",
  "bollingerMethodBuy",
  "bollingerMethodSell",
  "consensusBuy",
  "consensusSell",
]);

/** Create a fresh alert state for a ticker. */
export function createAlertState(ticker: string): TickerAlertState {
  return { ticker, firedAlerts: new Set(), lastEvaluatedAt: null };
}

/** Map a MethodSignal to BUY/SELL alert types. */
function methodAlertTypes(method: string): { buy: AlertType; sell: AlertType } | null {
  const MAP: Record<string, { buy: AlertType; sell: AlertType }> = {
    Micho: { buy: "michoMethodBuy", sell: "michoMethodSell" },
    RSI: { buy: "rsiMethodBuy", sell: "rsiMethodSell" },
    MACD: { buy: "macdMethodBuy", sell: "macdMethodSell" },
    Bollinger: { buy: "bollingerMethodBuy", sell: "bollingerMethodSell" },
    Stochastic: { buy: "stochasticMethodBuy", sell: "stochasticMethodSell" },
    OBV: { buy: "obvMethodBuy", sell: "obvMethodSell" },
    ADX: { buy: "adxMethodBuy", sell: "adxMethodSell" },
    CCI: { buy: "cciMethodBuy", sell: "cciMethodSell" },
    SAR: { buy: "sarMethodBuy", sell: "sarMethodSell" },
    WilliamsR: { buy: "williamsRMethodBuy", sell: "williamsRMethodSell" },
    MFI: { buy: "mfiMethodBuy", sell: "mfiMethodSell" },
    SuperTrend: { buy: "supertrendMethodBuy", sell: "supertrendMethodSell" },
  };
  return MAP[method] ?? null;
}

/**
 * Evaluate method signals against the current alert state.
 * Returns new alerts that should fire and the updated state.
 *
 * Idempotent: a BUY alert only fires once until a SELL resets it (and vice versa).
 */
export function evaluateAlerts(
  state: TickerAlertState,
  signals: readonly MethodSignal[],
  consensus: ConsensusResult | null,
  enabledAlerts: ReadonlySet<AlertType> = DEFAULT_ENABLED_ALERTS,
  now: string = new Date().toISOString(),
): { alerts: FiredAlert[]; nextState: TickerAlertState } {
  const newFired = new Set(state.firedAlerts);
  const alerts: FiredAlert[] = [];

  for (const sig of signals) {
    const types = methodAlertTypes(sig.method);
    if (!types) continue;

    if (sig.direction === "BUY" && enabledAlerts.has(types.buy) && !state.firedAlerts.has(types.buy)) {
      alerts.push({ ticker: state.ticker, alertType: types.buy, direction: "BUY", description: sig.description, firedAt: now });
      newFired.add(types.buy);
      newFired.delete(types.sell); // reset opposite
    } else if (sig.direction === "SELL" && enabledAlerts.has(types.sell) && !state.firedAlerts.has(types.sell)) {
      alerts.push({ ticker: state.ticker, alertType: types.sell, direction: "SELL", description: sig.description, firedAt: now });
      newFired.add(types.sell);
      newFired.delete(types.buy); // reset opposite
    } else if (sig.direction === "NEUTRAL") {
      // Reset both sides so next BUY/SELL can fire again
      newFired.delete(types.buy);
      newFired.delete(types.sell);
    }
  }

  // Consensus alerts
  if (consensus) {
    if (consensus.direction === "BUY" && enabledAlerts.has("consensusBuy") && !state.firedAlerts.has("consensusBuy")) {
      alerts.push({ ticker: state.ticker, alertType: "consensusBuy", direction: "BUY", description: `Consensus BUY (strength ${(consensus.strength * 100).toFixed(0)}%)`, firedAt: now });
      newFired.add("consensusBuy");
      newFired.delete("consensusSell");
    } else if (consensus.direction === "SELL" && enabledAlerts.has("consensusSell") && !state.firedAlerts.has("consensusSell")) {
      alerts.push({ ticker: state.ticker, alertType: "consensusSell", direction: "SELL", description: `Consensus SELL (strength ${(consensus.strength * 100).toFixed(0)}%)`, firedAt: now });
      newFired.add("consensusSell");
      newFired.delete("consensusBuy");
    } else if (consensus.direction === "NEUTRAL") {
      newFired.delete("consensusBuy");
      newFired.delete("consensusSell");
    }
  }

  return {
    alerts,
    nextState: { ticker: state.ticker, firedAlerts: newFired, lastEvaluatedAt: now },
  };
}
