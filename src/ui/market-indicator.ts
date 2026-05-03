/**
 * Market hours status indicator — renders a live open/closed badge in the app footer.
 *
 * Shows which major exchanges are currently open/closed with a color-coded dot.
 * Updates every 60 seconds to reflect market transitions.
 */
import { isAnyMarketOpen, allMarketStatuses, type MarketStatus } from "../domain/market-hours";

const UPDATE_INTERVAL_MS = 60_000;

function statusDot(isOpen: boolean): string {
  return `<span class="market-dot ${isOpen ? "market-open" : "market-closed"}" aria-hidden="true"></span>`;
}

function formatExchangeStatus(s: MarketStatus): string {
  const dot = statusDot(s.isOpen);
  const label = s.isOpen ? "Open" : "Closed";
  return `<span class="market-exchange" title="${s.exchange}: ${label} (${s.currentLocalTime} local)">${dot}${s.exchange}</span>`;
}

function renderMarketIndicator(container: HTMLElement): void {
  const anyOpen = isAnyMarketOpen();
  const statuses = allMarketStatuses();
  const openExchanges = statuses.filter((s) => s.isOpen);
  const summaryLabel = anyOpen
    ? `Markets open: ${openExchanges.map((s) => s.exchange).join(", ")}`
    : "All markets closed";

  container.innerHTML = `
    <span class="market-indicator" role="status" aria-label="${summaryLabel}">
      ${statusDot(anyOpen)}
      <span class="market-label">${anyOpen ? "Market Open" : "Markets Closed"}</span>
      <span class="market-exchanges">${statuses.map(formatExchangeStatus).join("")}</span>
    </span>
  `;
}

/**
 * Mount the market hours indicator into an element.
 * Returns a dispose function to stop the update timer.
 */
export function mountMarketIndicator(container: HTMLElement): () => void {
  renderMarketIndicator(container);

  const timer = window.setInterval(() => {
    renderMarketIndicator(container);
  }, UPDATE_INTERVAL_MS);

  return () => {
    window.clearInterval(timer);
  };
}
