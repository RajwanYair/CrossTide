/**
 * Screener card — filters tickers by technical criteria.
 */
import type { SignalDirection } from "../types/domain";
import { patchDOM } from "../core/patch-dom";
import { VirtualScroller, shouldVirtualize } from "../ui/virtual-scroller";
import type { ScreenerColumn } from "./screener-columns";
import { ALL_COLUMNS } from "./screener-columns";

export type ScreenerFilter =
  | { type: "consensus"; direction: SignalDirection }
  | { type: "rsiBelow"; threshold: number }
  | { type: "rsiAbove"; threshold: number }
  | { type: "volumeSpike"; multiplier: number }
  | { type: "priceAboveSma"; period: number }
  | { type: "peBelow"; threshold: number }
  | { type: "peAbove"; threshold: number }
  | { type: "marketCapAbove"; threshold: number }
  | { type: "marketCapBelow"; threshold: number }
  | { type: "dividendYieldAbove"; threshold: number }
  | { type: "sector"; value: string };

export interface ScreenerRow {
  ticker: string;
  price: number;
  consensus: SignalDirection;
  matchedFilters: readonly string[];
}

export interface ScreenerInput {
  ticker: string;
  price: number;
  consensus: SignalDirection;
  rsi: number | null;
  volumeRatio: number;
  smaValues: ReadonlyMap<number, number | null>;
  pe: number | null;
  marketCap: number | null;
  dividendYield: number | null;
  sector: string | null;
}

export function applyFilters(
  inputs: readonly ScreenerInput[],
  filters: readonly ScreenerFilter[],
): ScreenerRow[] {
  return inputs
    .map((input) => {
      const matched: string[] = [];
      for (const f of filters) {
        if (matchesFilter(input, f)) {
          matched.push(filterLabel(f));
        }
      }
      return {
        ticker: input.ticker,
        price: input.price,
        consensus: input.consensus,
        matchedFilters: matched,
      };
    })
    .filter((row) => row.matchedFilters.length === filters.length);
}

function matchesFilter(input: ScreenerInput, filter: ScreenerFilter): boolean {
  switch (filter.type) {
    case "consensus":
      return input.consensus === filter.direction;
    case "rsiBelow":
      return input.rsi !== null && input.rsi < filter.threshold;
    case "rsiAbove":
      return input.rsi !== null && input.rsi > filter.threshold;
    case "volumeSpike":
      return input.volumeRatio >= filter.multiplier;
    case "priceAboveSma": {
      const sma = input.smaValues.get(filter.period);
      return sma !== null && sma !== undefined && input.price > sma;
    }
    case "peBelow":
      return input.pe !== null && input.pe < filter.threshold;
    case "peAbove":
      return input.pe !== null && input.pe > filter.threshold;
    case "marketCapAbove":
      return input.marketCap !== null && input.marketCap >= filter.threshold;
    case "marketCapBelow":
      return input.marketCap !== null && input.marketCap <= filter.threshold;
    case "dividendYieldAbove":
      return input.dividendYield !== null && input.dividendYield >= filter.threshold;
    case "sector":
      return input.sector !== null && input.sector.toLowerCase() === filter.value.toLowerCase();
  }
}

function filterLabel(f: ScreenerFilter): string {
  switch (f.type) {
    case "consensus":
      return `Consensus ${f.direction}`;
    case "rsiBelow":
      return `RSI < ${f.threshold}`;
    case "rsiAbove":
      return `RSI > ${f.threshold}`;
    case "volumeSpike":
      return `Volume ≥ ${f.multiplier}x avg`;
    case "priceAboveSma":
      return `Price > SMA${f.period}`;
    case "peBelow":
      return `P/E < ${f.threshold}`;
    case "peAbove":
      return `P/E > ${f.threshold}`;
    case "marketCapAbove":
      return `MCap ≥ $${formatFilterCap(f.threshold)}`;
    case "marketCapBelow":
      return `MCap ≤ $${formatFilterCap(f.threshold)}`;
    case "dividendYieldAbove":
      return `Div ≥ ${f.threshold}%`;
    case "sector":
      return `Sector: ${f.value}`;
  }
}

