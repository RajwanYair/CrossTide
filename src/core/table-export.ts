/**
 * Generic table data export — CSV and clipboard utilities.
 *
 * Enables any card or ct-data-table to export its content as CSV or
 * copy selected cells to clipboard. Handles proper escaping of special
 * characters (commas, quotes, newlines) per RFC 4180.
 */

/** A column definition for export (matches DataTableColumn shape). */
export interface ExportColumn {
  readonly key: string;
  readonly label: string;
}

/**
 * Convert tabular data to a CSV string per RFC 4180.
 * Special characters (commas, double-quotes, newlines) are properly escaped.
 */
export function tableToCsv(
  columns: readonly ExportColumn[],
  rows: readonly Record<string, unknown>[],
): string {
  const header = columns.map((col) => escapeCsvField(col.label)).join(",");
  const dataRows = rows.map((row) =>
    columns.map((col) => escapeCsvField(String(row[col.key] ?? ""))).join(","),
  );
  return [header, ...dataRows].join("\n");
}

/**
 * Copy tabular data to clipboard as tab-separated text (for pasting into Excel/Sheets).
 * Returns true if copy succeeded, false otherwise.
 */
export async function copyTableToClipboard(
  columns: readonly ExportColumn[],
  rows: readonly Record<string, unknown>[],
): Promise<boolean> {
  const header = columns.map((col) => col.label).join("\t");
  const dataRows = rows.map((row) => columns.map((col) => String(row[col.key] ?? "")).join("\t"));
  const text = [header, ...dataRows].join("\n");

  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/**
 * Copy a single cell value to clipboard.
 */
export async function copyCellToClipboard(value: unknown): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(String(value ?? ""));
    return true;
  } catch {
    return false;
  }
}

/**
 * Escape a single CSV field per RFC 4180.
 * Wraps in double-quotes if the value contains a comma, double-quote, or newline.
 */
function escapeCsvField(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
