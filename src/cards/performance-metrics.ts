/**
 * Performance Metrics Card — renders risk/return summary for a portfolio or backtest.
 *
 * Displays Sharpe, Sortino, MaxDrawdown, total return, win rate in a summary card.
 */

export interface PerformanceMetrics {
  readonly totalReturn: number; // e.g. 0.15 = 15%
  readonly annualizedReturn: number;
  readonly sharpeRatio: number | null;
  readonly sortinoRatio: number | null;
  readonly maxDrawdown: number; // 0-1
  readonly winRate: number | null; // 0-1
  readonly tradeCount: number;
  readonly profitFactor: number | null;
}

/**
 * Format a ratio to 2 decimal places, or "N/A" if null.
 */
export function formatRatio(value: number | null): string {
  return value === null ? "N/A" : value.toFixed(2);
}

/**
 * Format a percentage (0.15 → "+15.00%").
 */
export function formatPercent(value: number): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${(value * 100).toFixed(2)}%`;
}

/**
 * Classify performance quality based on metrics.
 */
export function classifyPerformance(
  metrics: PerformanceMetrics,
): "excellent" | "good" | "fair" | "poor" {
  const { sharpeRatio, maxDrawdown, totalReturn } = metrics;
  if (sharpeRatio !== null && sharpeRatio >= 2 && maxDrawdown < 0.1 && totalReturn > 0.2)
    return "excellent";
  if (sharpeRatio !== null && sharpeRatio >= 1 && maxDrawdown < 0.2 && totalReturn > 0)
    return "good";
  if (totalReturn >= 0) return "fair";
  return "poor";
}

/**
 * Render the performance metrics card.
 */
export function renderPerformanceMetrics(
  container: HTMLElement,
  label: string,
  metrics: PerformanceMetrics,
): void {
  const quality = classifyPerformance(metrics);
  const qualityBadge = `<span class="badge badge-${quality}">${quality}</span>`;

  const rows = [
    { label: "Total Return", value: formatPercent(metrics.totalReturn) },
    { label: "Annualized Return", value: formatPercent(metrics.annualizedReturn) },
    { label: "Sharpe Ratio", value: formatRatio(metrics.sharpeRatio) },
    { label: "Sortino Ratio", value: formatRatio(metrics.sortinoRatio) },
    { label: "Max Drawdown", value: formatPercent(-metrics.maxDrawdown) },
    { label: "Win Rate", value: metrics.winRate !== null ? formatPercent(metrics.winRate) : "N/A" },
    { label: "Trades", value: String(metrics.tradeCount) },
    { label: "Profit Factor", value: formatRatio(metrics.profitFactor) },
  ];

  const html = rows
    .map(
      (r) =>
        `<tr><td class="text-secondary">${escapeHtml(r.label)}</td><td class="font-mono">${escapeHtml(r.value)}</td></tr>`,
    )
    .join("");

  container.innerHTML = `
    <div class="perf-metrics-card">
      <div class="perf-header">
        <h3>${escapeHtml(label)}</h3>
        ${qualityBadge}
      </div>
      <table class="perf-metrics-table" role="table" aria-label="Performance Metrics">
        <tbody>${html}</tbody>
      </table>
    </div>
  `;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
