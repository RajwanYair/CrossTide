/**
 * Full backup collector — gathers all exportable state from localStorage
 * into a FullExportDomains object suitable for exportFullDataJson().
 */

import type { FullExportDomains } from "./data-export";
import { loadConfig } from "./config";
import { loadAlertRules } from "./alert-rules-store";
import { exportAllDrawings } from "../cards/drawing-persistence";

/**
 * Collect all app state into a single export payload.
 * Pass in runtime-only data (alerts, holdings, backtest) that live in memory.
 */
export function collectFullBackup(
  runtimeDomains: Pick<FullExportDomains, "alerts" | "holdings" | "backtestResult"> = {},
): FullExportDomains {
  const config = loadConfig();

  const base: FullExportDomains = {
    watchlist: config.watchlist,
    theme: config.theme,
    drawings: exportAllDrawings(),
    alertRules: loadAlertRules(),
    ...runtimeDomains,
  };

  if (config.methodWeights) {
    const cleaned: Record<string, number> = {};
    for (const [k, v] of Object.entries(config.methodWeights)) {
      if (v !== undefined) cleaned[k] = v;
    }
    (base as { methodWeights?: Record<string, number> }).methodWeights = cleaned;
  }

  if (config.cardSettings) {
    (base as { cardSettings?: Record<string, unknown> }).cardSettings =
      config.cardSettings as Record<string, unknown>;
  }

  return base;
}
