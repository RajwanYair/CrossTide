/**
 * Data export/import — JSON and CSV export of watchlist + settings.
 *
 * The JSON envelope is schema-versioned (C7):
 *   { schemaVersion, version, exportedAt, checksum, config }
 *
 * `schemaVersion` is an integer incremented whenever the envelope shape
 * changes, allowing forward-compatible migration on import.
 * `checksum` is a djb2 hex hash of the canonical JSON of `config` for
 * tamper detection (not cryptographic — for accidental corruption only).
 */
import type { AppConfig, WatchlistEntry } from "../types/domain";
import { djb2Hex } from "./hash-djb2";

/** Current envelope schema version. Increment on breaking changes. */
export const EXPORT_SCHEMA_VERSION = 1;

export interface ExportPayload {
  /** Schema version for forward-compat migration. */
  readonly schemaVersion: number;
  /** App version string (e.g. "7.2.0"). */
  readonly version: string;
  /** ISO-8601 timestamp of export. */
  readonly exportedAt: string;
  /** djb2 hex hash of the canonical JSON of `config`. */
  readonly checksum: string;
  readonly config: AppConfig;
}

/**
 * Export config as a JSON string with a schema-versioned envelope (C7).
 * The envelope includes a djb2 checksum of the config for tamper detection.
 */
export function exportConfigJSON(config: AppConfig, version: string): string {
  const configJson = JSON.stringify(config);
  const checksum = djb2Hex(configJson);
  const payload: ExportPayload = {
    schemaVersion: EXPORT_SCHEMA_VERSION,
    version,
    exportedAt: new Date().toISOString(),
    checksum,
    config,
  };
  return JSON.stringify(payload, null, 2);
}

/**
 * Import config from a JSON string. Validates structure and checksum.
 * Accepts exports with any schemaVersion <= EXPORT_SCHEMA_VERSION.
 */
export function importConfigJSON(json: string): AppConfig {
  const parsed: unknown = JSON.parse(json);
  if (!parsed || typeof parsed !== "object") throw new Error("Invalid export format");

  const obj = parsed as Record<string, unknown>;
  const config = obj["config"] as Record<string, unknown> | undefined;
  if (!config) throw new Error("Missing config in export");

  // Schema version check — reject future versions we don't understand
  const schemaVersion = obj["schemaVersion"];
  if (
    schemaVersion !== undefined &&
    typeof schemaVersion === "number" &&
    schemaVersion > EXPORT_SCHEMA_VERSION
  ) {
    throw new Error(`Unsupported export schema version: ${String(schemaVersion)}`);
  }

  // Checksum verification (optional — only if checksum field is present)
  const checksum = obj["checksum"];
  if (typeof checksum === "string") {
    const expected = djb2Hex(JSON.stringify(config));
    if (checksum !== expected) {
      throw new Error("Export checksum mismatch — file may be corrupted");
    }
  }

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

/**
 * Gzip-compress a UTF-8 string with the Compression Streams API (G11),
 * then trigger a browser download. Falls back to plain download if the API
 * is unavailable (Safari < 16.4, older browsers).
 *
 * @param content  UTF-8 string to compress and download.
 * @param filename Suggested filename (should end in `.gz`).
 * @param mimeType MIME type of the *uncompressed* content
 *                 (e.g. `"application/json"` or `"text/csv"`).
 */
export async function downloadCompressedFile(
  content: string,
  filename: string,
  mimeType: string,
): Promise<void> {
  if (typeof CompressionStream === "undefined") {
    // Graceful fallback — download uncompressed.
    downloadFile(content, filename.replace(/\.gz$/, ""), mimeType);
    return;
  }

  const encoder = new TextEncoder();
  const bytes = encoder.encode(content);
  const stream = new Response(bytes).body!;
  const compressed = stream.pipeThrough(new CompressionStream("gzip"));
  const reader = compressed.getReader();

  const chunks: Uint8Array<ArrayBuffer>[] = [];
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }

  const blob = new Blob(chunks, { type: "application/gzip" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
