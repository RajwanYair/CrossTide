import { describe, it, expect } from "vitest";
import { handleIndicators } from "../../../worker/routes/indicators";
import type { Env } from "../../../worker/index";

function makeUrl(params: Record<string, string>): URL {
  const url = new URL("https://api.example.com/api/indicators");
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }
  return url;
}

const emptyEnv: Env = {};

describe("handleIndicators", () => {
  it("returns 400 when symbol is missing", async () => {
    const res = await handleIndicators(makeUrl({ indicators: "rsi" }), emptyEnv);
    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid symbol format", async () => {
    const res = await handleIndicators(makeUrl({ symbol: "bad$$", indicators: "rsi" }), emptyEnv);
    expect(res.status).toBe(400);
  });

  it("returns 400 when indicators param is missing", async () => {
    const res = await handleIndicators(makeUrl({ symbol: "AAPL" }), emptyEnv);
    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid range", async () => {
    const res = await handleIndicators(
      makeUrl({ symbol: "AAPL", indicators: "rsi", range: "10y" }),
      emptyEnv,
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 for unknown indicator", async () => {
    const res = await handleIndicators(
      makeUrl({ symbol: "AAPL", indicators: "rsi,foobar" }),
      emptyEnv,
    );
    expect(res.status).toBe(400);
    const body = await res.json<{ error: string }>();
    expect(body.error).toMatch(/unknown/i);
  });

  it("returns 400 for too many indicators", async () => {
    const res = await handleIndicators(
      makeUrl({ symbol: "AAPL", indicators: "rsi,macd,sma,ema,bb,atr,obv" }),
      emptyEnv,
    );
    expect(res.status).toBe(400);
  });

  it("returns indicator data for valid request", async () => {
    const res = await handleIndicators(
      makeUrl({ symbol: "AAPL", indicators: "rsi,macd", range: "1y" }),
      emptyEnv,
    );
    expect(res.status).toBe(200);
    const body = await res.json<{
      symbol: string;
      range: string;
      indicators: Array<{ name: string; values: number[] }>;
      dataPoints: number;
    }>();
    expect(body.symbol).toBe("AAPL");
    expect(body.range).toBe("1y");
    expect(body.indicators.length).toBe(2);
    expect(body.dataPoints).toBe(252);
  });

  it("indicator results have correct structure", async () => {
    const res = await handleIndicators(makeUrl({ symbol: "MSFT", indicators: "sma" }), emptyEnv);
    const body = await res.json<{
      indicators: Array<{ name: string; values: number[]; period?: number }>;
    }>();
    const sma = body.indicators[0]!;
    expect(sma.name).toBe("sma");
    expect(sma.period).toBe(20);
    expect(sma.values.length).toBe(252);
    expect(typeof sma.values[0]).toBe("number");
  });

  it("deduplicates indicators", async () => {
    const res = await handleIndicators(
      makeUrl({ symbol: "AAPL", indicators: "rsi,rsi,macd" }),
      emptyEnv,
    );
    const body = await res.json<{
      indicators: Array<{ name: string }>;
    }>();
    expect(body.indicators.length).toBe(2);
  });

  it("returns cache-control header", async () => {
    const res = await handleIndicators(makeUrl({ symbol: "AAPL", indicators: "rsi" }), emptyEnv);
    expect(res.headers.get("Cache-Control")).toContain("max-age=60");
  });

  it("handles different ranges with correct data point counts", async () => {
    const rangeCounts: Record<string, number> = {
      "1mo": 22,
      "3mo": 63,
      "6mo": 126,
      "2y": 504,
      "5y": 1260,
    };

    for (const [range, expected] of Object.entries(rangeCounts)) {
      const res = await handleIndicators(
        makeUrl({ symbol: "AAPL", indicators: "rsi", range }),
        emptyEnv,
      );
      const body = await res.json<{ dataPoints: number }>();
      expect(body.dataPoints).toBe(expected);
    }
  });
});
