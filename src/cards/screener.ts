/**
 * Screener card — filters tickers by technical criteria.
 */
import type { SignalDirection } from "../types/domain";

export type ScreenerFilter =
  | { type: "consensus"; direction: SignalDirection }
  | { type: "rsiBelow"; threshold: number }
  | { type: "rsiAbove"; threshold: number }
  | { type: "volumeSpike"; multiplier: number }
  | { type: "priceAboveSma"; period: number };

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
  }
}

export function renderScreenerResults(container: HTMLElement, rows: readonly ScreenerRow[]): void {
  if (rows.length === 0) {
    container.innerHTML = `<p class="empty-state">No tickers match the current filters.</p>`;
    return;
  }

  const html = rows
    .map(
      (r) =>
        `<tr>
      <td><strong>${r.ticker}</strong></td>
      <td class="font-mono">${r.price.toFixed(2)}</td>
      <td><span class="badge badge-${r.consensus.toLowerCase()}">${r.consensus}</span></td>
      <td>${r.matchedFilters.join(", ")}</td>
    </tr>`,
    )
    .join("");

  container.innerHTML = `<table class="screener-table">
    <thead><tr><th>Symbol</th><th>Price</th><th>Signal</th><th>Matched</th></tr></thead>
    <tbody>${html}</tbody>
  </table>`;
}
