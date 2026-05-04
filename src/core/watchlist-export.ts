/**
 * Watchlist export formatter — export watchlist data in
 * CSV, JSON, and plain text formats for sharing/archiving.
 */

export interface ExportTicker {
  readonly ticker: string;
  readonly price?: number;
  readonly changePercent?: number;
  readonly volume?: number;
  readonly signal?: string;
  readonly notes?: string;
}

export type ExportFormat = "csv" | "json" | "text" | "tsv";

/**
 * Export watchlist to CSV format.
 */
export function toCsv(tickers: readonly ExportTicker[]): string {
  const headers = ["Ticker", "Price", "Change%", "Volume", "Signal", "Notes"];
  const rows = tickers.map((t) => [
    t.ticker,
    t.price?.toString() ?? "",
    t.changePercent?.toFixed(2) ?? "",
    t.volume?.toString() ?? "",
    t.signal ?? "",
    (t.notes ?? "").replace(/,/g, ";"),
  ]);
  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
}

/**
 * Export watchlist to TSV (tab-separated) format.
 */
export function toTsv(tickers: readonly ExportTicker[]): string {
  const headers = ["Ticker", "Price", "Change%", "Volume", "Signal", "Notes"];
  const rows = tickers.map((t) => [
    t.ticker,
    t.price?.toString() ?? "",
    t.changePercent?.toFixed(2) ?? "",
    t.volume?.toString() ?? "",
    t.signal ?? "",
    t.notes ?? "",
  ]);
  return [headers.join("\t"), ...rows.map((r) => r.join("\t"))].join("\n");
}

/**
 * Export watchlist to JSON format.
 */
export function toJson(tickers: readonly ExportTicker[]): string {
  return JSON.stringify(tickers, null, 2);
}

/**
 * Export as plain text — simple ticker list, one per line.
 */
export function toText(tickers: readonly ExportTicker[]): string {
  return tickers.map((t) => t.ticker).join("\n");
}

/**
 * Export watchlist in a specified format.
 */
export function exportWatchlist(tickers: readonly ExportTicker[], format: ExportFormat): string {
  switch (format) {
    case "csv":
      return toCsv(tickers);
    case "tsv":
      return toTsv(tickers);
    case "json":
      return toJson(tickers);
    case "text":
      return toText(tickers);
  }
}

/**
 * Generate a filename for the export.
 */
export function exportFilename(format: ExportFormat, prefix = "watchlist"): string {
  const date = new Date().toISOString().slice(0, 10);
  const ext = format === "text" ? "txt" : format;
  return `${prefix}-${date}.${ext}`;
}

/**
 * Parse ticker list from plain text (one per line, flexible separators).
 */
export function parseTickerList(input: string): string[] {
  return input
    .split(/[\n,;]+/)
    .map((t) => t.trim().toUpperCase())
    .filter((t) => t.length > 0 && t.length <= 10);
}