function formatFilterCap(value: number): string {
  if (value >= 1e12) return `${(value / 1e12).toFixed(1)}T`;
  if (value >= 1e9) return `${(value / 1e9).toFixed(0)}B`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(0)}M`;
  return String(value);
}

export function renderScreenerResults(
  container: HTMLElement,
  rows: readonly ScreenerRow[],
  visibleColumns?: ReadonlySet<ScreenerColumn>,
  inputData?: readonly ScreenerInput[],
): void {
  if (rows.length === 0) {
    patchDOM(container, `<p class="empty-state">No tickers match the current filters.</p>`);
    return;
  }

  const cols =
    visibleColumns ??
    new Set<ScreenerColumn>(ALL_COLUMNS.filter((c) => c.defaultVisible).map((c) => c.id));

  // Build a lookup for extra data (RSI, volume) if columns need it
  const inputMap = new Map<string, ScreenerInput>();
  if (inputData) {
    for (const inp of inputData) inputMap.set(inp.ticker, inp);
  }

  const headerCells: string[] = [];
  if (cols.has("ticker")) headerCells.push("<th>Symbol</th>");
  if (cols.has("price")) headerCells.push("<th>Price</th>");
  if (cols.has("consensus")) headerCells.push("<th>Signal</th>");
  if (cols.has("matched")) headerCells.push("<th>Matched</th>");
  if (cols.has("rsi")) headerCells.push("<th>RSI</th>");
  if (cols.has("volume")) headerCells.push("<th>Vol Ratio</th>");
  if (cols.has("pe")) headerCells.push("<th>P/E</th>");
  if (cols.has("marketCap")) headerCells.push("<th>Mkt Cap</th>");
  if (cols.has("dividendYield")) headerCells.push("<th>Div Yield</th>");
  if (cols.has("sector")) headerCells.push("<th>Sector</th>");
  const headerHtml = `<tr>${headerCells.join("")}</tr>`;

  const renderRow = (i: number): string => {
    const r = rows[i]!;
    const inp = inputMap.get(r.ticker);
    const cells: string[] = [];
    if (cols.has("ticker")) cells.push(`<td><strong>${r.ticker}</strong></td>`);
    if (cols.has("price")) cells.push(`<td class="font-mono">${r.price.toFixed(2)}</td>`);
    if (cols.has("consensus"))
      cells.push(
        `<td><span class="badge badge-${r.consensus.toLowerCase()}">${r.consensus}</span></td>`,
      );
    if (cols.has("matched")) cells.push(`<td>${r.matchedFilters.join(", ")}</td>`);
    if (cols.has("rsi"))
      cells.push(`<td class="font-mono">${inp?.rsi != null ? inp.rsi.toFixed(1) : "—"}</td>`);
    if (cols.has("volume"))
      cells.push(
        `<td class="font-mono">${inp?.volumeRatio != null ? inp.volumeRatio.toFixed(2) + "x" : "—"}</td>`,
      );
    if (cols.has("pe"))
      cells.push(`<td class="font-mono">${inp?.pe != null ? inp.pe.toFixed(1) : "—"}</td>`);
    if (cols.has("marketCap"))
      cells.push(
        `<td class="font-mono">${inp?.marketCap != null ? formatFilterCap(inp.marketCap) : "—"}</td>`,
      );
    if (cols.has("dividendYield"))
      cells.push(
        `<td class="font-mono">${inp?.dividendYield != null ? inp.dividendYield.toFixed(2) + "%" : "—"}</td>`,
      );
    if (cols.has("sector")) cells.push(`<td>${inp?.sector ?? "—"}</td>`);
    return `<tr>${cells.join("")}</tr>`;
  };

  if (shouldVirtualize(rows.length)) {
    container.textContent = "";
    new VirtualScroller({
      container,
      rowHeight: 36,
      totalRows: rows.length,
      renderRow,
      headerHtml,
      ariaLabel: "Screener Results",
    }).setViewportHeight(400);
  } else {
    const html = rows.map((_, i) => renderRow(i)).join("");
    patchDOM(
      container,
      `<table class="screener-table">
      <thead>${headerHtml}</thead>
      <tbody>${html}</tbody>
    </table>`,
    );
  }
}
