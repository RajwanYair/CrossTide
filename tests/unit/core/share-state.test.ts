import { describe, it, expect } from "vitest";
import {
  encodeShareState,
  decodeShareState,
  buildShareUrl,
  readShareUrl,
  encodeWatchlistUrl,
  decodeWatchlistUrl,
  encodeDrawingsUrl,
  decodeDrawingsUrl,
  WATCHLIST_MAX_TICKERS,
  DRAWINGS_MAX,
  type ShareState,
} from "../../../src/core/share-state";

describe("share-state", () => {
  it("roundtrips a populated state", () => {
    const s: ShareState = {
      symbol: "AAPL",
      range: "1y",
      card: "chart",
      filters: ["oversold", "breakout"],
    };
    const tok = encodeShareState(s);
    expect(decodeShareState(tok)).toEqual(s);
  });

  it("roundtrips empty state", () => {
    expect(decodeShareState(encodeShareState({}))).toEqual({});
  });

  it("decodeShareState returns null for empty token", () => {
    expect(decodeShareState("")).toBeNull();
  });

  it("decodeShareState returns null for garbage", () => {
    expect(decodeShareState("!!not-base64!!")).toBeNull();
  });

  it("decodeShareState rejects wrong version", () => {
    const bad = JSON.stringify({ v: 99, s: {} });
    let bin = "";
    const bytes = new TextEncoder().encode(bad);
    for (const b of bytes) bin += String.fromCharCode(b);
    const tok = btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    expect(decodeShareState(tok)).toBeNull();
  });

  it("buildShareUrl appends token query param", () => {
    const url = buildShareUrl("/chart", { symbol: "MSFT" });
    expect(url).toMatch(/^\/chart\?s=/);
  });

  it("decodeShareState returns null when object has v but no s field", () => {
    // Build a valid base64url token for { v: 1 } (missing "s")
    const json = JSON.stringify({ v: 1 });
    const bytes = new TextEncoder().encode(json);
    let bin = "";
    for (const b of bytes) bin += String.fromCharCode(b);
    const tok = btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    expect(decodeShareState(tok)).toBeNull();
  });

  it("readShareUrl extracts state", () => {
    const url = buildShareUrl("/chart", { symbol: "GOOG", range: "5d" });
    expect(readShareUrl(url)).toEqual({ symbol: "GOOG", range: "5d" });
  });

  it("readShareUrl returns null when no token", () => {
    expect(readShareUrl("/chart")).toBeNull();
  });

  it("base64url has no + / =", () => {
    const tok = encodeShareState({ symbol: "??>>><<" });
    expect(tok).not.toMatch(/[+/=]/);
  });
});

describe("watchlist URL encoding (D5)", () => {
  it("encodeWatchlistUrl round-trips via decodeWatchlistUrl", () => {
    const tickers = ["AAPL", "MSFT", "GOOG"];
    const url = encodeWatchlistUrl(tickers, "http://localhost/");
    expect(decodeWatchlistUrl(url)).toEqual(tickers);
  });

  it("normalises tickers to uppercase", () => {
    const url = encodeWatchlistUrl(["aapl", "msft"], "http://localhost/");
    expect(decodeWatchlistUrl(url)).toEqual(["AAPL", "MSFT"]);
  });

  it("strips whitespace from tickers", () => {
    const url = encodeWatchlistUrl(["  AAPL  ", " TSLA"], "http://localhost/");
    expect(decodeWatchlistUrl(url)).toEqual(["AAPL", "TSLA"]);
  });

  it("filters out empty strings", () => {
    const url = encodeWatchlistUrl(["AAPL", "", "  ", "MSFT"], "http://localhost/");
    expect(decodeWatchlistUrl(url)).toEqual(["AAPL", "MSFT"]);
  });

  it("caps at WATCHLIST_MAX_TICKERS", () => {
    const many = Array.from({ length: 300 }, (_, i) => `T${i}`);
    const url = encodeWatchlistUrl(many, "http://localhost/");
    const result = decodeWatchlistUrl(url);
    expect(result.length).toBe(WATCHLIST_MAX_TICKERS);
  });

  it("decodeWatchlistUrl returns empty array for URL with no token", () => {
    expect(decodeWatchlistUrl("http://localhost/watchlist")).toEqual([]);
  });

  it("decodeWatchlistUrl returns empty array for URL without watchlist field", () => {
    const url = buildShareUrl("http://localhost/", { symbol: "AAPL" });
    expect(decodeWatchlistUrl(url)).toEqual([]);
  });

  it("encodeWatchlistUrl URL contains the query param 's'", () => {
    const url = encodeWatchlistUrl(["AAPL"], "http://localhost/");
    expect(url).toContain("?s=");
  });

  it("round-trips a large realistic watchlist", () => {
    const tickers = ["AAPL", "MSFT", "GOOG", "AMZN", "META", "TSLA", "NVDA", "AMD", "INTC", "NFLX"];
    const url = encodeWatchlistUrl(tickers, "http://localhost/");
    expect(decodeWatchlistUrl(url)).toEqual(tickers);
  });
});

describe("drawing URL sharing", () => {
  it("round-trips drawings for a ticker", () => {
    const drawings = [
      {
        kind: "line",
        points: [
          { x: 0, y: 100 },
          { x: 50, y: 200 },
        ],
      },
      {
        kind: "rect",
        points: [
          { x: 10, y: 10 },
          { x: 50, y: 50 },
        ],
      },
    ];
    const url = encodeDrawingsUrl("AAPL", drawings, "http://localhost/");
    const result = decodeDrawingsUrl(url);
    expect(result).not.toBeNull();
    expect(result!.symbol).toBe("AAPL");
    expect(result!.drawings).toEqual(drawings);
  });

  it("normalizes ticker to uppercase", () => {
    const url = encodeDrawingsUrl("aapl", [{ kind: "line" }], "http://localhost/");
    const result = decodeDrawingsUrl(url);
    expect(result!.symbol).toBe("AAPL");
  });

  it("caps drawings at DRAWINGS_MAX", () => {
    const many = Array.from({ length: 100 }, (_, i) => ({ kind: "line", id: i }));
    const url = encodeDrawingsUrl("MSFT", many, "http://localhost/");
    const result = decodeDrawingsUrl(url);
    expect(result!.drawings.length).toBe(DRAWINGS_MAX);
  });

  it("returns null for URL without drawings", () => {
    const url = encodeWatchlistUrl(["AAPL"], "http://localhost/");
    expect(decodeDrawingsUrl(url)).toBeNull();
  });
});
