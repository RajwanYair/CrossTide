/**
 * Data export/import — JSON and CSV export of watchlist + settings.
 */
import type { AppConfig, WatchlistEntry } from "../types/domain";

export interface ExportPayload {
  readonly version: string;
  readonly exportedAt: string;
  readonly config: AppConfig;
}

/**
 * Export config as a JSON string.
 */
export function exportConfigJSON(config: AppConfig, version: string): string {
  const payload: ExportPayload = {
    version,
    exportedAt: new Date().toISOString(),
    config,
  };
  return JSON.stringify(payload, null, 2);
}

/**
 * Import config from a JSON string. Validates structure.
 */
export function importConfigJSON(json: string): AppConfig {
  const parsed: unknown = JSON.parse(json);
  if (!parsed || typeof parsed !== "object") throw new Error("Invalid export format");

  const obj = parsed as Record<string, unknown>;
  const config = obj["config"] as Record<string, unknown> | undefined;
  if (!config) throw new Error("Missing config in export");

  const theme = config["theme"];
  if (theme !== "dark" && theme !== "light" && theme !== "high-contrast")
    throw new Error("Invalid theme");

  const watchlist = config["watchlist"];
  if (!Array.isArray(watchlist)) throw new Error("Invalid watchlist");

  for (const entry of watchlist) {
    if (!entry || typeof entry !== "object") throw new Error("Invalid watchlist entry");
    if (typeof (entry as Record<string, unknown>)["ticker"] !== "string")
      throw new Error("Invalid ticker");
    if (typeof (entry as Record<string, unknown>)["addedAt"] !== "string")
      throw new Error("Invalid addedAt");
  }

  return { theme: theme, watchlist: watchlist as WatchlistEntry[] };
}

/**
 * Export watchlist as CSV string.
 */
export function exportWatchlistCSV(watchlist: readonly WatchlistEntry[]): string {
  const header = "ticker,addedAt";
  const rows = watchlist.map((e) => `${e.ticker},${e.addedAt}`);
  return [header, ...rows].join("\n");
}

/**
 * Import watchlist from CSV string.
 */
export function importWatchlistCSV(csv: string): WatchlistEntry[] {
  const lines = csv.trim().split("\n");
  if (lines.length < 2) return [];

  // Skip header
  return lines.slice(1).map((line) => {
    const [ticker, addedAt] = line.split(",");
    if (!ticker?.trim()) throw new Error("Invalid CSV: missing ticker");
    return {
      ticker: ticker.trim().toUpperCase(),
      addedAt: addedAt?.trim() || new Date().toISOString(),
    };
  });
}

/**
 * Trigger a file download in the browser.
 */
export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
