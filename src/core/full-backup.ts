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

  return {
    watchlist: config.watchlist,
    theme: config.theme,
    methodWeights: config.methodWeights,
    cardSettings: config.cardSettings as Record<string, unknown> | undefined,
    drawings: exportAllDrawings(),
    alertRules: loadAlertRules(),
    ...runtimeDomains,
  };
}
