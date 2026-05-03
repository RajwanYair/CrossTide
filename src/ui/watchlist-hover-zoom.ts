/**
 * Watchlist hover zoom (L11) — shows a popup with enlarged mini-chart,
 * key stats (price, change, volume, consensus) when hovering a watchlist row.
 *
 * Provides instant preview without navigating away from the watchlist.
 */
import type { WatchlistQuote } from "./watchlist";
import { renderSparkline } from "./sparkline";
import { formatCompact } from "./number-format";

const POPUP_ID = "hover-zoom-popup";
const SHOW_DELAY_MS = 300;
const HIDE_DELAY_MS = 150;

let showTimer: ReturnType<typeof setTimeout> | null = null;
let hideTimer: ReturnType<typeof setTimeout> | null = null;
let activePopup: HTMLElement | null = null;
let activeTicker: string | null = null;

/** Quotes map reference — set by the bind function. */
let quotesRef: Map<string, WatchlistQuote> = new Map();

/** Update the quotes reference used by the hover popup. */
export function setHoverQuotes(quotes: Map<string, WatchlistQuote>): void {
  quotesRef = quotes;
}

function getOrCreatePopup(): HTMLElement {
  let popup = document.getElementById(POPUP_ID);
  if (!popup) {
    popup = document.createElement("div");
    popup.id = POPUP_ID;
    popup.className = "hover-zoom-popup";
    popup.setAttribute("role", "tooltip");
    popup.setAttribute("aria-hidden", "true");
    document.body.appendChild(popup);
  }
  return popup;
}

function formatChange(change: number, pct: number): string {
  const sign = change >= 0 ? "+" : "";
  return `${sign}${change.toFixed(2)} (${sign}${pct.toFixed(2)}%)`;
}

function renderPopupContent(ticker: string, quote: WatchlistQuote): string {
  const changeClass = quote.change >= 0 ? "change-positive" : "change-negative";
  const sparkSvg =
    quote.closes30d.length >= 2
      ? renderSparkline(quote.closes30d, { width: 200, height: 60, strokeWidth: 2 })
      : `<span class="muted">No chart data</span>`;

  const consensusHtml = quote.consensus
    ? `<span class="badge badge-${quote.consensus.direction.toLowerCase()}">${quote.consensus.direction}</span>
       <span class="muted">(${(quote.consensus.strength * 100).toFixed(0)}%)</span>`
    : `<span class="badge badge-neutral">NEUTRAL</span>`;

  return `<div class="hover-zoom-header">
    <strong class="hover-zoom-ticker">${ticker}</strong>
    ${quote.name ? `<span class="hover-zoom-name">${quote.name}</span>` : ""}
  </div>
  <div class="hover-zoom-chart">${sparkSvg}</div>
  <div class="hover-zoom-stats">
    <div class="hover-zoom-stat">
      <span class="hover-zoom-label">Price</span>
      <span class="hover-zoom-value font-mono">$${quote.price.toFixed(2)}</span>
    </div>
    <div class="hover-zoom-stat">
      <span class="hover-zoom-label">Change</span>
      <span class="hover-zoom-value font-mono ${changeClass}">${formatChange(quote.change, quote.changePercent)}</span>
    </div>
    <div class="hover-zoom-stat">
      <span class="hover-zoom-label">Volume</span>
      <span class="hover-zoom-value font-mono">${formatCompact(quote.volume)}</span>
    </div>
    <div class="hover-zoom-stat">
      <span class="hover-zoom-label">Signal</span>
      <span class="hover-zoom-value">${consensusHtml}</span>
    </div>
  </div>`;
}

function showPopup(ticker: string, anchorRect: DOMRect): void {
  const quote = quotesRef.get(ticker);
  if (!quote) return;

  const popup = getOrCreatePopup();
  popup.innerHTML = renderPopupContent(ticker, quote);
  popup.setAttribute("aria-hidden", "false");
  popup.classList.add("visible");
  activePopup = popup;
  activeTicker = ticker;

  // Position: prefer right of row, fall back to left if overflows
  const gap = 12;
  let left = anchorRect.right + gap;
  let top = anchorRect.top;

  // Ensure popup is in view
  const popupWidth = 280;
  const popupHeight = 220;

  if (left + popupWidth > window.innerWidth) {
    left = anchorRect.left - popupWidth - gap;
  }
  if (left < 0) left = gap;

  if (top + popupHeight > window.innerHeight) {
    top = window.innerHeight - popupHeight - gap;
  }
  if (top < 0) top = gap;

  popup.style.left = `${left}px`;
  popup.style.top = `${top}px`;
}

function hidePopup(): void {
  if (activePopup) {
    activePopup.classList.remove("visible");
    activePopup.setAttribute("aria-hidden", "true");
    activeTicker = null;
  }
}

function clearTimers(): void {
  if (showTimer) {
    clearTimeout(showTimer);
    showTimer = null;
  }
  if (hideTimer) {
    clearTimeout(hideTimer);
    hideTimer = null;
  }
}

/**
 * Bind hover-zoom behavior to a watchlist tbody element.
 * Returns a cleanup function that removes all listeners.
 */
export function bindHoverZoom(tbody: HTMLElement): () => void {
  function onPointerEnter(e: PointerEvent): void {
    const row = (e.target as HTMLElement).closest<HTMLElement>("tr[data-ticker]");
    if (!row) return;
    const ticker = row.dataset.ticker;
    if (!ticker) return;

    // If already showing this ticker, cancel pending hide
    if (activeTicker === ticker) {
      clearTimers();
      return;
    }

    clearTimers();
    showTimer = setTimeout(() => {
      const rect = row.getBoundingClientRect();
      showPopup(ticker, rect);
    }, SHOW_DELAY_MS);
  }

  function onPointerLeave(e: PointerEvent): void {
    const row = (e.target as HTMLElement).closest<HTMLElement>("tr[data-ticker]");
    if (!row) return;

    clearTimers();
    hideTimer = setTimeout(hidePopup, HIDE_DELAY_MS);
  }

  function onPopupEnter(): void {
    // Keep popup open when hovering the popup itself
    clearTimers();
  }

  function onPopupLeave(): void {
    clearTimers();
    hideTimer = setTimeout(hidePopup, HIDE_DELAY_MS);
  }

  tbody.addEventListener("pointerenter", onPointerEnter, true);
  tbody.addEventListener("pointerleave", onPointerLeave, true);

  // Also keep popup alive when mouse enters it
  const popup = getOrCreatePopup();
  popup.addEventListener("pointerenter", onPopupEnter);
  popup.addEventListener("pointerleave", onPopupLeave);

  return (): void => {
    clearTimers();
    hidePopup();
    tbody.removeEventListener("pointerenter", onPointerEnter, true);
    tbody.removeEventListener("pointerleave", onPointerLeave, true);
    popup.removeEventListener("pointerenter", onPopupEnter);
    popup.removeEventListener("pointerleave", onPopupLeave);
  };
}
