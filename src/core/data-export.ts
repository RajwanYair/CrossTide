/**
 * Data Export Utilities — CSV/JSON export for alert history, portfolio, and backtest.
 *
 * Extends core export-import with card-specific serializers.
 *
 * C7: Full-data export with schema-versioned envelope (schema_version = 7).
 */
import type { AlertRecord, Holding, WatchlistEntry } from "../types/domain";
import type { BacktestResult, BacktestTrade } from "../domain/backtest-engine";

// ── Schema-versioned full-data export (C7) ────────────────────────────────────

/**
 * Schema version for the full export format.
 * Increment when the shape of FullExportPayload changes.
 */
export const EXPORT_SCHEMA_VERSION = 7;

/**
 * Optional data domains included in a full export.
 */
export interface FullExportDomains {
  readonly watchlist?: readonly WatchlistEntry[];
  readonly alerts?: readonly AlertRecord[];
  readonly holdings?: readonly Holding[];
  readonly backtestResult?: BacktestResult;
}

/**
 * Schema-versioned envelope wrapping all exported data.
 */
export interface FullExportPayload {
  readonly schema_version: number;
  readonly exported_at: string;
  readonly app: string;
  readonly data: FullExportDomains;
}

/**
 * Export all provided data domains as a schema-versioned JSON string.
 */
export function exportFullDataJson(domains: FullExportDomains): string {
  const payload: FullExportPayload = {
    schema_version: EXPORT_SCHEMA_VERSION,
    exported_at: new Date().toISOString(),
    app: "CrossTide",
    data: domains,
  };
  return JSON.stringify(payload, null, 2);
}

/**
 * Import and validate a full-data JSON export.
 * Returns the parsed payload. Throws on schema version mismatch or bad structure.
 */
export function importFullDataJson(json: string): FullExportPayload {
  const raw: unknown = JSON.parse(json);
  if (!raw || typeof raw !== "object") throw new Error("Invalid full export: not an object");

  const obj = raw as Record<string, unknown>;
  const sv = obj["schema_version"];
  if (typeof sv !== "number") throw new Error("Invalid full export: missing schema_version");
  if (sv > EXPORT_SCHEMA_VERSION) {
    throw new Error(
      `Full export schema v${sv} is newer than supported v${EXPORT_SCHEMA_VERSION}. Please update CrossTide.`,
    );
  }

  const data = obj["data"];
  if (!data || typeof data !== "object") throw new Error("Invalid full export: missing data");

  return obj as unknown as FullExportPayload;
}

/**
 * Export all data domains as a multi-section CSV.
 * Each section is prefixed with a `## SECTION_NAME` comment line.
 */
export function exportFullDataCsv(domains: FullExportDomains): string {
  const sections: string[] = [
    `## CrossTide full export — schema v${EXPORT_SCHEMA_VERSION} — ${new Date().toISOString()}`,
  ];

  if (domains.watchlist && domains.watchlist.length > 0) {
    sections.push("## WATCHLIST");
    sections.push("ticker,addedAt,instrumentType");
    for (const e of domains.watchlist) {
      sections.push(
        `${csvEscape(e.ticker)},${csvEscape(e.addedAt)},${csvEscape(e.instrumentType ?? "")}`,
      );
    }
  }

  if (domains.alerts && domains.alerts.length > 0) {
    sections.push("## ALERTS");
    sections.push("id,ticker,alertType,direction,description,firedAt");
    for (const a of domains.alerts) {
      sections.push(
        `${csvEscape(a.id)},${csvEscape(a.ticker)},${csvEscape(a.alertType)},${a.direction},${csvEscape(a.description)},${a.firedAt}`,
      );
    }
  }

  if (domains.holdings && domains.holdings.length > 0) {
    sections.push("## PORTFOLIO");
    sections.push("ticker,shares,avgCost,currentPrice");
    for (const h of domains.holdings) {
      sections.push(`${csvEscape(h.ticker)},${h.shares},${h.avgCost},${h.currentPrice}`);
    }
  }

  return sections.join("\n");
}



/**
 * Export alert records as CSV.
 */
export function exportAlertsCsv(alerts: readonly AlertRecord[]): string {
  const header = "id,ticker,alertType,direction,description,firedAt";
  const rows = alerts.map(
    (a) =>
      `${csvEscape(a.id)},${csvEscape(a.ticker)},${csvEscape(a.alertType)},${a.direction},${csvEscape(a.description)},${a.firedAt}`,
  );
  return [header, ...rows].join("\n");
}

/**
 * Export alert records as JSON.
 */
export function exportAlertsJson(alerts: readonly AlertRecord[]): string {
  return JSON.stringify({ exportedAt: new Date().toISOString(), alerts }, null, 2);
}

/**
 * Export portfolio holdings as CSV.
 */
export function exportPortfolioCsv(holdings: readonly Holding[]): string {
  const header = "ticker,shares,avgCost,currentPrice";
  const rows = holdings.map(
    (h) => `${csvEscape(h.ticker)},${h.shares},${h.avgCost},${h.currentPrice}`,
  );
  return [header, ...rows].join("\n");
}

/**
 * Export portfolio holdings as JSON.
 */
export function exportPortfolioJson(holdings: readonly Holding[]): string {
  return JSON.stringify({ exportedAt: new Date().toISOString(), holdings }, null, 2);
}

/**
 * Export backtest trades as CSV.
 */
export function exportBacktestTradesCsv(trades: readonly BacktestTrade[]): string {
  const header = "entryDate,exitDate,entryPrice,exitPrice,profitPercent";
  const rows = trades.map(
    (t) =>
      `${t.entryDate},${t.exitDate},${t.entryPrice.toFixed(2)},${t.exitPrice.toFixed(2)},${t.profitPercent.toFixed(2)}`,
  );
  return [header, ...rows].join("\n");
}

/**
 * Export full backtest result as JSON.
 */
export function exportBacktestJson(result: BacktestResult): string {
  return JSON.stringify({ exportedAt: new Date().toISOString(), result }, null, 2);
}

/**
 * Parse alert records from CSV. Validates required fields.
 */
export function importAlertsCsv(csv: string): AlertRecord[] {
  const lines = csv.trim().split("\n");
  if (lines.length < 2) return [];

  return lines.slice(1).map((line, idx) => {
    const parts = csvParseLine(line);
    if (parts.length < 6) throw new Error(`Invalid alert CSV at line ${idx + 2}`);
    const [id, ticker, alertType, direction, description, firedAt] = parts;
    if (
      id === undefined ||
      ticker === undefined ||
      alertType === undefined ||
      direction === undefined ||
      description === undefined ||
      firedAt === undefined
    ) {
      throw new Error(`Invalid alert CSV at line ${idx + 2}`);
    }
    return {
      id,
      ticker: ticker.toUpperCase(),
      alertType,
      direction: direction as AlertRecord["direction"],
      description,
      firedAt,
    };
  });
}

/**
 * Simple CSV field escaping — wraps in quotes if contains comma, newline, or quote.
 */
function csvEscape(value: string): string {
  if (/[,"\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Minimal CSV line parser handling quoted fields.
 */
function csvParseLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      fields.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  fields.push(current);
  return fields;
}
