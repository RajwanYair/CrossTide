import { describe, it, expect } from "vitest";
import { handleFactorModel } from "../../../worker/routes/factor-model";

function makeRequest(body: unknown): Request {
  return new Request("https://worker.example.com/api/factor-model", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

/** Generate a returns series with some random-walk properties. */
function returnsSeries(n: number, mean = 0.001, std = 0.02): number[] {
  const out: number[] = [];
  let seed = 42;
  const rng = () => {
    seed = (seed * 1664525 + 1013904223) & 0xffffffff;
    return (seed >>> 0) / 0xffffffff - 0.5;
  };
  for (let i = 0; i < n; i++) {
    out.push(mean + rng() * std);
  }
  return out;
}

const n = 60;
const excessReturns = returnsSeries(n, 0.001, 0.02);
const marketExcess = returnsSeries(n, 0.0008, 0.018);
const smb = returnsSeries(n, 0.0002, 0.01);
const hml = returnsSeries(n, 0.0001, 0.01);

const validBody = { excessReturns, marketExcess, smb, hml };

describe("handleFactorModel", () => {
  it("returns 400 for invalid JSON body", async () => {
    const req = new Request("https://worker.example.com/api/factor-model", {
      method: "POST",
      body: "not-json",
      headers: { "Content-Type": "application/json" },
    });
    const res = await handleFactorModel(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect((body as { error: string }).error).toMatch(/json/i);
  });

  it("returns 400 when excessReturns is missing", async () => {
    const { excessReturns: _omit, ...rest } = validBody;
    const res = await handleFactorModel(makeRequest(rest));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect((body as { error: string }).error).toMatch(/excessReturns/);
  });

  it("returns 400 when marketExcess is missing", async () => {
    const { marketExcess: _omit, ...rest } = validBody;
    const res = await handleFactorModel(makeRequest(rest));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect((body as { error: string }).error).toMatch(/marketExcess/);
  });

  it("returns 400 when smb is missing", async () => {
    const { smb: _omit, ...rest } = validBody;
    const res = await handleFactorModel(makeRequest(rest));
    expect(res.status).toBe(400);
  });

  it("returns 400 when hml is missing", async () => {
    const { hml: _omit, ...rest } = validBody;
    const res = await handleFactorModel(makeRequest(rest));
    expect(res.status).toBe(400);
  });

  it("returns 400 when series is too short", async () => {
    const res = await handleFactorModel(makeRequest({ ...validBody, excessReturns: [0.01, 0.02] }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect((body as { error: string }).error).toMatch(/excessReturns/);
  });

  it("returns 400 when series contains NaN", async () => {
    const badSeries = [...excessReturns];
    badSeries[5] = NaN;
    const res = await handleFactorModel(makeRequest({ ...validBody, excessReturns: badSeries }));
    expect(res.status).toBe(400);
  });

  it("returns 200 with valid input", async () => {
    const res = await handleFactorModel(makeRequest(validBody));
    expect(res.status).toBe(200);
  });

  it("response includes exposures and contributions", async () => {
    const res = await handleFactorModel(makeRequest(validBody));
    const body = await res.json();
    const data = body as {
      exposures: {
        alpha: number;
        betaMarket: number;
        betaSMB: number;
        betaHML: number;
        rSquared: number;
        residualVol: number;
      };
      contributions: {
        market: number;
        smb: number;
        hml: number;
        alpha: number;
        total: number;
      };
      seriesLength: number;
    };

    expect(typeof data.exposures.alpha).toBe("number");
    expect(typeof data.exposures.betaMarket).toBe("number");
    expect(typeof data.exposures.betaSMB).toBe("number");
    expect(typeof data.exposures.betaHML).toBe("number");
    expect(data.exposures.rSquared).toBeGreaterThanOrEqual(0);
    expect(data.exposures.rSquared).toBeLessThanOrEqual(1);
    expect(typeof data.contributions.total).toBe("number");
    expect(data.seriesLength).toBe(n);
  });

  it("contributions sum approximately equals total", async () => {
    const res = await handleFactorModel(makeRequest(validBody));
    const { contributions } = (await res.json()) as {
      contributions: { market: number; smb: number; hml: number; alpha: number; total: number };
    };
    const sum = contributions.market + contributions.smb + contributions.hml + contributions.alpha;
    expect(Math.abs(sum - contributions.total)).toBeLessThan(1e-10);
  });

  it("returns deterministic results for same input", async () => {
    const res1 = await handleFactorModel(makeRequest(validBody));
    const res2 = await handleFactorModel(makeRequest(validBody));
    const b1 = (await res1.json()) as { exposures: { betaMarket: number } };
    const b2 = (await res2.json()) as { exposures: { betaMarket: number } };
    expect(b1.exposures.betaMarket).toBe(b2.exposures.betaMarket);
  });
});
