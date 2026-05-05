import { describe, it, expect } from "vitest";
import { handlePairs } from "../../../worker/routes/pairs";

function makeRequest(body: unknown): Request {
  return new Request("https://worker.example.com/api/pairs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

/** Generate a simple trending price series starting at `start`. */
function priceSeries(start: number, n: number, drift = 0.001): number[] {
  const out: number[] = [];
  let p = start;
  for (let i = 0; i < n; i++) {
    p *= 1 + drift + Math.sin(i * 0.1) * 0.005;
    out.push(p);
  }
  return out;
}

const seriesY = priceSeries(100, 60, 0.001);
const seriesX = priceSeries(50, 60, 0.001);

describe("handlePairs", () => {
  it("returns 400 for invalid JSON body", async () => {
    const req = new Request("https://worker.example.com/api/pairs", {
      method: "POST",
      body: "not-json",
      headers: { "Content-Type": "application/json" },
    });
    const res = await handlePairs(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect((body as { error: string }).error).toMatch(/json/i);
  });

  it("returns 400 when seriesY is missing", async () => {
    const res = await handlePairs(makeRequest({ seriesX }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect((body as { error: string }).error).toMatch(/seriesY/);
  });

  it("returns 400 when seriesX is missing", async () => {
    const res = await handlePairs(makeRequest({ seriesY }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect((body as { error: string }).error).toMatch(/seriesX/);
  });

  it("returns 400 when seriesY is too short", async () => {
    const res = await handlePairs(makeRequest({ seriesY: [1, 2, 3], seriesX }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect((body as { error: string }).error).toMatch(/seriesY/);
  });

  it("returns 400 when series contains non-finite values", async () => {
    const badSeries = [...seriesY];
    badSeries[5] = NaN;
    const res = await handlePairs(makeRequest({ seriesY: badSeries, seriesX }));
    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid entryZ", async () => {
    const res = await handlePairs(makeRequest({ seriesY, seriesX, entryZ: -1 }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect((body as { error: string }).error).toMatch(/entryZ/);
  });

  it("returns 400 for non-integer lookback", async () => {
    const res = await handlePairs(makeRequest({ seriesY, seriesX, lookback: 5.5 }));
    expect(res.status).toBe(400);
  });

  it("returns 400 for lookback < 2", async () => {
    const res = await handlePairs(makeRequest({ seriesY, seriesX, lookback: 1 }));
    expect(res.status).toBe(400);
  });

  it("returns 200 with valid input", async () => {
    const res = await handlePairs(makeRequest({ seriesY, seriesX }));
    expect(res.status).toBe(200);
  });

  it("response includes hedgeRatio, meanSpread, spreadStd, signals", async () => {
    const res = await handlePairs(makeRequest({ seriesY, seriesX }));
    const body = await res.json();
    const data = body as {
      hedgeRatio: number;
      meanSpread: number;
      spreadStd: number;
      spread: number[];
      zScore: number[];
      signals: unknown[];
      signalCount: number;
    };
    expect(typeof data.hedgeRatio).toBe("number");
    expect(typeof data.meanSpread).toBe("number");
    expect(typeof data.spreadStd).toBe("number");
    expect(Array.isArray(data.spread)).toBe(true);
    expect(Array.isArray(data.zScore)).toBe(true);
    expect(Array.isArray(data.signals)).toBe(true);
    expect(data.signalCount).toBe(data.signals.length);
  });

  it("spread length equals min(seriesY, seriesX) length", async () => {
    const res = await handlePairs(makeRequest({ seriesY, seriesX }));
    const { spread } = (await res.json()) as { spread: number[] };
    expect(spread.length).toBe(Math.min(seriesY.length, seriesX.length));
  });

  it("accepts optional entryZ and exitZ parameters", async () => {
    const res = await handlePairs(
      makeRequest({ seriesY, seriesX, entryZ: 1.5, exitZ: 0.3, stopZ: 4.0 }),
    );
    expect(res.status).toBe(200);
  });
});
