import { describe, it, expect, vi } from "vitest";
import {
  tableToCsv,
  copyTableToClipboard,
  copyCellToClipboard,
} from "../../../src/core/table-export";

describe("tableToCsv", () => {
  const columns = [
    { key: "ticker", label: "Ticker" },
    { key: "price", label: "Price" },
    { key: "change", label: "Change %" },
  ];

  it("generates header + rows in csv format", () => {
    const rows = [
      { ticker: "AAPL", price: 150.25, change: 1.5 },
      { ticker: "MSFT", price: 320.1, change: -0.3 },
    ];
    const csv = tableToCsv(columns, rows);
    expect(csv).toBe("Ticker,Price,Change %\nAAPL,150.25,1.5\nMSFT,320.1,-0.3");
  });

  it("returns header only for empty rows", () => {
    const csv = tableToCsv(columns, []);
    expect(csv).toBe("Ticker,Price,Change %");
  });

  it("escapes fields containing commas", () => {
    const cols = [{ key: "name", label: "Name" }];
    const rows = [{ name: "Berkshire Hathaway, Inc." }];
    const csv = tableToCsv(cols, rows);
    expect(csv).toBe('Name\n"Berkshire Hathaway, Inc."');
  });

  it("escapes fields containing double-quotes", () => {
    const cols = [{ key: "desc", label: "Description" }];
    const rows = [{ desc: 'Said "hello"' }];
    const csv = tableToCsv(cols, rows);
    expect(csv).toBe('Description\n"Said ""hello"""');
  });

  it("escapes fields containing newlines", () => {
    const cols = [{ key: "note", label: "Note" }];
    const rows = [{ note: "line1\nline2" }];
    const csv = tableToCsv(cols, rows);
    expect(csv).toBe('Note\n"line1\nline2"');
  });

  it("handles null/undefined values as empty strings", () => {
    const cols = [
      { key: "a", label: "A" },
      { key: "b", label: "B" },
    ];
    const rows = [{ a: null, b: undefined }];
    const csv = tableToCsv(cols, rows as unknown as Record<string, unknown>[]);
    expect(csv).toBe("A,B\n,");
  });
});

describe("copyTableToClipboard", () => {
  it("writes tab-separated data to clipboard", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { clipboard: { writeText } });

    const columns = [
      { key: "ticker", label: "Ticker" },
      { key: "price", label: "Price" },
    ];
    const rows = [{ ticker: "AAPL", price: 150 }];

    const result = await copyTableToClipboard(columns, rows);
    expect(result).toBe(true);
    expect(writeText).toHaveBeenCalledWith("Ticker\tPrice\nAAPL\t150");

    vi.unstubAllGlobals();
  });

  it("returns false when clipboard write fails", async () => {
    const writeText = vi.fn().mockRejectedValue(new Error("denied"));
    vi.stubGlobal("navigator", { clipboard: { writeText } });

    const result = await copyTableToClipboard([], []);
    expect(result).toBe(false);

    vi.unstubAllGlobals();
  });
});

describe("copyCellToClipboard", () => {
  it("copies a cell value to clipboard", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { clipboard: { writeText } });

    const result = await copyCellToClipboard(42.5);
    expect(result).toBe(true);
    expect(writeText).toHaveBeenCalledWith("42.5");

    vi.unstubAllGlobals();
  });

  it("handles null values", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { clipboard: { writeText } });

    const result = await copyCellToClipboard(null);
    expect(result).toBe(true);
    expect(writeText).toHaveBeenCalledWith("");

    vi.unstubAllGlobals();
  });
});
