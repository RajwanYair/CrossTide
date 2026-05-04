/**
 * Dashboard stats footer — renders live statistics in the app footer.
 *
 * Shows: watchlist count, active providers, and overall data freshness.
 * Updates reactively when tickerDataStore or provider state changes.
 */
import { tickerDataStore } from "../core/app-store";
import { getHealthSnapshot } from "../providers/provider-registry";
import { getAllFreshness } from "../core/data-freshness";
import { loadConfig } from "../core/config";

const STATS_ID = "dashboard-stats";

export interface DashboardStats {
  readonly watchlistCount: number;
  readonly activeProviders: number;
  readonly totalProviders: number;
  readonly freshCount: number;
  readonly staleCount: number;
  readonly expiredCount: number;
}

export function gatherStats(): DashboardStats {
  const config = loadConfig();
  const watchlistCount = config.tickers.length;
  const snapshot = getHealthSnapshot();
  const activeProviders = snapshot.entries.filter((e) => e.breakerState !== "open").length;
  const totalProviders = snapshot.entries.length;
  const freshness = getAllFreshness();
  let freshCount = 0;
  let staleCount = 0;
  let expiredCount = 0;
  for (const f of freshness) {
    if (f.level === "fresh") freshCount++;
    else if (f.level === "stale") staleCount++;
    else expiredCount++;
  }
  return { watchlistCount, activeProviders, totalProviders, freshCount, staleCount, expiredCount };
}

function renderStatsHTML(stats: DashboardStats): string {
  return (
    `<span class="stat-item" title="Watchlist tickers">📋 ${stats.watchlistCount}</span>` +
    `<span class="stat-item" title="Active providers">${stats.activeProviders}/${stats.totalProviders} providers</span>` +
    `<span class="stat-item stat-fresh" title="Fresh data">● ${stats.freshCount}</span>` +
    `<span class="stat-item stat-stale" title="Stale data">● ${stats.staleCount}</span>` +
    `<span class="stat-item stat-expired" title="Expired data">● ${stats.expiredCount}</span>`
  );
}

/**
 * Initialize the dashboard stats footer element.
 * Inserts a stats span into #app-footer and subscribes to data changes.
 * Returns a cleanup function.
 */
export function initDashboardStats(): () => void {
  const footer = document.getElementById("app-footer");
  if (!footer) return () => {};

  let statsEl = document.getElementById(STATS_ID);
  if (!statsEl) {
    statsEl = document.createElement("span");
    statsEl.id = STATS_ID;
    statsEl.className = "dashboard-stats";
    footer.insertBefore(statsEl, footer.firstChild);
  }

  function update(): void {
    const stats = gatherStats();
    statsEl!.innerHTML = renderStatsHTML(stats);
  }

  update();
  const unsub = tickerDataStore.subscribe(update);
  return (): void => {
    unsub();
    statsEl?.remove();
  };
}
