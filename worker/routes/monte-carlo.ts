/**
 * POST /api/monte-carlo
 *
 * Runs a Monte Carlo portfolio simulation using the domain's runSimulation engine.
 * Returns percentile bands and summary statistics — paths are sub-sampled to keep
 * the response small (max 5 representative paths for client visualization).
 *
 * Request body (JSON):
 *   {
 *     initialValue:  number,  // starting portfolio value (> 0)
 *     periods:       number,  // periods to simulate (1–1260, i.e. up to ~5y daily)
 *     simulations?:  number,  // paths to run (1–10000, default 1000)
 *     meanReturn:    number,  // per-period mean return as a decimal (e.g. 0.001)
 *     stdDev:        number,  // per-period std deviation (> 0)
 *     seed?:         number   // optional deterministic seed
 *   }
 */

import { runSimulation } from "../../src/domain/monte-carlo.js";

const MAX_SIMULATIONS = 10_000;
const MAX_PERIODS = 1_260; // ~5 years of daily periods
const SAMPLE_PATHS = 5;

export interface MonteCarloRequest {
  readonly initialValue: number;
  readonly periods: number;
  readonly simulations?: number;
  readonly meanReturn: number;
  readonly stdDev: number;
  readonly seed?: number;
}

export interface MonteCarloApiResponse {
  readonly params: {
    readonly initialValue: number;
    readonly periods: number;
    readonly simulations: number;
    readonly meanReturn: number;
    readonly stdDev: number;
  };
  readonly percentiles: {
    readonly p5: number;
    readonly p25: number;
    readonly p50: number;
    readonly p75: number;
    readonly p95: number;
  };
  readonly probabilityOfLoss: number;
  readonly expectedValue: number;
  readonly samplePaths: readonly number[][];
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function handleMonteCarlo(request: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  if (typeof body !== "object" || body === null) {
    return json({ error: "Request body must be a JSON object" }, 400);
  }

  const {
    initialValue,
    periods,
    simulations: rawSims,
    meanReturn,
    stdDev,
    seed,
  } = body as Record<string, unknown>;

  if (typeof initialValue !== "number" || initialValue <= 0) {
    return json({ error: "initialValue must be a positive number" }, 400);
  }

  if (
    typeof periods !== "number" ||
    !Number.isInteger(periods) ||
    periods < 1 ||
    periods > MAX_PERIODS
  ) {
    return json({ error: `periods must be an integer between 1 and ${MAX_PERIODS}` }, 400);
  }

  if (typeof meanReturn !== "number" || !isFinite(meanReturn)) {
    return json({ error: "meanReturn must be a finite number" }, 400);
  }

  if (typeof stdDev !== "number" || stdDev <= 0 || !isFinite(stdDev)) {
    return json({ error: "stdDev must be a positive finite number" }, 400);
  }

  const simulations =
    rawSims === undefined
      ? 1_000
      : typeof rawSims === "number" &&
          Number.isInteger(rawSims) &&
          rawSims >= 1 &&
          rawSims <= MAX_SIMULATIONS
        ? rawSims
        : null;

  if (simulations === null) {
    return json({ error: `simulations must be an integer between 1 and ${MAX_SIMULATIONS}` }, 400);
  }

  if (seed !== undefined && typeof seed !== "number") {
    return json({ error: "seed must be a number when provided" }, 400);
  }

  const result = runSimulation({
    initialValue,
    periods,
    simulations,
    meanReturn,
    stdDev,
    seed: typeof seed === "number" ? seed : undefined,
  });

  // Sub-sample paths so response stays small
  const step = Math.max(1, Math.floor(simulations / SAMPLE_PATHS));
  const samplePaths: number[][] = [];
  for (let i = 0; i < SAMPLE_PATHS; i++) {
    const path = result.paths[i * step];
    if (path) samplePaths.push([...path]);
  }

  const response: MonteCarloApiResponse = {
    params: { initialValue, periods, simulations, meanReturn, stdDev },
    percentiles: result.percentiles,
    probabilityOfLoss: result.probabilityOfLoss,
    expectedValue: result.expectedValue,
    samplePaths,
  };

  return json(response);
}
