import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  fetchStooqHistory,
  parseStooqCsv,
  toStooqSymbol,
  StooqApiError,
} from "../../../worker/providers/stooq";

describe("toStooqSymbol", () => {
  it("maps US equities with .us suffix", () => {
    expect(toStooqSymbol("AAPL")).toBe("aapl.us");
    expect(toStooqSymbol("MSFT")).toBe("msft.us");
  });

  it("maps crypto with .v suffix", () => {
    expect(toStooqSymbol("BTC")).toBe("btc.v");
    expect(toStooqSymbol("ETH")).toBe("eth.v");
  });

  it("strips caret from index symbols", () => {
    expect(toStooqSymbol("^DJI")).toBe("dji");
    expect(toStooqSymbol("^GSPC")).toBe("gspc");
  });

  it("passes through already-suffixed symbols", () => {
    expect(toStooqSymbol("aapl.us")).toBe("aapl.us");
    expect(toStooqSymbol("btc.v")).toBe("btc.v");
  });
});

describe("parseStooqCsv", () => {
  it("parses valid CSV", () => {
    const csv =
      "Date,Open,High,Low,Close,Volume\n2024-01-02,100,105,99,104,1000000\n2024-01-01,98,101,97,100,900000\n";
    const candles = parseStooqCsv(csv, "AAPL");
    expect(candles).toHaveLength(2);
    // Should be reversed to oldest-first
    expect(candles[0]?.date).toBe("2024-01-01");
    expect(candles[1]?.date).toBe("2024-01-02");
  });

  it("throws on empty data", () => {
    expect(() => parseStooqCsv("Date\n", "AAPL")).toThrow(StooqApiError);
  });

  it("throws on header-only CSV", () => {
    expect(() => parseStooqCsv("Date,Open,High,Low,Close\n", "AAPL")).toThrow(StooqApiError);
  });

  it("skips malformed lines", () => {
    const csv = "Date,Open,High,Low,Close,Volume\n2024-01-01,100,105,99,104,1000000\nbadline\n";
    const candles = parseStooqCsv(csv, "AAPL");
    expect(candles).toHaveLength(1);
  });

  it("handles missing volume", () => {
    const csv = "Date,Open,High,Low,Close\n2024-01-01,100,105,99,104\n";
    const candles = parseStooqCsv(csv, "AAPL");
    expect(candles).toHaveLength(1);
    expect(candles[0]?.volume).toBe(0);
  });
});

describe("fetchStooqHistory", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns candles for valid ticker", async () => {
    const csv =
      "Date,Open,High,Low,Close,Volume\n2024-06-01,190,195,189,194,5000000\n2024-05-31,188,191,187,190,4000000\n";
    vi.mocked(fetch).mockResolvedValue(new Response(csv, { status: 200 }));
    const result = await fetchStooqHistory("AAPL", "1y");
    expect(result.ticker).toBe("AAPL");
    expect(result.candles).toHaveLength(2);
    expect(result.source).toBe("stooq");
  });

  it("trims candles to requested range", async () => {
    const lines = ["Date,Open,High,Low,Close,Volume"];
    for (let i = 400; i >= 1; i--) {
      lines.push(`2024-01-${String(i).padStart(2, "0")},100,105,99,104,1000000`);
    }
    vi.mocked(fetch).mockResolvedValue(new Response(lines.join("\n"), { status: 200 }));
    const result = await fetchStooqHistory("AAPL", "1mo");
    expect(result.candles.length).toBeLessThanOrEqual(30);
  });

  it("returns all candles for max range", async () => {
    const csv =
      "Date,Open,High,Low,Close,Volume\n2024-01-02,100,105,99,104,1000000\n2024-01-01,98,101,97,100,900000\n";
    vi.mocked(fetch).mockResolvedValue(new Response(csv, { status: 200 }));
    const result = await fetchStooqHistory("AAPL", "max");
    expect(result.candles).toHaveLength(2);
  });

  it("throws on upstream error", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response("error", { status: 500 }));
    await expect(fetchStooqHistory("AAPL")).rejects.toThrow(StooqApiError);
  });

  it("constructs correct URL with stooq symbol", async () => {
    const csv = "Date,Open,High,Low,Close,Volume\n2024-01-01,100,105,99,104,1000000\n";
    vi.mocked(fetch).mockResolvedValue(new Response(csv, { status: 200 }));
    await fetchStooqHistory("AAPL", "1y");
    const calledUrl = String(vi.mocked(fetch).mock.calls[0]?.[0]);
    expect(calledUrl).toContain("s=aapl.us");
  });
});
