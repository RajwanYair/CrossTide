/**
 * Worker API client — typed HTTP client for CrossTide's Cloudflare Worker endpoints.
 *
 * Usage:
 *   const api = createApiClient("https://worker.crosstide.pages.dev");
 *   const result = await api.health();
 *   const candles = await api.chart({ ticker: "AAPL", range: "1y", interval: "1d" });
 *
 * All methods return `Result<T>` — they never throw.
 * Pass a custom `fetchFn` for testing.
 */

import type { Result } from "./result";
import { ok, err } from "./result";

// ---------------------------------------------------------------------------
// Endpoint request / response shapes
// ---------------------------------------------------------------------------

export interface HealthResponse {
  status: "ok";
  version: string;
  timestamp: string;
}

export interface ChartParams {
  ticker: string;
  range?: "1d" | "5d" | "1mo" | "3mo" | "6mo" | "1y" | "2y" | "5y" | "max";
  interval?: "1m" | "5m" | "15m" | "1h" | "1d" | "1wk" | "1mo";
}

export interface CandleRecord {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface ChartResponse {
  ticker: string;
  currency: string;
  candles: CandleRecord[];
}

export interface SearchParams {
  q: string;
  limit?: number;
}

export interface SearchHit {
  ticker: string;
  name: string;
  exchange: string;
  type: string;
}

export interface SearchResponse {
  results: SearchHit[];
}

export interface ScreenerParams {
  minRsi?: number;
  maxRsi?: number;
  minAdx?: number;
  consensus?: "BUY" | "SELL" | "NEUTRAL";
  tickers: string[];
}

export interface ScreenerRow {
  ticker: string;
  consensus: string;
  rsi: number;
  adx: number;
}

export interface ScreenerResponse {
  rows: ScreenerRow[];
}

// ---------------------------------------------------------------------------
// Client interface
// ---------------------------------------------------------------------------

export interface WorkerApiClient {
  /** GET /api/health */
  health(): Promise<Result<HealthResponse>>;

  /** GET /api/chart?ticker=&range=&interval= */
  chart(params: ChartParams): Promise<Result<ChartResponse>>;

  /** GET /api/search?q=&limit= */
  search(params: SearchParams): Promise<Result<SearchResponse>>;

  /** POST /api/screener */
  screener(params: ScreenerParams): Promise<Result<ScreenerResponse>>;
}

// ---------------------------------------------------------------------------
// HTTP helpers
// ---------------------------------------------------------------------------

type FetchFn = typeof fetch;

function buildUrl(base: string, path: string, query?: Record<string, string>): string {
  const url = new URL(path, base.endsWith("/") ? base : base + "/");
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      url.searchParams.set(k, v);
    }
  }
  return url.toString();
}

async function getJson<T>(
  fetchFn: FetchFn,
  url: string,
  signal?: AbortSignal,
): Promise<Result<T>> {
  try {
    const res = await fetchFn(url, { signal: signal ?? null });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return err(new Error(`HTTP ${res.status}: ${body || res.statusText}`));
    }
    const data = (await res.json()) as T;
    return ok(data);
  } catch (e) {
    return err(e instanceof Error ? e : new Error(String(e)));
  }
}

async function postJson<T>(
  fetchFn: FetchFn,
  url: string,
  body: unknown,
  signal?: AbortSignal,
): Promise<Result<T>> {
  try {
    const res = await fetchFn(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: signal ?? null,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return err(new Error(`HTTP ${res.status}: ${text || res.statusText}`));
    }
    const data = (await res.json()) as T;
    return ok(data);
  } catch (e) {
    return err(e instanceof Error ? e : new Error(String(e)));
  }
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/**
 * Create a typed client bound to `baseUrl`.
 *
 * @param baseUrl - Root URL of the Cloudflare Worker (e.g. "https://api.crosstide.dev")
 * @param options.fetchFn - Override the global `fetch` (useful in tests)
 * @param options.signal - Default AbortSignal applied to every request
 */
export function createApiClient(
  baseUrl: string,
  options: { fetchFn?: FetchFn; signal?: AbortSignal } = {},
): WorkerApiClient {
  const fetchFn = options.fetchFn ?? fetch;
  const signal = options.signal;

  return {
    async health(): Promise<Result<HealthResponse>> {
      const url = buildUrl(baseUrl, "api/health");
      return getJson<HealthResponse>(fetchFn, url, signal);
    },

    async chart(params): Promise<Result<ChartResponse>> {
      const query: Record<string, string> = { ticker: params.ticker };
      if (params.range) query["range"] = params.range;
      if (params.interval) query["interval"] = params.interval;
      const url = buildUrl(baseUrl, "api/chart", query);
      return getJson<ChartResponse>(fetchFn, url, signal);
    },

    async search(params): Promise<Result<SearchResponse>> {
      const query: Record<string, string> = { q: params.q };
      if (params.limit !== undefined) query["limit"] = String(params.limit);
      const url = buildUrl(baseUrl, "api/search", query);
      return getJson<SearchResponse>(fetchFn, url, signal);
    },

    async screener(params): Promise<Result<ScreenerResponse>> {
      const url = buildUrl(baseUrl, "api/screener");
      return postJson<ScreenerResponse>(fetchFn, url, params, signal);
    },
  };
}

// ---------------------------------------------------------------------------
// Singleton for production use
// ---------------------------------------------------------------------------

const WORKER_BASE_URL =
  typeof __WORKER_BASE_URL__ !== "undefined"
    ? __WORKER_BASE_URL__
    : "https://worker.crosstide.pages.dev";

let _client: WorkerApiClient | null = null;

/** Get (or lazily create) the default singleton API client. */
export function getApiClient(): WorkerApiClient {
  _client ??= createApiClient(WORKER_BASE_URL);
  return _client;
}

/** Reset the singleton (for tests / hot reload). */
export function _resetApiClientForTests(): void {
  _client = null;
}

// Declare the Vite define so TypeScript knows it exists
declare const __WORKER_BASE_URL__: string | undefined;
