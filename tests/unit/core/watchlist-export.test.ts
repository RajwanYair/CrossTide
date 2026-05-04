import { describe, it, expect } from "vitest";
import {
  toCsv,
  toTsv,
  toJson,
  toText,
  exportWatchlist,
  exportFilename,
  parseTickerList,
} from "../../../src/core/watchlist-export";

describe("watchlist-export", () => {
  const tickers = [
    {
      ticker: "AAPL",
      price: 190.5,
      changePercent: 1.5,
      volume: 5_000_000,
      signal: "BUY",
      notes: "Strong",
    },
    { ticker: "MSFT", price: 380.0, changePercent: -0.3, volume: 3_000_000, signal: "HOLD" },
  ];

  it("toCsv generates valid CSV with headers", () => {
    const csv = toCsv(tickers);
    const lines = csv.split("\n");
    expect(lines[0]).toBe("Ticker,Price,Change%,Volume,Signal,Notes");
    expect(lines[1]).toContain("AAPL");
    expect(lines[1]).toContain("190.5");
    expect(lines).toHaveLength(3);
  });

  it("toCsv replaces commas in notes", () => {
    const data = [{ ticker: "A", notes: "one, two, three" }];
    const csv = toCsv(data);
    expect(csv).not.toContain("one, two");
    expect(csv).toContain("one; two; three");
  });

  it("toTsv uses tabs", () => {
    const tsv = toTsv(tickers);
    const lines = tsv.split("\n");
    expect(lines[0]!.split("\t")).toHaveLength(6);
  });

  it("toJson produces valid JSON", () => {
    const json = toJson(tickers);
    const parsed = JSON.parse(json);
    expect(parsed).toHaveLength(2);
    expect(parsed[0].ticker).toBe("AAPL");
  });

  it("toText outputs one ticker per line", () => {
    const text = toText(tickers);
    const lines = text.split("\n");
    expect(lines).toEqual(["AAPL", "MSFT"]);
  });

  it("exportWatchlist dispatches to correct formatter", () => {
    const csv = exportWatchlist(tickers, "csv");
    expect(csv).toContain("Ticker,Price");
    const text = exportWatchlist(tickers, "text");
    expect(text).toBe("AAPL\nMSFT");
  });

  it("exportFilename includes date and correct extension", () => {
    const filename = exportFilename("csv");
    expect(filename).toMatch(/^watchlist-\d{4}-\d{2}-\d{2}\.csv$/);
  });

  it("exportFilename uses text extension for text format", () => {
    const filename = exportFilename("text", "portfolio");
    expect(filename).toMatch(/^portfolio-\d{4}-\d{2}-\d{2}\.txt$/);
  });

  it("parseTickerList splits on newlines and commas", () => {
    const result = parseTickerList("aapl\nmsft,goog;tsla");
    expect(result).toEqual(["AAPL", "MSFT", "GOOG", "TSLA"]);
  });

  it("parseTickerList filters out invalid entries", () => {
    const result = parseTickerList("AAPL\n\n   \nTHISISTOOLONGTOBEATICKER");
    expect(result).toEqual(["AAPL"]);
  });

  it("handles empty ticker list gracefully", () => {
    expect(toCsv([])).toBe("Ticker,Price,Change%,Volume,Signal,Notes");
    expect(toText([])).toBe("");
    expect(toJson([])).toBe("[]");
  });
});
