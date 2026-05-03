/**
 * Lightweight XLSX export helpers (H13).
 *
 * Generates valid `.xlsx` files (Office Open XML SpreadsheetML) without any
 * external dependency.  An XLSX file is a ZIP archive containing XML parts.
 * This module assembles the minimal set of parts needed for a single-sheet
 * or multi-sheet workbook.
 *
 * Exports:
 *   - `createWorkbook()` — start a new workbook builder
 *   - `addSheet(wb, name, rows)` — append a worksheet
 *   - `generateXlsx(wb)` — produce the final Uint8Array
 *   - `cellRef(row, col)` — zero-indexed → A1 reference
 *   - `escapeXml(str)` — XML entity escaping
 *   - `inferCellType(value)` — "n" | "s" | "b" | "inlineStr"
 *
 * The generated XLSX is intentionally minimal (no styles, no formulas)
 * to keep the implementation small (~200 LOC).  For full-featured export,
 * lazy-load `exceljs` instead.
 *
 * Spec: ECMA-376 Office Open XML File Formats
 */

// ── Types ─────────────────────────────────────────────────────────────────

export type CellValue = string | number | boolean | null | undefined;

export interface SheetData {
  name: string;
  rows: CellValue[][];
}

export interface Workbook {
  sheets: SheetData[];
}

export type CellType = "n" | "s" | "b" | "inlineStr";

// ── Public API ────────────────────────────────────────────────────────────

/** Create an empty workbook builder. */
export function createWorkbook(): Workbook {
  return { sheets: [] };
}

/** Add a worksheet to the workbook. */
export function addSheet(wb: Workbook, name: string, rows: CellValue[][]): void {
  wb.sheets.push({ name: sanitiseSheetName(name), rows });
}

/**
 * Generate a minimal .xlsx Uint8Array from the workbook.
 *
 * This builds the ZIP archive manually using the DEFLATE-less "store" method
 * (compression = 0) so we don't need a zlib dependency.  The resulting file
 * is larger than a compressed XLSX but is fully valid.
 */
export function generateXlsx(wb: Workbook): Uint8Array {
  if (wb.sheets.length === 0) {
    throw new Error("Workbook must have at least one sheet");
  }

  const files: ZipEntry[] = [];

  // [Content_Types].xml
  files.push({ path: "[Content_Types].xml", data: buildContentTypes(wb) });

  // _rels/.rels
  files.push({ path: "_rels/.rels", data: buildRootRels() });

  // xl/workbook.xml
  files.push({ path: "xl/workbook.xml", data: buildWorkbookXml(wb) });

  // xl/_rels/workbook.xml.rels
  files.push({ path: "xl/_rels/workbook.xml.rels", data: buildWorkbookRels(wb) });

  // xl/worksheets/sheet{N}.xml
  for (let i = 0; i < wb.sheets.length; i++) {
    files.push({
      path: `xl/worksheets/sheet${i + 1}.xml`,
      data: buildSheetXml(wb.sheets[i]!),
    });
  }

  return buildZip(files);
}

// ── Cell utilities ────────────────────────────────────────────────────────

/**
 * Convert zero-indexed (row, col) to Excel A1 reference.
 * @example cellRef(0, 0) → "A1", cellRef(2, 27) → "AB3"
 */
export function cellRef(row: number, col: number): string {
  let colStr = "";
  let c = col;
  do {
    colStr = String.fromCharCode(65 + (c % 26)) + colStr;
    c = Math.floor(c / 26) - 1;
  } while (c >= 0);
  return `${colStr}${row + 1}`;
}

/** Escape XML special characters. */
export function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** Infer the SpreadsheetML cell type from a JS value. */
export function inferCellType(value: CellValue): CellType {
  if (typeof value === "number") return "n";
  if (typeof value === "boolean") return "b";
  if (typeof value === "string") return "inlineStr";
  return "inlineStr"; // null/undefined → empty inline string
}

// ── Internal XML builders ─────────────────────────────────────────────────

function sanitiseSheetName(name: string): string {
  // Sheet names: max 31 chars, no []:*?/\
  return name.replace(/[[\]:*?/\\]/g, "_").slice(0, 31) || "Sheet";
}

function buildContentTypes(wb: Workbook): string {
  const sheetTypes = wb.sheets
    .map(
      (_, i) =>
        `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`,
    )
    .join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
${sheetTypes}
</Types>`;
}

function buildRootRels(): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`;
}

function buildWorkbookXml(wb: Workbook): string {
  const sheets = wb.sheets
    .map((s, i) => `<sheet name="${escapeXml(s.name)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`)
    .join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<sheets>${sheets}</sheets>
</workbook>`;
}

function buildWorkbookRels(wb: Workbook): string {
  const rels = wb.sheets
    .map(
      (_, i) =>
        `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`,
    )
    .join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
${rels}
</Relationships>`;
}

