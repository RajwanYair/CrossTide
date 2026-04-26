/**
 * Data Export Utilities — CSV/JSON export for alert history, portfolio, and backtest.
 *
 * Extends core export-import with card-specific serializers.
 */
import type { AlertRecord } from "../cards/alert-history";
import type { Holding } from "../cards/portfolio";
import type { BacktestResult, BacktestTrade } from "../domain/backtest-engine";

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
