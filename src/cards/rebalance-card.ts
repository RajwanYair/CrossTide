/**
 * Rebalance Card — portfolio rebalancing UI.
 *
 * Displays current allocation vs target, drift, and suggested trades.
 * Uses domain/portfolio-rebalance for computation.
 */
import {
  calculateRebalance,
  actionableTrades,
  validateTargets,
  type CurrentHolding,
  type TargetAllocation,
  type RebalancePlan,
} from "../domain/portfolio-rebalance";
import { loadHoldings } from "./portfolio-store";
import type { CardModule } from "./registry";
import { patchDOM } from "../core/patch-dom";

// ── Default target allocations (user can override via settings) ───────────────
const DEFAULT_TARGETS: readonly TargetAllocation[] = [
  { ticker: "AAPL", weight: 0.25 },
  { ticker: "MSFT", weight: 0.25 },
  { ticker: "NVDA", weight: 0.2 },
  { ticker: "JPM", weight: 0.15 },
  { ticker: "XOM", weight: 0.15 },
];

function fmt(n: number, decimals = 2): string {
  return n.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function fmtPct(n: number): string {
  const sign = n >= 0 ? "+" : "";
  return `${sign}${fmt(n * 100, 1)}%`;
}

function driftClass(drift: number): string {
  if (drift > 0.02) return "signal-sell";
  if (drift < -0.02) return "signal-buy";
  return "";
}

function renderRebalance(container: HTMLElement, plan: RebalancePlan): void {
  if (plan.totalValue === 0) {
    patchDOM(
      container,
      `<p class="empty-state">No holdings found. Add positions in Portfolio to see rebalance suggestions.</p>`,
    );
    return;
  }

  const actionable = actionableTrades(plan);
  const statusBadge = plan.needsRebalance
    ? `<span class="badge badge-negative">Rebalance needed</span>`
    : `<span class="badge badge-positive">Balanced</span>`;

  const rows = plan.trades
    .map(
      (t) => `<tr>
      <td class="font-mono">${t.ticker}</td>
      <td class="font-mono">${fmtPct(t.currentWeight)}</td>
      <td class="font-mono">${fmtPct(t.targetWeight)}</td>
      <td class="font-mono ${driftClass(t.drift)}">${fmtPct(t.drift)}</td>
      <td class="font-mono"><span class="badge badge-${t.action === "buy" ? "positive" : t.action === "sell" ? "negative" : "neutral"}">${t.action.toUpperCase()}</span></td>
      <td class="font-mono">$${fmt(Math.abs(t.tradeAmount))}</td>
    </tr>`,
    )
    .join("");

  patchDOM(
    container,
    `<div class="card-content">
      <div class="card-header">
        <h2>Portfolio Rebalance</h2>
        ${statusBadge}
      </div>
      <p class="card-subtitle">Total value: $${fmt(plan.totalValue)} · Max drift: ${fmtPct(plan.maxDrift)} · ${actionable.length} trade(s) needed</p>
      <table class="data-table">
        <thead>
          <tr>
            <th>Ticker</th>
            <th>Current</th>
            <th>Target</th>
            <th>Drift</th>
            <th>Action</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`,
  );
}

async function mount(container: HTMLElement): Promise<void> {
  const holdings = await loadHoldings();

  const currentHoldings: CurrentHolding[] = holdings.map((h) => ({
    ticker: h.ticker,
    value: h.quantity * h.currentPrice,
  }));

  // Use default targets — in future this will be user-configurable
  const targets = DEFAULT_TARGETS;

  if (!validateTargets(targets)) {
    patchDOM(container, `<p class="empty-state">Target allocations must sum to 100%.</p>`);
    return;
  }

  const plan = calculateRebalance(currentHoldings, targets);
  renderRebalance(container, plan);
}

const cardModule: CardModule = {
  mount(container) {
    void mount(container);
  },
};

export default cardModule;
