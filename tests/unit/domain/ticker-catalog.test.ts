/**
 * Static ticker catalog tests — offline fallback for the ticker search box.
 */
import { describe, it, expect } from "vitest";
import {
  getTickerCatalog,
  isSupportedSymbol,
  searchTickerCatalog,
} from "../../../src/domain/ticker-catalog";

describe("ticker-catalog", () => {
  it("exposes a non-empty catalog with unique symbols", () => {
    const catalog = getTickerCatalog();
    expect(catalog.length).toBeGreaterThan(100);
    expect(new Set(catalog.map((e) => e.symbol)).size).toBe(catalog.length);
  });

  it("covers every instrument class the app renders", () => {
    const types = new Set(getTickerCatalog().map((e) => e.type));
    expect(types).toEqual(new Set(["stock", "etf", "crypto", "forex", "index"]));
  });

  it("returns nothing for a blank query", () => {
    expect(searchTickerCatalog("")).toEqual([]);
    expect(searchTickerCatalog("   ")).toEqual([]);
  });

  it("ranks an exact symbol match first", () => {
    expect(searchTickerCatalog("AAPL")[0]?.symbol).toBe("AAPL");
  });

  it("matches a symbol prefix case-insensitively", () => {
    expect(searchTickerCatalog("msf")[0]?.symbol).toBe("MSFT");
  });

  it("matches by company name", () => {
    const symbols = searchTickerCatalog("apple").map((e) => e.symbol);
    expect(symbols).toContain("AAPL");
  });

  it("finds crypto, forex and index symbols", () => {
    expect(searchTickerCatalog("BTC").map((e) => e.symbol)).toContain("BTC-USD");
    expect(searchTickerCatalog("EURUSD").map((e) => e.symbol)).toContain("EURUSD=X");
    expect(searchTickerCatalog("^GSPC").map((e) => e.symbol)).toContain("^GSPC");
    expect(searchTickerCatalog("nikkei").map((e) => e.symbol)).toContain("^N225");
  });

  it("honours the result limit", () => {
    expect(searchTickerCatalog("A", 3)).toHaveLength(3);
  });

  it("returns nothing for a query that matches no symbol or name", () => {
    expect(searchTickerCatalog("ZZZZQQQ")).toEqual([]);
  });
});

describe("isSupportedSymbol", () => {
  it.each(["MSFT", "A", "BRK.B", "BTC-USD", "^GSPC", "^TA125.TA", "EURUSD=X", "RDSA.AS"])(
    "accepts %s",
    (symbol) => {
      expect(isSupportedSymbol(symbol)).toBe(true);
    },
  );

  it("accepts lowercase input", () => {
    expect(isSupportedSymbol("aapl")).toBe(true);
  });

  it.each(["", "   ", "!!!", "AA PL", "AAPL$", "A".repeat(20), "<script>"])(
    "rejects %s",
    (symbol) => {
      expect(isSupportedSymbol(symbol)).toBe(false);
    },
  );

  it("accepts every symbol in the catalog", () => {
    for (const entry of getTickerCatalog()) {
      expect(isSupportedSymbol(entry.symbol)).toBe(true);
    }
  });
});
