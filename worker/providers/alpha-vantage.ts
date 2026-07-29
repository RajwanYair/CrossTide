/** Alpha Vantage Worker provider used as a rate-limited last-resort fallback. */

const ALPHA_VANTAGE_BASE = "https://www.alphavantage.co/query";

export class AlphaVantageApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "AlphaVantageApiError";
    this.status = status;
  }
}

interface AlphaVantageEnvelope {
  readonly Note?: string;
  readonly Information?: string;
  readonly "Error Message"?: string;
  readonly "Global Quote"?: Readonly<Record<string, string>>;
  readonly "Time Series (Daily)"?: Readonly<Record<string, Readonly<Record<string, string>>>>;
}

export interface AlphaVantageQuoteResult {
  readonly ticker: string;
  readonly price: number;
  readonly open: number;
  readonly high: number;
  readonly low: number;
  readonly previousClose: number;
  readonly volume: number;
  readonly timestamp: number;
}

export interface AlphaVantageCandle {
  readonly date: string;
  readonly open: number;
  readonly high: number;
  readonly low: number;
  readonly close: number;
  readonly volume: number;
}

function parseNumber(value: string | undefined, field: string): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new AlphaVantageApiError(`Alpha Vantage returned invalid ${field}`, 502);
  }
  return parsed;
}

function validateEnvelope(data: AlphaVantageEnvelope): void {
  const message = data.Note ?? data.Information ?? data["Error Message"];
  if (message) throw new AlphaVantageApiError(message, data["Error Message"] ? 404 : 429);
}

async function fetchAlphaVantage(
  params: Readonly<Record<string, string>>,
  apiKey: string,
): Promise<AlphaVantageEnvelope> {
  const search = new URLSearchParams({ ...params, apikey: apiKey });
  const response = await fetch(`${ALPHA_VANTAGE_BASE}?${search.toString()}`, {
    headers: { "User-Agent": "CrossTide/1.0" },
  });
  if (!response.ok) {
    throw new AlphaVantageApiError(
      `Alpha Vantage API returned ${response.status}`,
      response.status,
    );
  }
  const data = (await response.json()) as AlphaVantageEnvelope;
  validateEnvelope(data);
  return data;
}

export async function fetchAlphaVantageQuote(
  symbol: string,
  apiKey: string,
): Promise<AlphaVantageQuoteResult> {
  const data = await fetchAlphaVantage({ function: "GLOBAL_QUOTE", symbol }, apiKey);
  const quote = data["Global Quote"];
  if (!quote || Object.keys(quote).length === 0) {
    throw new AlphaVantageApiError("No Alpha Vantage quote available", 404);
  }
  return {
    ticker: quote["01. symbol"] ?? symbol.toUpperCase(),
    price: parseNumber(quote["05. price"], "price"),
    open: parseNumber(quote["02. open"], "open"),
    high: parseNumber(quote["03. high"], "high"),
    low: parseNumber(quote["04. low"], "low"),
    previousClose: parseNumber(quote["08. previous close"], "previous close"),
    volume: parseNumber(quote["06. volume"], "volume"),
    timestamp: Date.now(),
  };
}

export async function fetchAlphaVantageHistory(
  symbol: string,
  days: number,
  apiKey: string,
): Promise<readonly AlphaVantageCandle[]> {
  const data = await fetchAlphaVantage(
    {
      function: "TIME_SERIES_DAILY",
      symbol,
      outputsize: days > 100 ? "full" : "compact",
    },
    apiKey,
  );
  const series = data["Time Series (Daily)"];
  if (!series) throw new AlphaVantageApiError("No Alpha Vantage history available", 404);

  return Object.entries(series)
    .map(([date, values]) => ({
      date,
      open: parseNumber(values["1. open"], "open"),
      high: parseNumber(values["2. high"], "high"),
      low: parseNumber(values["3. low"], "low"),
      close: parseNumber(values["4. close"], "close"),
      volume: parseNumber(values["5. volume"], "volume"),
    }))
    .sort((left, right) => left.date.localeCompare(right.date))
    .slice(-days);
}
