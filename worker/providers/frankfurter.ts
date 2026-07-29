/** Frankfurter v2 provider for no-key, central-bank reference exchange rates. */

const FRANKFURTER_BASE = "https://api.frankfurter.dev/v2";

export class FrankfurterApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "FrankfurterApiError";
    this.status = status;
  }
}

interface FrankfurterRateEnvelope {
  readonly date?: string;
  readonly base?: string;
  readonly quote?: string;
  readonly rate?: number;
  readonly message?: string;
}

export interface FrankfurterRateResult {
  readonly base: string;
  readonly quote: string;
  readonly rate: number;
  readonly date: string;
}

export async function fetchFrankfurterRate(
  base: string,
  quote: string,
): Promise<FrankfurterRateResult> {
  const response = await fetch(
    `${FRANKFURTER_BASE}/rate/${encodeURIComponent(base)}/${encodeURIComponent(quote)}`,
    { headers: { "User-Agent": "CrossTide/1.0" } },
  );
  if (!response.ok) {
    throw new FrankfurterApiError(`Frankfurter API returned ${response.status}`, response.status);
  }

  const data = (await response.json()) as FrankfurterRateEnvelope;
  if (
    typeof data.rate !== "number" ||
    !Number.isFinite(data.rate) ||
    data.rate <= 0 ||
    typeof data.date !== "string"
  ) {
    throw new FrankfurterApiError(data.message ?? "Invalid Frankfurter rate response", 502);
  }
  return {
    base: data.base ?? base,
    quote: data.quote ?? quote,
    rate: data.rate,
    date: data.date,
  };
}
