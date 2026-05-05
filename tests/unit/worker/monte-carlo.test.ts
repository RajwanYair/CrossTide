import { describe, it, expect } from "vitest";
import { handleMonteCarlo } from "../../../worker/routes/monte-carlo";

function makeRequest(body: unknown): Request {
  return new Request("https://worker.example.com/api/monte-carlo", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const validBody = {
  initialValue: 100_000,
  periods: 252,
  simulations: 100,
  meanReturn: 0.001,
  stdDev: 0.015,
  seed: 42,
};

describe("handleMonteCarlo", () => {
  it("returns 400 for invalid JSON body", async () => {
    const req = new Request("https://worker.example.com/api/monte-carlo", {
      method: "POST",
      body: "not-json",
      headers: { "Content-Type": "application/json" },
    });
    const res = await handleMonteCarlo(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect((body as { error: string }).error).toMatch(/json/i);
  });

  it("returns 400 when initialValue is missing", async () => {
    const res = await handleMonteCarlo(makeRequest({ ...validBody, initialValue: undefined }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect((body as { error: string }).error).toMatch(/initialValue/);
  });

  it("returns 400 when initialValue is zero or negative", async () => {
    const res = await handleMonteCarlo(makeRequest({ ...validBody, initialValue: 0 }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when periods exceeds maximum", async () => {
    const res = await handleMonteCarlo(makeRequest({ ...validBody, periods: 2000 }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect((body as { error: string }).error).toMatch(/periods/);
  });

  it("returns 400 when periods is non-integer", async () => {
    const res = await handleMonteCarlo(makeRequest({ ...validBody, periods: 252.5 }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when stdDev is zero or negative", async () => {
    const res = await handleMonteCarlo(makeRequest({ ...validBody, stdDev: 0 }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect((body as { error: string }).error).toMatch(/stdDev/);
  });

  it("returns 400 when simulations exceeds maximum", async () => {
    const res = await handleMonteCarlo(makeRequest({ ...validBody, simulations: 50_000 }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when seed is not a number", async () => {
    const res = await handleMonteCarlo(makeRequest({ ...validBody, seed: "abc" }));
    expect(res.status).toBe(400);
  });

  it("returns 200 with valid input", async () => {
    const res = await handleMonteCarlo(makeRequest(validBody));
    expect(res.status).toBe(200);
  });

  it("response contains percentiles and summary stats", async () => {
    const res = await handleMonteCarlo(makeRequest(validBody));
    const body = await res.json();
    const data = body as {
      percentiles: { p5: number; p25: number; p50: number; p75: number; p95: number };
      probabilityOfLoss: number;
      expectedValue: number;
      samplePaths: number[][];
      params: { initialValue: number; simulations: number };
    };
    expect(typeof data.percentiles.p5).toBe("number");
    expect(typeof data.percentiles.p50).toBe("number");
    expect(typeof data.percentiles.p95).toBe("number");
    expect(typeof data.probabilityOfLoss).toBe("number");
    expect(data.probabilityOfLoss).toBeGreaterThanOrEqual(0);
    expect(data.probabilityOfLoss).toBeLessThanOrEqual(1);
    expect(typeof data.expectedValue).toBe("number");
    expect(Array.isArray(data.samplePaths)).toBe(true);
  });

  it("returns deterministic results with same seed", async () => {
    const res1 = await handleMonteCarlo(makeRequest(validBody));
    const res2 = await handleMonteCarlo(makeRequest(validBody));
    const b1 = (await res1.json()) as { percentiles: { p50: number } };
    const b2 = (await res2.json()) as { percentiles: { p50: number } };
    expect(b1.percentiles.p50).toBe(b2.percentiles.p50);
  });

  it("percentile ordering holds: p5 <= p25 <= p50 <= p75 <= p95", async () => {
    const res = await handleMonteCarlo(makeRequest(validBody));
    const { percentiles } = (await res.json()) as {
      percentiles: { p5: number; p25: number; p50: number; p75: number; p95: number };
    };
    expect(percentiles.p5).toBeLessThanOrEqual(percentiles.p25);
    expect(percentiles.p25).toBeLessThanOrEqual(percentiles.p50);
    expect(percentiles.p50).toBeLessThanOrEqual(percentiles.p75);
    expect(percentiles.p75).toBeLessThanOrEqual(percentiles.p95);
  });

  it("echoes back validated params in response", async () => {
    const res = await handleMonteCarlo(makeRequest(validBody));
    const { params } = (await res.json()) as {
      params: { initialValue: number; simulations: number; periods: number };
    };
    expect(params.initialValue).toBe(validBody.initialValue);
    expect(params.periods).toBe(validBody.periods);
    expect(params.simulations).toBe(validBody.simulations);
  });

  it("uses default simulations (1000) when omitted", async () => {
    const { simulations: _omit, ...bodyWithoutSims } = validBody;
    const res = await handleMonteCarlo(makeRequest(bodyWithoutSims));
    expect(res.status).toBe(200);
    const { params } = (await res.json()) as { params: { simulations: number } };
    expect(params.simulations).toBe(1000);
  });
});
