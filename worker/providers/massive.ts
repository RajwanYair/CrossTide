/** Massive (formerly Polygon.io) Worker provider for US equity EOD data. */

const MASSIVE_BASE = "https://api.massive.com";

export class MassiveApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "MassiveApiError";
    this.status = status;
  }
}

interface MassiveBar {
  readonly c?: number;
  readonly h?: number;
  readonly l?: number;
  readonly o?: number;
  readonly t?: number;
  readonly v?: number;
}

interface MassiveAggResponse {
  readonly status?: string;
  readonly error?: string;
  readonly results?: readonly MassiveBar[];
}

export interface MassiveQuoteResult {
  readonly ticker: string;
  readonly price: number;
  readonly open: number;
  readonly high: number;
  readonly low: number;
  readonly previousClose: number;
  readonly volume: number;
  readonly timestamp: number;
}

export interface MassiveCandle {
  readonly date: string;
  readonly open: number;
  readonly high: number;
  readonly low: number;
  readonly close: number;
  readonly volume: number;
}

function parseBar(bar: MassiveBar, context: string): Required<MassiveBar> {
  const values = [bar.o, bar.h, bar.l, bar.c, bar.v, bar.t];
  if (values.some((value) => typeof value !== "number" || !Number.isFinite(value))) {
    throw new MassiveApiError(`Massive returned an invalid ${context} bar`, 502);
  }
  return bar as Required<MassiveBar>;
}

async function fetchAggregates(path: string, apiKey: string): Promise<readonly MassiveBar[]> {
  const separator = path.includes("?") ? "&" : "?";
  const response = await fetch(
    `${MASSIVE_BASE}${path}${separator}apiKey=${encodeURIComponent(apiKey)}`,
    {
      headers: { "User-Agent": "CrossTide/1.0" },
    },
  );
  if (!response.ok) {
    throw new MassiveApiError(`Massive API returned ${response.status}`, response.status);
  }

  const data = (await response.json()) as MassiveAggResponse;
  if (data.status === "ERROR") {
    throw new MassiveApiError(data.error ?? "Massive API error", 502);
  }
  if (!data.results || data.results.length === 0) {
    throw new MassiveApiError("No Massive data available", 404);
  }
  return data.results;
}

export async function fetchMassiveQuote(
  symbol: string,
  apiKey: string,
): Promise<MassiveQuoteResult> {
  const bars = await fetchAggregates(
    `/v2/aggs/ticker/${encodeURIComponent(symbol)}/prev?adjusted=true`,
    apiKey,
  );
  const bar = parseBar(bars[0] ?? {}, "quote");
  return {
    ticker: symbol.toUpperCase(),
    price: bar.c,
    open: bar.o,
    high: bar.h,
    low: bar.l,
    previousClose: bar.c,
    volume: bar.v,
    timestamp: bar.t,
  };
}

export async function fetchMassiveHistory(
  symbol: string,
  days: number,
  apiKey: string,
): Promise<readonly MassiveCandle[]> {
  const toDate = new Date();
  const fromDate = new Date(toDate.getTime() - days * 24 * 60 * 60 * 1000);
  const from = fromDate.toISOString().slice(0, 10);
  const to = toDate.toISOString().slice(0, 10);
  const bars = await fetchAggregates(
    `/v2/aggs/ticker/${encodeURIComponent(symbol)}/range/1/day/${from}/${to}?adjusted=true&sort=asc&limit=${Math.min(days, 50000)}`,
    apiKey,
  );

  return bars.map((raw) => {
    const bar = parseBar(raw, "history");
    return {
      date: new Date(bar.t).toISOString().slice(0, 10),
      open: bar.o,
      high: bar.h,
      low: bar.l,
      close: bar.c,
      volume: bar.v,
    };
  });
}
