import { describe, it, expect } from "vitest";
import { handleScreener } from "../../../worker/routes/screener";

function makeRequest(body: unknown): Request {
  return new Request("https://worker.example.com/api/screener", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("handleScreener", () => {
  it("returns 400 for invalid JSON body", async () => {
    const req = new Request("https://worker.example.com/api/screener", {
      method: "POST",
      body: "not-json",
      headers: { "Content-Type": "application/json" },
    });
    const res = await handleScreener(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect((body as { error: string }).error).toMatch(/json/i);
  });

  it("returns 400 when tickers field is missing", async () => {
    const res = await handleScreener(makeRequest({ minRsi: 30 }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect((body as { error: string }).error).toMatch(/tickers/i);
  });

  it("returns 400 when tickers is empty array", async () => {
    const res = await handleScreener(makeRequest({ tickers: [] }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when more than 50 tickers supplied", async () => {
    const tickers = Array.from({ length: 51 }, (_, i) => `T${i}`);
    const res = await handleScreener(makeRequest({ tickers }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect((body as { error: string }).error).toMatch(/50/);
  });

  it("returns rows for valid tickers", async () => {
    const res = await handleScreener(makeRequest({ tickers: ["AAPL", "MSFT", "TSLA"] }));
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      kind: string;
      data: { rows: Array<{ ticker: string; rsi: number; adx: number }> };
      provenance: { coverage: string; limitations: string[] };
    };
    expect(body.kind).toBe("derived");
    expect(body.data.rows.length).toBeGreaterThanOrEqual(1);
    expect(body.data.rows.every((r) => typeof r.rsi === "number")).toBe(true);
    expect(body.data.rows.every((r) => typeof r.adx === "number")).toBe(true);
    expect(body.provenance.coverage).toBe(
      "Deterministic technical metrics for the submitted tickers",
    );
    expect(body.provenance.limitations).toContain(
      "Results use generated inputs until provider-backed screening is enabled",
    );
  });

  it("filters by minRsi", async () => {
    const res = await handleScreener(
      makeRequest({ tickers: ["AAPL", "MSFT", "TSLA", "AMZN", "NVDA"], minRsi: 60 }),
    );
    const body = (await res.json()) as { data: { rows: Array<{ rsi: number }> } };
    expect(body.data.rows.every((r) => r.rsi >= 60)).toBe(true);
  });

  it("filters by maxRsi", async () => {
    const res = await handleScreener(
      makeRequest({ tickers: ["AAPL", "MSFT", "TSLA", "AMZN", "NVDA"], maxRsi: 40 }),
    );
    const body = (await res.json()) as { data: { rows: Array<{ rsi: number }> } };
    expect(body.data.rows.every((r) => r.rsi <= 40)).toBe(true);
  });

  it("filters by minAdx", async () => {
    const res = await handleScreener(
      makeRequest({ tickers: ["AAPL", "MSFT", "TSLA", "AMZN", "NVDA"], minAdx: 50 }),
    );
    const body = (await res.json()) as { data: { rows: Array<{ adx: number }> } };
    expect(body.data.rows.every((r) => r.adx >= 50)).toBe(true);
  });

  it("filters by consensus signal", async () => {
    const tickers = Array.from({ length: 20 }, (_, i) => `T${i}SYM`);
    const res = await handleScreener(makeRequest({ tickers, consensus: "BUY" }));
    const body = (await res.json()) as { data: { rows: Array<{ consensus: string }> } };
    expect(body.data.rows.every((r) => r.consensus === "BUY")).toBe(true);
  });

  it("returns deterministic results for same ticker", async () => {
    const res1 = await handleScreener(makeRequest({ tickers: ["AAPL"] }));
    const res2 = await handleScreener(makeRequest({ tickers: ["AAPL"] }));
    const b1 = (await res1.json()) as { data: { rows: Array<{ rsi: number }> } };
    const b2 = (await res2.json()) as { data: { rows: Array<{ rsi: number }> } };
    expect(b1.data.rows[0]?.rsi).toBe(b2.data.rows[0]?.rsi);
  });

  it("returns empty rows when no tickers match filter", async () => {
    // Impossible combination to force empty result
    const res = await handleScreener(makeRequest({ tickers: ["AAPL"], minRsi: 99, maxRsi: 100 }));
    const body = (await res.json()) as { data: { rows: unknown[] } };
    expect(body.data.rows).toEqual([]);
  });
});
