/**
 * Watchlist renderer — renders the watchlist table from state.
 */
import type { AppConfig, ConsensusResult, SignalDirection } from "../types/domain";
import { renderSparkline } from "./sparkline";

interface TickerQuote {
  ticker: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  avgVolume: number;
  high52w: number;
  low52w: number;
  closes30d: readonly number[];
  consensus: ConsensusResult | null;
}

export function renderWatchlist(config: AppConfig, quotes: Map<string, TickerQuote>): void {
  const tbody = document.getElementById("watchlist-body");
  const emptyMsg = document.getElementById("watchlist-empty");
  if (!tbody) return;

  if (config.watchlist.length === 0) {
    tbody.innerHTML = "";
    emptyMsg?.classList.remove("hidden");
    return;
  }

  emptyMsg?.classList.add("hidden");

  const rows = config.watchlist
    .map((entry) => {
      const q = quotes.get(entry.ticker);
      return renderRow(entry.ticker, q ?? null);
    })
    .join("");

  tbody.innerHTML = rows;
}

function renderRow(ticker: string, quote: TickerQuote | null): string {
  const price = quote ? formatPrice(quote.price) : "--";
  const change = quote ? formatChange(quote.change, quote.changePercent) : "--";
  const changeClass = quote ? (quote.change >= 0 ? "change-positive" : "change-negative") : "";
  const consensus = quote?.consensus
    ? renderBadge(quote.consensus.direction)
    : renderBadge("NEUTRAL");
  const volume = quote ? formatVolume(quote.volume) : "--";
  const sparkline = quote && quote.closes30d.length >= 2 ? renderSparkline(quote.closes30d) : "--";
  const range52w = quote ? render52wRange(quote.price, quote.low52w, quote.high52w) : "--";
  const volumeBar = quote ? renderVolumeBar(quote.volume, quote.avgVolume) : "";

  return `<tr data-ticker="${ticker}">
    <td><strong>${ticker}</strong></td>
    <td class="font-mono">${price}</td>
    <td class="${changeClass} font-mono">${change}</td>
    <td>${consensus}</td>
    <td class="cell-sparkline">${sparkline}</td>
    <td class="font-mono">${volume}${volumeBar}</td>
    <td>${range52w}</td>
    <td><button class="ticker-remove" data-action="remove" data-ticker="${ticker}" title="Remove ${ticker}">&times;</button></td>
  </tr>`;
}

function renderBadge(direction: SignalDirection): string {
  const cls =
    direction === "BUY" ? "badge-buy" : direction === "SELL" ? "badge-sell" : "badge-neutral";
  return `<span class="badge ${cls}">${direction}</span>`;
}

function render52wRange(price: number, low: number, high: number): string {
  if (high <= low) return "--";
  const pct = Math.min(100, Math.max(0, ((price - low) / (high - low)) * 100));
  return `<div class="range-bar" title="${formatPrice(low)} – ${formatPrice(high)}">
    <div class="range-fill" style="width:${pct.toFixed(1)}%"></div>
  </div>`;
}

function renderVolumeBar(volume: number, avgVolume: number): string {
  if (avgVolume <= 0) return "";
  const ratio = Math.min(2, volume / avgVolume);
  const pct = (ratio / 2) * 100;
  const cls = ratio >= 1.5 ? "vol-high" : ratio >= 1 ? "vol-normal" : "vol-low";
  return `<div class="vol-bar ${cls}" title="${(ratio * 100).toFixed(0)}% of avg"><div class="vol-fill" style="width:${pct.toFixed(0)}%"></div></div>`;
}

function formatPrice(n: number): string {
  return n.toFixed(2);
}

function formatChange(change: number, pct: number): string {
  const sign = change >= 0 ? "+" : "";
  return `${sign}${change.toFixed(2)} (${sign}${pct.toFixed(2)}%)`;
}

function formatVolume(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`;
  return String(v);
}
