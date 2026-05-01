/**
 * RFC 4180 CSV parser / serializer. Designed for portfolio import/export
 * but generic enough for any tabular interchange. Handles quoted fields,
 * embedded commas, embedded quotes (doubled), CRLF/LF line endings, and
 * a trailing newline.
 */

export interface CsvParseOptions {
  /** Treat first row as headers. Default true. */
  readonly header?: boolean;
  /** Field separator. Default ",". */
  readonly delimiter?: string;
}

export type CsvRow = readonly string[];

/**
 * Parse a CSV string into rows.
 * Returns an array of arrays of strings; if `header: false` is passed
 * the first row is included.
 */
export function parseCsv(input: string, options: CsvParseOptions = {}): string[][] {
  const delim = options.delimiter ?? ",";
  if (delim.length !== 1) {
    throw new TypeError("delimiter must be a single character");
  }
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  let i = 0;
  const n = input.length;
  while (i < n) {
    const ch = input[i]!;
    if (inQuotes) {
      if (ch === '"') {
        if (input[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i++;
        continue;
      }
      field += ch;
      i++;
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
      i++;
      continue;
    }
    if (ch === delim) {
      row.push(field);
      field = "";
      i++;
      continue;
    }
    if (ch === "\n" || ch === "\r") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      // skip CRLF
      if (ch === "\r" && input[i + 1] === "\n") i += 2;
      else i++;
      continue;
    }
    field += ch;
    i++;
  }
  // Final field/row only if anything was captured.
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

export interface CsvObjectsOptions extends CsvParseOptions {
  readonly trimHeaders?: boolean;
}

/**
 * Parse to an array of objects keyed by header row.
 */
export function parseCsvAsObjects(
  input: string,
  options: CsvObjectsOptions = {},
): Record<string, string>[] {
  const rows = parseCsv(input, options);
  if (rows.length === 0) return [];
  const headers = rows[0]!.map((h) => (options.trimHeaders === false ? h : h.trim()));
  const out: Record<string, string>[] = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i]!;
    const obj: Record<string, string> = {};
    for (let j = 0; j < headers.length; j++) {
      const key = headers[j]!;
      obj[key] = row[j] ?? "";
    }
    out.push(obj);
  }
  return out;
}

const NEEDS_QUOTING_RE = /[",\r\n]/;

function quoteField(s: string, delim: string): string {
  if (s.includes(delim) || NEEDS_QUOTING_RE.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export interface CsvSerializeOptions {
  readonly delimiter?: string;
  /** Use CRLF instead of LF. Default false. */
  readonly crlf?: boolean;
}

export function serializeCsv(
  rows: readonly CsvRow[],
  options: CsvSerializeOptions = {},
): string {
  const delim = options.delimiter ?? ",";
  const eol = options.crlf ? "\r\n" : "\n";
  return rows.map((r) => r.map((f) => quoteField(f, delim)).join(delim)).join(eol);
}

export function serializeObjects(
  records: readonly Record<string, string | number | undefined>[],
  headers: readonly string[],
  options: CsvSerializeOptions = {},
): string {
  const rows: string[][] = [headers.slice()];
  for (const r of records) {
    rows.push(headers.map((h) => String(r[h] ?? "")));
  }
  return serializeCsv(rows, options);
}
