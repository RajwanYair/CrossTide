/**
 * Provider Health Card — renders a status dashboard for data providers.
 *
 * Shows availability, latency, and error counts for each provider in the chain.
 */
import type { ProviderHealth } from "../providers/types";
import { patchDOM } from "../core/patch-dom";

export interface ProviderHealthSnapshot {
  readonly providers: readonly ProviderHealth[];
  readonly lastRefreshAt: number; // Unix ms
}

/**
 * Compute an aggregate health summary.
 */
export function computeHealthSummary(snapshot: ProviderHealthSnapshot): {
  totalProviders: number;
  availableCount: number;
  degraded: boolean;
  allDown: boolean;
} {
  const total = snapshot.providers.length;
  const available = snapshot.providers.filter((p) => p.available).length;
  return {
    totalProviders: total,
    availableCount: available,
    degraded: available > 0 && available < total,
    allDown: available === 0 && total > 0,
  };
}

/**
 * Format a unix timestamp to relative time string.
 */
export function formatRelativeTime(ts: number | null, now: number): string {
  if (ts === null) return "never";
  const diffMs = now - ts;
  if (diffMs < 60_000) return "just now";
  if (diffMs < 3_600_000) return `${Math.floor(diffMs / 60_000)}m ago`;
  if (diffMs < 86_400_000) return `${Math.floor(diffMs / 3_600_000)}h ago`;
  return `${Math.floor(diffMs / 86_400_000)}d ago`;
}

/**
 * Render the provider health dashboard.
 */
export function renderProviderHealth(
  container: HTMLElement,
  snapshot: ProviderHealthSnapshot,
): void {
  const summary = computeHealthSummary(snapshot);
  const now = snapshot.lastRefreshAt;

  if (snapshot.providers.length === 0) {
    patchDOM(container, `<p class="empty-state">No providers configured.</p>`);
    return;
  }

  const statusBadge = summary.allDown
    ? `<span class="badge badge-error">All Down</span>`
    : summary.degraded
      ? `<span class="badge badge-warning">Degraded</span>`
      : `<span class="badge badge-success">Healthy</span>`;

  const rows = snapshot.providers
    .map((p) => {
      const statusClass = p.available ? "status-ok" : "status-error";
      const icon = p.available ? "&#x2714;" : "&#x2718;";
      return `<tr class="${statusClass}">
        <td>${escapeHtml(p.name)}</td>
        <td>${icon} ${p.available ? "Up" : "Down"}</td>
        <td>${formatRelativeTime(p.lastSuccessAt, now)}</td>
        <td>${formatRelativeTime(p.lastErrorAt, now)}</td>
        <td>${p.consecutiveErrors}</td>
      </tr>`;
    })
    .join("");

  patchDOM(
    container,
    `
    <div class="provider-health-header">
      <h3>Provider Health</h3>
      ${statusBadge}
      <span class="text-secondary">${summary.availableCount}/${summary.totalProviders} available</span>
    </div>
    <table class="provider-health-table" role="table" aria-label="Provider Health">
      <thead>
        <tr><th>Provider</th><th>Status</th><th>Last Success</th><th>Last Error</th><th>Errors</th></tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `,
  );
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
