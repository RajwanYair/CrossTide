/**
 * Consensus dashboard card — renders per-ticker 12-method breakdown.
 */
import type { ConsensusResult, MethodSignal, SignalDirection } from "../types/domain";

export function renderConsensus(
  container: HTMLElement,
  ticker: string,
  result: ConsensusResult | null,
): void {
  if (!result) {
    container.innerHTML = `<p class="empty-state">No consensus data for ${escapeHtml(ticker)}.</p>`;
    return;
  }

  const strengthPct = (result.strength * 100).toFixed(0);
  const dirClass =
    result.direction === "BUY"
      ? "signal-buy"
      : result.direction === "SELL"
        ? "signal-sell"
        : "signal-neutral";

  const header = `
    <div class="consensus-header">
      <h3>${escapeHtml(ticker)}</h3>
      <span class="badge badge-${result.direction.toLowerCase()}">${result.direction}</span>
      <span class="consensus-strength ${dirClass}">${strengthPct}% strength</span>
    </div>`;

  const allMethods: readonly MethodSignal[] = [...result.buyMethods, ...result.sellMethods];
  const grid = renderMethodGrid(allMethods, result.direction);

  container.innerHTML = header + grid;
}

function renderMethodGrid(methods: readonly MethodSignal[], overall: SignalDirection): string {
  if (methods.length === 0) {
    return `<p class="empty-state">No method signals yet.</p>`;
  }

  const cards = methods.map((m) => renderMethodCard(m)).join("");
  return `<div class="consensus-grid" data-overall="${overall}">${cards}</div>`;
}

function renderMethodCard(signal: MethodSignal): string {
  const cls = signal.direction === "BUY" ? "buy" : signal.direction === "SELL" ? "sell" : "neutral";
  return `<div class="method-card">
    <div class="method-indicator ${cls}"></div>
    <div>
      <div class="method-name">${escapeHtml(signal.method)}</div>
      <div class="method-detail">${escapeHtml(signal.description)}</div>
    </div>
    <div class="method-direction badge badge-${cls}">${signal.direction}</div>
  </div>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
