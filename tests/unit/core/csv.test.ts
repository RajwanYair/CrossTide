import { describe, it, expect } from "vitest";
import {
  parseCsv,
  parseCsvAsObjects,
  serializeCsv,
  serializeObjects,
} from "../../../src/core/csv";

describe("csv", () => {
  it("parses simple comma-separated rows", () => {
    expect(parseCsv("a,b,c\n1,2,3")).toEqual([
      ["a", "b", "c"],
      ["1", "2", "3"],
    ]);
  });

  it("handles CRLF line endings", () => {
    expect(parseCsv("a,b\r\n1,2")).toEqual([
      ["a", "b"],
      ["1", "2"],
    ]);
  });

  it("handles quoted fields with commas", () => {
    expect(parseCsv('a,b\n"1,000",hi')).toEqual([
      ["a", "b"],
      ["1,000", "hi"],
    ]);
  });

  it("handles embedded quotes (doubled)", () => {
    expect(parseCsv('a\n"He said ""hi"""')).toEqual([
      ["a"],
      ['He said "hi"'],
    ]);
  });

  it("handles embedded newlines in quoted fields", () => {
    expect(parseCsv('a\n"line1\nline2"')).toEqual([
      ["a"],
      ["line1\nline2"],
    ]);
  });

  it("handles trailing newline", () => {
    expect(parseCsv("a,b\n1,2\n")).toEqual([
      ["a", "b"],
      ["1", "2"],
    ]);
  });

  it("rejects multi-char delimiter", () => {
    expect(() => parseCsv("a,b", { delimiter: ",,," })).toThrow();
  });

  it("parseCsvAsObjects keys by header", () => {
    expect(parseCsvAsObjects("name,qty\nAAPL,10\nMSFT,5")).toEqual([
      { name: "AAPL", qty: "10" },
      { name: "MSFT", qty: "5" },
    ]);
  });

  it("parseCsvAsObjects handles missing trailing fields", () => {
    expect(parseCsvAsObjects("a,b,c\n1,2")).toEqual([
      { a: "1", b: "2", c: "" },
    ]);
  });

  it("serializeCsv quotes when necessary", () => {
    const out = serializeCsv([
      ["a", "b"],
      ['has "quote"', "with,comma"],
    ]);
    expect(out).toBe('a,b\n"has ""quote""","with,comma"');
  });

  it("serializeCsv supports CRLF", () => {
    expect(serializeCsv([["a"], ["b"]], { crlf: true })).toBe("a\r\nb");
  });

  it("serializeObjects writes header row", () => {
    expect(
      serializeObjects(
        [
          { ticker: "AAPL", qty: 10 },
          { ticker: "MSFT", qty: 5 },
        ],
        ["ticker", "qty"],
      ),
    ).toBe("ticker,qty\nAAPL,10\nMSFT,5");
  });

  it("roundtrips through parse and serialize", () => {
    const data = [
      ["ticker", "name"],
      ["AAPL", "Apple, Inc."],
      ["MSFT", 'Microsoft "Corp"'],
    ];
    const csv = serializeCsv(data);
    expect(parseCsv(csv)).toEqual(data);
  });
});
