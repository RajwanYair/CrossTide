import { describe, it, expect } from "vitest";
import { handleCompare } from "../../../worker/routes/compare";
import type { Env } from "../../../worker/index";

function makeUrl(params: Record<string, string>): URL {
  const url = new URL("https://api.example.com/api/compare");
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }
  return url;
}

const emptyEnv: Env = {};

describe("handleCompare", () => {
  it("returns 400 when symbols param is missing", async () => {
    const res = await handleCompare(makeUrl({}), emptyEnv);
    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid range", async () => {
    const res = await handleCompare(makeUrl({ symbols: "AAPL", range: "10y" }), emptyEnv);
    expect(res.status).toBe(400);
    const body = await res.json<{ error: string }>();
    expect(body.error).toMatch(/invalid range/i);
  });

  it("returns 400 for too many symbols", async () => {
    const symbols = Array.from({ length: 9 }, (_, i) => `T${i}`).join(",");
    const res = await handleCompare(makeUrl({ symbols }), emptyEnv);
    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid symbol format", async () => {
    const res = await handleCompare(makeUrl({ symbols: "AAPL,bad$$" }), emptyEnv);
    expect(res.status).toBe(400);
  });

  it("returns comparison data for valid symbols", async () => {
    const res = await handleCompare(makeUrl({ symbols: "AAPL,MSFT,GOOG", range: "1y" }), emptyEnv);
    expect(res.status).toBe(200);
    const body = await res.json<{
      range: string;
      summaries: Array<{ symbol: string }>;
      count: number;
    }>();
    expect(body.range).toBe("1y");
    expect(body.count).toBe(3);
    expect(body.summaries.length).toBe(3);
    expect(body.summaries[0]!.symbol).toBe("AAPL");
  });

  it("each summary has required fields", async () => {
    const res = await handleCompare(makeUrl({ symbols: "AAPL", range: "1y" }), emptyEnv);
    const body = await res.json<{
      summaries: Array<{
        symbol: string;
        totalReturn: number;
        annualizedReturn: number;
        volatility: number;
        sharpe: number;
        maxDrawdown: number;
      }>;
    }>();
    const s = body.summaries[0]!;
    expect(s).toHaveProperty("symbol");
    expect(s).toHaveProperty("totalReturn");
    expect(s).toHaveProperty("annualizedReturn");
    expect(s).toHaveProperty("volatility");
    expect(s).toHaveProperty("sharpe");
    expect(s).toHaveProperty("maxDrawdown");
    expect(s.maxDrawdown).toBeLessThanOrEqual(0);
  });

  it("deduplicates symbols", async () => {
    const res = await handleCompare(makeUrl({ symbols: "AAPL,AAPL,MSFT" }), emptyEnv);
    const body = await res.json<{ count: number }>();
    expect(body.count).toBe(2);
  });

  it("returns cache-control header", async () => {
    const res = await handleCompare(makeUrl({ symbols: "AAPL", range: "1y" }), emptyEnv);
    expect(res.headers.get("Cache-Control")).toContain("max-age=60");
  });

  it("accepts all valid ranges", async () => {
    for (const range of ["1mo", "3mo", "6mo", "1y", "2y", "5y"]) {
      const res = await handleCompare(makeUrl({ symbols: "AAPL", range }), emptyEnv);
      expect(res.status).toBe(200);
    }
  });
});
