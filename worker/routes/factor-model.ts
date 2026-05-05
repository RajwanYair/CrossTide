/**
 * POST /api/factor-model
 *
 * Fama-French 3-factor model — estimates factor exposures (alpha, market beta,
 * SMB, HML) and decomposes portfolio returns by factor contribution.
 *
 * Request body (JSON):
 *   {
 *     excessReturns:  number[],  // portfolio returns minus Rf (required, ≥10)
 *     marketExcess:   number[],  // market returns minus Rf  (required, ≥10)
 *     smb:            number[],  // Small-Minus-Big factor   (required, ≥10)
 *     hml:            number[],  // High-Minus-Low factor    (required, ≥10)
 *   }
 *
 * All series are aligned by index and trimmed to the shortest length.
 */

import { factorAttribution } from "../../src/domain/factor-model.js";

const MIN_SERIES_LENGTH = 10;
const MAX_SERIES_LENGTH = 10_000;

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function isFiniteNumberArray(v: unknown): v is number[] {
  return Array.isArray(v) && v.every((x) => typeof x === "number" && isFinite(x));
}

function validateSeries(v: unknown, name: string): Response | null {
  if (!isFiniteNumberArray(v) || v.length < MIN_SERIES_LENGTH) {
    return json(
      { error: `${name} must be an array of at least ${MIN_SERIES_LENGTH} finite numbers` },
      400,
    );
  }
  if (v.length > MAX_SERIES_LENGTH) {
    return json({ error: `${name} length must not exceed ${MAX_SERIES_LENGTH}` }, 400);
  }
  return null;
}

export async function handleFactorModel(request: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  if (typeof body !== "object" || body === null) {
    return json({ error: "Request body must be a JSON object" }, 400);
  }

  const { excessReturns, marketExcess, smb, hml } = body as Record<string, unknown>;

  const erErr = validateSeries(excessReturns, "excessReturns");
  if (erErr) return erErr;
  const mkErr = validateSeries(marketExcess, "marketExcess");
  if (mkErr) return mkErr;
  const smbErr = validateSeries(smb, "smb");
  if (smbErr) return smbErr;
  const hmlErr = validateSeries(hml, "hml");
  if (hmlErr) return hmlErr;

  const result = factorAttribution(
    excessReturns as number[],
    marketExcess as number[],
    smb as number[],
    hml as number[],
  );

  return json({
    exposures: result.exposures,
    contributions: {
      market: result.marketContribution,
      smb: result.smbContribution,
      hml: result.hmlContribution,
      alpha: result.alphaContribution,
      total: result.totalExplained,
    },
    seriesLength: Math.min(
      (excessReturns as number[]).length,
      (marketExcess as number[]).length,
      (smb as number[]).length,
      (hml as number[]).length,
    ),
  });
}
