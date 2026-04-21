/**
 * Portfolio Card — holdings display with real-time P/L.
 *
 * Phase 2 scaffold: renders a holdings table with gain/loss calculations.
 * Actual brokerage integration is out of scope.
 */

export interface Holding {
  readonly ticker: string;
  readonly shares: number;
  readonly avgCost: number; // average cost per share
  readonly currentPrice: number;
}

export interface PortfolioSummary {
  readonly holdings: readonly Holding[];
  readonly totalCost: number;
  readonly totalValue: number;
  readonly totalGain: number;
  readonly totalGainPercent: number;
}

export function computePortfolioSummary(holdings: readonly Holding[]): PortfolioSummary {
  let totalCost = 0;
  let totalValue = 0;

  for (const h of holdings) {
    totalCost += h.shares * h.avgCost;
    totalValue += h.shares * h.currentPrice;
  }

  const totalGain = totalValue - totalCost;
  const totalGainPercent = totalCost > 0 ? (totalGain / totalCost) * 100 : 0;

  return { holdings, totalCost, totalValue, totalGain, totalGainPercent };
}

export function renderPortfolio(container: HTMLElement, holdings: readonly Holding[]): void {
  const summary = computePortfolioSummary(holdings);

  if (holdings.length === 0) {
    container.innerHTML = `<p class="empty-state">No holdings. Add positions to track your portfolio.</p>`;
    return;
  }

  const rows = holdings
    .map((h) => {
      const cost = h.shares * h.avgCost;
      const value = h.shares * h.currentPrice;
      const gain = value - cost;
      const gainPct = cost > 0 ? (gain / cost) * 100 : 0;
      const cls = gain >= 0 ? "signal-buy" : "signal-sell";
      const sign = gain >= 0 ? "+" : "";
      return `<tr>
        <td class="font-mono">${escapeHtml(h.ticker)}</td>
        <td class="font-mono">${h.shares}</td>
        <td class="font-mono">$${h.avgCost.toFixed(2)}</td>
        <td class="font-mono">$${h.currentPrice.toFixed(2)}</td>
        <td class="font-mono">$${value.toFixed(2)}</td>
        <td class="font-mono ${cls}">${sign}$${gain.toFixed(2)} (${sign}${gainPct.toFixed(1)}%)</td>
      </tr>`;
    })
    .join("");

  const totalCls = summary.totalGain >= 0 ? "signal-buy" : "signal-sell";
  const totalSign = summary.totalGain >= 0 ? "+" : "";

  container.innerHTML = `
    <div class="portfolio-summary">
      <span class="text-secondary">Total Value:</span>
      <span class="font-mono">$${summary.totalValue.toFixed(2)}</span>
      <span class="${totalCls} font-mono">${totalSign}$${summary.totalGain.toFixed(2)} (${totalSign}${summary.totalGainPercent.toFixed(1)}%)</span>
    </div>
    <table class="portfolio-table" role="table" aria-label="Portfolio Holdings">
      <thead>
        <tr><th>Ticker</th><th>Shares</th><th>Avg Cost</th><th>Price</th><th>Value</th><th>Gain/Loss</th></tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