function buildSheetXml(sheet: SheetData): string {
  const rowsXml = sheet.rows
    .map((row, ri) => {
      const cells = row
        .map((value, ci) => {
          const ref = cellRef(ri, ci);
          const type = inferCellType(value);
          if (value == null || value === "") {
            return `<c r="${ref}" t="inlineStr"><is><t></t></is></c>`;
          }
          if (type === "n") {
            return `<c r="${ref}" t="n"><v>${value as number}</v></c>`;
          }
          if (type === "b") {
            return `<c r="${ref}" t="b"><v>${value ? 1 : 0}</v></c>`;
          }
          // inlineStr
          return `<c r="${ref}" t="inlineStr"><is><t>${escapeXml(String(value))}</t></is></c>`;
        })
        .join("");
      return `<row r="${ri + 1}">${cells}</row>`;
    })
    .join("");

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<sheetData>${rowsXml}</sheetData>
</worksheet>`;
}

// ── Minimal ZIP builder (store-only, no compression) ──────────────────────

interface ZipEntry {
  path: string;
  data: string;
}

function buildZip(entries: ZipEntry[]): Uint8Array {
  const encoder = new TextEncoder();
  const localHeaders: Uint8Array[] = [];
  const centralHeaders: Uint8Array[] = [];
  let offset = 0;

  for (const entry of entries) {
    const nameBytes = encoder.encode(entry.path);
    const dataBytes = encoder.encode(entry.data);
    const crc = crc32(dataBytes);

    // Local file header (30 bytes + name + data)
    const local = new Uint8Array(30 + nameBytes.length + dataBytes.length);
    const lv = new DataView(local.buffer);
    lv.setUint32(0, 0x04034b50, true); // signature
    lv.setUint16(4, 20, true); // version needed
    lv.setUint16(6, 0, true); // flags
    lv.setUint16(8, 0, true); // compression: store
    lv.setUint16(10, 0, true); // mod time
    lv.setUint16(12, 0, true); // mod date
    lv.setUint32(14, crc, true); // crc32
    lv.setUint32(18, dataBytes.length, true); // compressed size
    lv.setUint32(22, dataBytes.length, true); // uncompressed size
    lv.setUint16(26, nameBytes.length, true); // name length
    lv.setUint16(28, 0, true); // extra length
    local.set(nameBytes, 30);
    local.set(dataBytes, 30 + nameBytes.length);
    localHeaders.push(local);

    // Central directory header (46 bytes + name)
    const central = new Uint8Array(46 + nameBytes.length);
    const cv = new DataView(central.buffer);
    cv.setUint32(0, 0x02014b50, true);
    cv.setUint16(4, 20, true);
    cv.setUint16(6, 20, true);
    cv.setUint16(8, 0, true);
    cv.setUint16(10, 0, true);
    cv.setUint16(12, 0, true);
    cv.setUint16(14, 0, true);
    cv.setUint32(16, crc, true);
    cv.setUint32(20, dataBytes.length, true);
    cv.setUint32(24, dataBytes.length, true);
    cv.setUint16(28, nameBytes.length, true);
    cv.setUint16(30, 0, true);
    cv.setUint16(32, 0, true);
    cv.setUint16(34, 0, true);
    cv.setUint16(36, 0, true);
    cv.setUint32(38, 0x20, true);
    cv.setUint32(42, offset, true);
    central.set(nameBytes, 46);
    centralHeaders.push(central);

    offset += local.length;
  }

  const centralSize = centralHeaders.reduce((s, h) => s + h.length, 0);

  // End of central directory (22 bytes)
  const eocd = new Uint8Array(22);
  const ev = new DataView(eocd.buffer);
  ev.setUint32(0, 0x06054b50, true);
  ev.setUint16(4, 0, true);
  ev.setUint16(6, 0, true);
  ev.setUint16(8, entries.length, true);
  ev.setUint16(10, entries.length, true);
  ev.setUint32(12, centralSize, true);
  ev.setUint32(16, offset, true);
  ev.setUint16(20, 0, true);

  // Concatenate all parts
  const total = offset + centralSize + 22;
  const result = new Uint8Array(total);
  let pos = 0;
  for (const h of localHeaders) {
    result.set(h, pos);
    pos += h.length;
  }
  for (const h of centralHeaders) {
    result.set(h, pos);
    pos += h.length;
  }
  result.set(eocd, pos);

  return result;
}

// ── CRC32 ─────────────────────────────────────────────────────────────────

const CRC_TABLE = ((): Uint32Array => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c;
  }
  return table;
})();

function crc32(data: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i++) {
    crc = CRC_TABLE[(crc ^ data[i]!) & 0xff]! ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}
