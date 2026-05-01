/**
 * Watchlist renderer — renders the watchlist table from state.
 * Supports column sorting by clicking table headers.
 */
import type { AppConfig, ConsensusResult, SignalDirection, InstrumentType } from "../types/domain";
import { formatCompact } from "./number-format";
import { renderSparkline } from "./sparkline";
import { instrumentTypeBadge } from "./instrument-filter";

export interface WatchlistQuote {
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
  instrumentType?: InstrumentType;
}

type SortColumn = "ticker" | "price" | "change" | "consensus" | "volume";
type SortDirection = "asc" | "desc";

let currentSort: { column: SortColumn; direction: SortDirection } = {
  column: "ticker",
  direction: "asc",
};

export function setSortColumn(column: SortColumn): void {
  if (currentSort.column === column) {
    currentSort.direction = currentSort.direction === "asc" ? "desc" : "asc";
  } else {
    currentSort = { column, direction: column === "ticker" ? "asc" : "desc" };
  }
}

function sortEntries(
  entries: readonly { ticker: string }[],
  quotes: Map<string, WatchlistQuote>,
): { ticker: string }[] {
  const sorted = [...entries];
  const dir = currentSort.direction === "asc" ? 1 : -1;
  sorted.sort((a, b) => {
    const qa = quotes.get(a.ticker);
    const qb = quotes.get(b.ticker);
    switch (currentSort.column) {
      case "ticker":
        return dir * a.ticker.localeCompare(b.ticker);
      case "price":
        return dir * ((qa?.price ?? 0) - (qb?.price ?? 0));
      case "change":
        return dir * ((qa?.changePercent ?? 0) - (qb?.changePercent ?? 0));
      case "consensus": {
        const rank = (d: string | undefined): number =>
          d === "BUY" ? 2 : d === "SELL" ? 0 : 1;
        return dir * (rank(qa?.consensus?.direction) - rank(qb?.consensus?.direction));
      }
      case "volume":
        return dir * ((qa?.volume ?? 0) - (qb?.volume ?? 0));
      default:
        return 0;
    }
  });
  return sorted;
}

function renderSortIndicator(column: SortColumn): string {
  if (currentSort.column !== column) return "";
  return currentSort.direction === "asc" ? " ↑" : " ↓";
}

export function renderWatchlist(config: AppConfig, quotes: Map<string, WatchlistQuote>): void {
  const tbody = document.getElementById("watchlist-body");
  const emptyMsg = document.getElementById("watchlist-empty");
  const thead = document.getElementById("watchlist-head");
  if (!tbody) return;

  // Render sortable headers
  if (thead) {
    thead.innerHTML = `<tr>
      <th data-sort="ticker" class="sortable">Ticker${renderSortIndicator("ticker")}</th>
      <th data-sort="price" class="sortable">Price${renderSortIndicator("price")}</th>
      <th data-sort="change" class="sortable">Change${renderSortIndicator("change")}</th>
      <th data-sort="consensus" class="sortable">Signal${renderSortIndicator("consensus")}</th>
      <th>Sparkline</th>
      <th data-sort="volume" class="sortable">Volume${renderSortIndicator("volume")}</th>
      <th>52W Range</th>
      <th></th>
    </tr>`;
  }

  if (config.watchlist.length === 0) {
    tbody.innerHTML = "";
    emptyMsg?.classList.remove("hidden");
    return;
  }

  emptyMsg?.classList.add("hidden");

  const sorted = sortEntries(config.watchlist, quotes);
  const rows = sorted
    .map((entry) => {
      const q = quotes.get(entry.ticker);
      return renderRow(entry.ticker, q ?? null);
    })
    .join("");

  tbody.innerHTML = rows;
}

function renderRow(ticker: string, quote: WatchlistQuote | null): string {
  const price = quote ? formatPrice(quote.price) : "--";
  const change = quote ? formatChange(quote.change, quote.changePercent) : "--";
  const changeClass = quote ? (quote.change >= 0 ? "change-positive" : "change-negative") : "";
  const consensus = quote?.consensus
    ? renderBadge(quote.consensus.direction)
    : renderBadge("NEUTRAL");
  const volume = quote ? formatCompact(quote.volume) : "--";
  const sparkline = quote && quote.closes30d.length >= 2 ? renderSparkline(quote.closes30d) : "--";
  const range52w = quote ? render52wRange(quote.price, quote.low52w, quote.high52w) : "--";
  const volumeBar = quote ? renderVolumeBar(quote.volume, quote.avgVolume) : "";

  return `<tr data-ticker="${ticker}">
    <td><strong>${ticker}</strong>${instrumentTypeBadge(quote?.instrumentType)}</td>
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
