/**
 * Alert Rules Store — CRUD for multi-condition alert rules (L3).
 *
 * Rules are persisted in localStorage and evaluated against live signals
 * to fire compound alerts (e.g. "RSI BUY AND MACD BUY").
 */
import type { AlertRule, AlertCondition, AlertOperator } from "../types/domain";

const STORAGE_KEY = "crosstide-alert-rules";
const FIRED_IDS_KEY = "crosstide-alert-rules-fired";

let rulesCache: AlertRule[] | null = null;

export function loadAlertRules(): AlertRule[] {
  if (rulesCache) return rulesCache;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    rulesCache = parsed as AlertRule[];
    return rulesCache;
  } catch {
    return [];
  }
}

export function saveAlertRules(rules: readonly AlertRule[]): void {
  rulesCache = [...rules];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rules));
}

export function addAlertRule(
  name: string,
  ticker: string,
  operator: AlertOperator,
  conditions: readonly AlertCondition[],
): AlertRule {
  const rules = loadAlertRules();
  const rule: AlertRule = {
    id: crypto.randomUUID(),
    name,
    ticker: ticker.toUpperCase(),
    operator,
    conditions,
    enabled: true,
    createdAt: new Date().toISOString(),
  };
  rules.push(rule);
  saveAlertRules(rules);
  return rule;
}

export function removeAlertRule(id: string): void {
  const rules = loadAlertRules().filter((r) => r.id !== id);
  saveAlertRules(rules);
  // Also clear from fired set
  const fired = loadFiredRuleIds();
  fired.delete(id);
  saveFiredRuleIds(fired);
}

export function toggleAlertRule(id: string): void {
  const rules = loadAlertRules();
  const idx = rules.findIndex((r) => r.id === id);
  if (idx === -1) return;
  const rule = rules[idx]!;
  rules[idx] = { ...rule, enabled: !rule.enabled };
  saveAlertRules(rules);
}

export function loadFiredRuleIds(): Set<string> {
  try {
    const raw = localStorage.getItem(FIRED_IDS_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

export function saveFiredRuleIds(ids: ReadonlySet<string>): void {
  localStorage.setItem(FIRED_IDS_KEY, JSON.stringify([...ids]));
}

export function resetFiredRule(id: string): void {
  const fired = loadFiredRuleIds();
  fired.delete(id);
  saveFiredRuleIds(fired);
}
