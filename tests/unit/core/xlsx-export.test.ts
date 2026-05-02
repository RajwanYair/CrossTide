/**
 * Unit tests for XLSX export helpers (H13).
 */
import { describe, it, expect } from "vitest";
import {
  createWorkbook,
  addSheet,
  generateXlsx,
  cellRef,
  escapeXml,
  inferCellType,
} from "../../../src/core/xlsx-export";

// ── cellRef ───────────────────────────────────────────────────────────────

describe("cellRef", () => {
  it("A1 for (0,0)", () => expect(cellRef(0, 0)).toBe("A1"));
  it("B2 for (1,1)", () => expect(cellRef(1, 1)).toBe("B2"));
  it("Z1 for (0,25)", () => expect(cellRef(0, 25)).toBe("Z1"));
  it("AA1 for (0,26)", () => expect(cellRef(0, 26)).toBe("AA1"));
  it("AB3 for (2,27)", () => expect(cellRef(2, 27)).toBe("AB3"));
  it("AZ1 for (0,51)", () => expect(cellRef(0, 51)).toBe("AZ1"));
  it("BA1 for (0,52)", () => expect(cellRef(0, 52)).toBe("BA1"));
});

// ── escapeXml ─────────────────────────────────────────────────────────────

describe("escapeXml", () => {
  it("escapes ampersand", () => expect(escapeXml("A&B")).toBe("A&amp;B"));
  it("escapes less-than", () => expect(escapeXml("a<b")).toBe("a&lt;b"));
  it("escapes greater-than", () => expect(escapeXml("a>b")).toBe("a&gt;b"));
  it("escapes double-quote", () => expect(escapeXml('a"b')).toBe("a&quot;b"));
  it("escapes single-quote", () => expect(escapeXml("a'b")).toBe("a&apos;b"));
  it("handles combined special chars", () => expect(escapeXml('<"&')).toBe("&lt;&quot;&amp;"));
  it("passes through plain text", () => expect(escapeXml("hello")).toBe("hello"));
});

// ── inferCellType ─────────────────────────────────────────────────────────

describe("inferCellType", () => {
  it("number → n", () => expect(inferCellType(42)).toBe("n"));
  it("boolean → b", () => expect(inferCellType(true)).toBe("b"));
  it("string → inlineStr", () => expect(inferCellType("text")).toBe("inlineStr"));
  it("null → inlineStr", () => expect(inferCellType(null)).toBe("inlineStr"));
  it("undefined → inlineStr", () => expect(inferCellType(undefined)).toBe("inlineStr"));
});

// ── createWorkbook / addSheet ─────────────────────────────────────────────

describe("createWorkbook", () => {
  it("creates empty workbook", () => {
    const wb = createWorkbook();
    expect(wb.sheets).toEqual([]);
  });
});

describe("addSheet", () => {
  it("adds a sheet to the workbook", () => {
    const wb = createWorkbook();
    addSheet(wb, "Data", [["a", 1]]);
    expect(wb.sheets).toHaveLength(1);
    expect(wb.sheets[0].name).toBe("Data");
  });

  it("sanitises sheet names", () => {
    const wb = createWorkbook();
    addSheet(wb, "My[Sheet]:1*?/ok", []);
    expect(wb.sheets[0].name).toBe("My_Sheet__1___ok");
  });

  it("truncates sheet name to 31 chars", () => {
    const wb = createWorkbook();
    addSheet(wb, "A".repeat(50), []);
    expect(wb.sheets[0].name).toHaveLength(31);
  });
});

// ── generateXlsx ──────────────────────────────────────────────────────────

describe("generateXlsx", () => {
  it("throws on empty workbook", () => {
    const wb = createWorkbook();
    expect(() => generateXlsx(wb)).toThrow("at least one sheet");
  });

  it("returns a Uint8Array", () => {
    const wb = createWorkbook();
    addSheet(wb, "Sheet1", [["Hello"]]);
    const result = generateXlsx(wb);
    expect(result).toBeInstanceOf(Uint8Array);
    expect(result.length).toBeGreaterThan(0);
  });

  it("starts with PK ZIP signature", () => {
    const wb = createWorkbook();
    addSheet(wb, "Sheet1", [["A"]]);
    const result = generateXlsx(wb);
    expect(result[0]).toBe(0x50); // P
    expect(result[1]).toBe(0x4b); // K
    expect(result[2]).toBe(0x03);
    expect(result[3]).toBe(0x04);
  });

  it("contains content types XML", () => {
    const wb = createWorkbook();
    addSheet(wb, "Sheet1", [[1, 2, 3]]);
    const result = generateXlsx(wb);
    const text = new TextDecoder().decode(result);
    expect(text).toContain("[Content_Types].xml");
    expect(text).toContain("spreadsheetml.sheet.main");
  });

  it("contains worksheet XML", () => {
    const wb = createWorkbook();
    addSheet(wb, "Data", [
      ["Name", "Value"],
      ["Test", 42],
    ]);
    const result = generateXlsx(wb);
    const text = new TextDecoder().decode(result);
    expect(text).toContain("sheetData");
    expect(text).toContain("Name");
    expect(text).toContain("42");
  });

  it("supports multiple sheets", () => {
    const wb = createWorkbook();
    addSheet(wb, "First", [[1]]);
    addSheet(wb, "Second", [[2]]);
    const result = generateXlsx(wb);
    const text = new TextDecoder().decode(result);
    expect(text).toContain("sheet1.xml");
    expect(text).toContain("sheet2.xml");
    expect(text).toContain("First");
    expect(text).toContain("Second");
  });

  it("encodes boolean cells as 0/1", () => {
    const wb = createWorkbook();
    addSheet(wb, "Sheet1", [[true, false]]);
    const result = generateXlsx(wb);
    const text = new TextDecoder().decode(result);
    expect(text).toContain('t="b"><v>1</v>');
    expect(text).toContain('t="b"><v>0</v>');
  });

  it("handles null/empty values", () => {
    const wb = createWorkbook();
    addSheet(wb, "Sheet1", [[null, undefined, ""]]);
    const result = generateXlsx(wb);
    const text = new TextDecoder().decode(result);
    expect(text).toContain('t="inlineStr"');
  });

  it("escapes XML special characters in cell values", () => {
    const wb = createWorkbook();
    addSheet(wb, "Sheet1", [['<script>alert("xss")</script>']]);
    const result = generateXlsx(wb);
    const text = new TextDecoder().decode(result);
    expect(text).not.toContain("<script>");
    expect(text).toContain("&lt;script&gt;");
  });

  it("generates valid EOCD marker", () => {
    const wb = createWorkbook();
    addSheet(wb, "S", [["x"]]);
    const result = generateXlsx(wb);
    // End of central directory signature
    const last = result.slice(result.length - 22);
    const view = new DataView(last.buffer, last.byteOffset, last.byteLength);
    expect(view.getUint32(0, true)).toBe(0x06054b50);
  });

  it("handles large row/column counts", () => {
    const rows = Array.from({ length: 100 }, (_, r) =>
      Array.from({ length: 10 }, (_, c) => r * 10 + c),
    );
    const wb = createWorkbook();
    addSheet(wb, "Big", rows);
    const result = generateXlsx(wb);
    expect(result.length).toBeGreaterThan(1000);
  });
});
