/**
 * Portfolio Card — holdings display with real-time P/L.
 *
 * Phase 2 scaffold: renders a holdings table with gain/loss calculations.
 * Actual brokerage integration is out of scope.
 */
import type { Holding } from "../types/domain";
import { patchDOM } from "../core/patch-dom";

export type { Holding };

export interface PortfolioSummary {
  readonly holdings: readonly Holding[];
  readonly totalCost: number;
  readonly totalValue: number;
  readonly totalGain: number;
  readonly totalGainPercent: number;
  /** Projected annual dividend income across all holdings. */
  readonly projectedAnnualIncome: number;
  /** Weighted average annual dividend yield (income / totalValue). */
  readonly averageDividendYield: number;
}

export function computePortfolioSummary(holdings: readonly Holding[]): PortfolioSummary {
  let totalCost = 0;
  let totalValue = 0;
  let projectedAnnualIncome = 0;

  for (const h of holdings) {
    totalCost += h.shares * h.avgCost;
    const holdingValue = h.shares * h.currentPrice;
    totalValue += holdingValue;
    if (h.dividendYield !== undefined) {
      projectedAnnualIncome += holdingValue * h.dividendYield;
    }
  }

  const totalGain = totalValue - totalCost;
  const totalGainPercent = totalCost > 0 ? (totalGain / totalCost) * 100 : 0;
  const averageDividendYield = totalValue > 0 ? projectedAnnualIncome / totalValue : 0;

  return {
    holdings,
    totalCost,
    totalValue,
    totalGain,
    totalGainPercent,
    projectedAnnualIncome,
    averageDividendYield,
  };
}

export function renderPortfolio(container: HTMLElement, holdings: readonly Holding[]): void {
  const summary = computePortfolioSummary(holdings);

  if (holdings.length === 0) {
    patchDOM(
      container,
      `<p class="empty-state">No holdings. Add positions to track your portfolio.</p>`,
    );
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
      const annualIncome = h.dividendYield !== undefined ? value * h.dividendYield : null;
      const divCell =
        annualIncome !== null
          ? `$${annualIncome.toFixed(2)}/yr (${(h.dividendYield! * 100).toFixed(2)}%)`
          : "—";
      return `<tr>
        <td class="font-mono">${escapeHtml(h.ticker)}</td>
        <td class="font-mono">${h.shares}</td>
        <td class="font-mono">$${h.avgCost.toFixed(2)}</td>
        <td class="font-mono">$${h.currentPrice.toFixed(2)}</td>
        <td class="font-mono">$${value.toFixed(2)}</td>
        <td class="font-mono ${cls}">${sign}$${gain.toFixed(2)} (${sign}${gainPct.toFixed(1)}%)</td>
        <td class="font-mono">${divCell}</td>
      </tr>`;
    })
    .join("");

  const totalCls = summary.totalGain >= 0 ? "signal-buy" : "signal-sell";
  const totalSign = summary.totalGain >= 0 ? "+" : "";

  patchDOM(
    container,
    `
    <div class="portfolio-summary">
      <span class="text-secondary">Total Value:</span>
      <span class="font-mono">$${summary.totalValue.toFixed(2)}</span>
      <span class="${totalCls} font-mono">${totalSign}$${summary.totalGain.toFixed(2)} (${totalSign}${summary.totalGainPercent.toFixed(1)}%)</span>
      ${
        summary.projectedAnnualIncome > 0
          ? `
      <span class="text-secondary portfolio-div-label">Proj. Annual Income:</span>
      <span class="font-mono portfolio-div-income">$${summary.projectedAnnualIncome.toFixed(2)}/yr (${(summary.averageDividendYield * 100).toFixed(2)}% avg yield)</span>`
          : ""
      }
    </div>
    <table class="portfolio-table" role="table" aria-label="Portfolio Holdings">
      <thead>
        <tr><th>Ticker</th><th>Shares</th><th>Avg Cost</th><th>Price</th><th>Value</th><th>Gain/Loss</th><th>Dividends/yr</th></tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
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
