import { describe, it, expect } from "vitest";
import { parseTickersFromText } from "../../../src/core/watchlist-import";

describe("parseTickersFromText", () => {
  it("parses comma-separated tickers", () => {
    expect(parseTickersFromText("AAPL, MSFT, GOOG")).toEqual(["AAPL", "MSFT", "GOOG"]);
  });

  it("parses newline-separated tickers", () => {
    expect(parseTickersFromText("AAPL\nMSFT\nGOOG")).toEqual(["AAPL", "MSFT", "GOOG"]);
  });

  it("parses tab-separated with names", () => {
    expect(parseTickersFromText("AAPL\tApple Inc\nMSFT\tMicrosoft")).toEqual(["AAPL", "MSFT"]);
  });

  it("deduplicates tickers", () => {
    expect(parseTickersFromText("AAPL, MSFT, AAPL, GOOG, MSFT")).toEqual(["AAPL", "MSFT", "GOOG"]);
  });

  it("normalizes to uppercase", () => {
    expect(parseTickersFromText("aapl, msft")).toEqual(["AAPL", "MSFT"]);
  });

  it("skips CSV headers", () => {
    expect(parseTickersFromText("Symbol,Price\nAAPL,150\nMSFT,300")).toEqual(["AAPL", "MSFT"]);
  });

  it("handles semicolons and pipes as separators", () => {
    expect(parseTickersFromText("AAPL;MSFT|GOOG")).toEqual(["AAPL", "MSFT", "GOOG"]);
  });

  it("rejects invalid patterns", () => {
    expect(parseTickersFromText("AAPL, 123-invalid, MSFT")).toEqual(["AAPL", "MSFT"]);
  });

  it("handles tickers with dots and carets", () => {
    expect(parseTickersFromText("BRK.B, ^GSPC, AAPL")).toEqual(["BRK.B", "^GSPC", "AAPL"]);
  });

  it("returns empty array for empty input", () => {
    expect(parseTickersFromText("")).toEqual([]);
    expect(parseTickersFromText("   ")).toEqual([]);
  });

  it("handles space-separated tickers (first word per segment)", () => {
    expect(parseTickersFromText("AAPL\nMSFT Corp\nGOOG Alphabet")).toEqual([
      "AAPL",
      "MSFT",
      "GOOG",
    ]);
  });
});
