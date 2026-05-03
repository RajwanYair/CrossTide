/**
 * Alert rules evaluator — bridges live signal data with the multi-condition
 * alert engine. Called after each data refresh cycle in main.ts.
 *
 * Collects method signals from consensus results, evaluates user-defined
 * alert rules, and fires notifications for triggered rules.
 */
import type { ConsensusResult, MethodSignal } from "../types/domain";
import { evaluateMultiConditionRules } from "../domain/alert-state-machine";
import { loadAlertRules, loadFiredRuleIds, saveFiredRuleIds } from "./alert-rules-store";
import { showNotification } from "./notifications";
import { playAlertSound } from "./alert-sound";

/**
 * Evaluate all user-defined alert rules against the latest ticker signals.
 * Call this after each data refresh.
 *
 * @param consensusMap - Map of ticker → ConsensusResult from the latest fetch
 */
export function evaluateAlertRules(consensusMap: Map<string, ConsensusResult>): void {
  const rules = loadAlertRules();
  if (rules.length === 0) return;

  const firedIds = loadFiredRuleIds();

  // Group rules by ticker for efficient evaluation
  const rulesByTicker = new Map<string, typeof rules>();
  for (const rule of rules) {
    const existing = rulesByTicker.get(rule.ticker) ?? [];
    existing.push(rule);
    rulesByTicker.set(rule.ticker, existing);
  }

  const newFiredIds = new Set(firedIds);

  for (const [ticker, tickerRules] of rulesByTicker) {
    const consensus = consensusMap.get(ticker) ?? null;
    if (!consensus) continue;

    // Combine buy and sell signals into a single MethodSignal array
    const signals: MethodSignal[] = [...consensus.buyMethods, ...consensus.sellMethods];

    const result = evaluateMultiConditionRules(tickerRules, signals, consensus, newFiredIds);

    // Merge newly fired IDs
    for (const id of result.newFiredIds) {
      newFiredIds.add(id);
    }

    // Fire notifications for newly triggered rules
    for (const alert of result.alerts) {
      playAlertSound();
      showNotification(`Alert: ${alert.ruleName}`, {
        body: `${alert.ticker} — ${alert.description}`,
      });
    }
  }

  // Persist updated fired IDs
  if (newFiredIds.size !== firedIds.size) {
    saveFiredRuleIds(newFiredIds);
  }
}
