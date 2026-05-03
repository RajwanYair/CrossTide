/**
 * Alert History Card — displays fired alert timeline.
 *
 * Renders a list of historical alerts with filtering by ticker, type, direction.
 * Persisted via IndexedDB (consumer responsibility).
 */
import type { SignalDirection, AlertRecord } from "../types/domain";
import { patchDOM } from "../core/patch-dom";

export type { AlertRecord };

export interface AlertHistoryFilter {
  readonly ticker?: string;
  readonly direction?: SignalDirection;
  readonly since?: string; // ISO 8601
}

export function filterAlerts(
  alerts: readonly AlertRecord[],
  filter: AlertHistoryFilter,
): AlertRecord[] {
  return alerts.filter((a) => {
    if (filter.ticker && a.ticker !== filter.ticker.toUpperCase()) return false;
    if (filter.direction && a.direction !== filter.direction) return false;
    if (filter.since && a.firedAt < filter.since) return false;
    return true;
  });
}

export function renderAlertHistory(
  container: HTMLElement,
  alerts: readonly AlertRecord[],
  filter?: AlertHistoryFilter,
): void {
  const filtered = filter ? filterAlerts(alerts, filter) : [...alerts];
  filtered.sort((a, b) => b.firedAt.localeCompare(a.firedAt)); // newest first

  if (filtered.length === 0) {
    patchDOM(container, `<p class="empty-state">No alerts match the current filter.</p>`);
    return;
  }

  const rows = filtered
    .map(
      (a) => `<tr class="alert-row alert-${escapeHtml(a.direction.toLowerCase())}">
      <td>${escapeHtml(a.firedAt.slice(0, 16).replace("T", " "))}</td>
      <td class="font-mono">${escapeHtml(a.ticker)}</td>
      <td><span class="badge badge-${escapeHtml(a.direction.toLowerCase())}">${escapeHtml(a.direction)}</span></td>
      <td>${escapeHtml(a.alertType)}</td>
      <td class="text-secondary">${escapeHtml(a.description)}</td>
    </tr>`,
    )
    .join("");

  patchDOM(
    container,
    `
    <table class="alert-history-table" role="table" aria-label="Alert History">
      <thead>
        <tr>
          <th>Time</th>
          <th>Ticker</th>
          <th>Direction</th>
          <th>Type</th>
          <th>Description</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <p class="text-secondary">${filtered.length} alert${filtered.length !== 1 ? "s" : ""}</p>
  `,
  );
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
