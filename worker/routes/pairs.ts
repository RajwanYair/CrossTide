/**
 * POST /api/pairs
 *
 * Pairs trading analysis — computes spread, z-score series, hedge ratio and
 * entry/exit signals for two cointegrated price series.
 *
 * Request body (JSON):
 *   {
 *     seriesY:    number[],   // price series for asset Y (required, ≥10 values)
 *     seriesX:    number[],   // price series for asset X (required, ≥10 values)
 *     entryZ?:    number,     // z-score to enter trade (default 2.0)
 *     exitZ?:     number,     // z-score to close trade (default 0.5)
 *     stopZ?:     number,     // stop-loss z-score (default 3.5)
 *     lookback?:  number      // rolling window for z-score (default: full series)
 *   }
 */

import { pairsSignals } from "../../src/domain/pairs-trading.js";

const MIN_SERIES_LENGTH = 10;
const MAX_SERIES_LENGTH = 10_000;

export interface PairsRequest {
  readonly seriesY: number[];
  readonly seriesX: number[];
  readonly entryZ?: number;
  readonly exitZ?: number;
  readonly stopZ?: number;
  readonly lookback?: number;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function isNumberArray(v: unknown): v is number[] {
  return Array.isArray(v) && v.every((x) => typeof x === "number" && isFinite(x));
}

export async function handlePairs(request: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  if (typeof body !== "object" || body === null) {
    return json({ error: "Request body must be a JSON object" }, 400);
  }

  const { seriesY, seriesX, entryZ, exitZ, stopZ, lookback } = body as Record<string, unknown>;

  if (!isNumberArray(seriesY) || seriesY.length < MIN_SERIES_LENGTH) {
    return json(
      { error: `seriesY must be an array of at least ${MIN_SERIES_LENGTH} finite numbers` },
      400,
    );
  }

  if (!isNumberArray(seriesX) || seriesX.length < MIN_SERIES_LENGTH) {
    return json(
      { error: `seriesX must be an array of at least ${MIN_SERIES_LENGTH} finite numbers` },
      400,
    );
  }

  if (seriesY.length > MAX_SERIES_LENGTH || seriesX.length > MAX_SERIES_LENGTH) {
    return json({ error: `Series length must not exceed ${MAX_SERIES_LENGTH}` }, 400);
  }

  if (entryZ !== undefined && (typeof entryZ !== "number" || entryZ <= 0)) {
    return json({ error: "entryZ must be a positive number" }, 400);
  }

  if (exitZ !== undefined && (typeof exitZ !== "number" || exitZ < 0)) {
    return json({ error: "exitZ must be a non-negative number" }, 400);
  }

  if (stopZ !== undefined && (typeof stopZ !== "number" || stopZ <= 0)) {
    return json({ error: "stopZ must be a positive number" }, 400);
  }

  if (
    lookback !== undefined &&
    (typeof lookback !== "number" || !Number.isInteger(lookback) || lookback < 2)
  ) {
    return json({ error: "lookback must be an integer >= 2" }, 400);
  }

  const result = pairsSignals(seriesY, seriesX, {
    entryZ: typeof entryZ === "number" ? entryZ : undefined,
    exitZ: typeof exitZ === "number" ? exitZ : undefined,
    stopZ: typeof stopZ === "number" ? stopZ : undefined,
    lookback: typeof lookback === "number" ? lookback : undefined,
  });

  return json({
    hedgeRatio: result.hedgeRatio,
    meanSpread: result.meanSpread,
    spreadStd: result.spreadStd,
    spread: result.spread,
    zScore: result.zScore,
    signals: result.signals,
    signalCount: result.signals.length,
  });
}
