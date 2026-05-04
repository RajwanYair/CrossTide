/**
 * Data freshness indicator — renders aggregate freshness status in the footer.
 */

import { getAllFreshness, type FreshnessLevel } from "../core/data-freshness";

const LEVEL_PRIORITY: Record<FreshnessLevel, number> = { expired: 2, stale: 1, fresh: 0 };

export function updateFreshnessIndicator(): void {
  const el = document.getElementById("data-freshness");
  if (!el) return;

  const all = getAllFreshness();
  if (all.length === 0) {
    el.textContent = "";
    el.className = "";
    return;
  }

  // Determine worst freshness level across all tickers
  let worst: FreshnessLevel = "fresh";
  for (const status of all) {
    if (LEVEL_PRIORITY[status.level] > LEVEL_PRIORITY[worst]) {
      worst = status.level;
    }
  }

  // Compute aggregate label
  const oldestMs = Math.max(...all.map((s) => s.ageMs));
  const label = worst === "fresh" ? "Live" : formatAge(oldestMs);

  el.textContent = label;
  el.className = `freshness-badge freshness-${worst}`;
  el.title = `Data freshness: ${all.length} ticker(s) — oldest: ${formatAge(oldestMs)}`;
}

function formatAge(ms: number): string {
  if (!isFinite(ms) || ms < 0) return "—";
  const mins = Math.floor(ms / 60_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  return `${Math.floor(mins / 60)}h ago`;
}
