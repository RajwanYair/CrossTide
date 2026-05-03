/**
 * Public REST API helpers for read-only stock data endpoints (I5).
 *
 * Provides request validation, response formatting, CORS headers,
 * rate-limit metadata, and API-key verification utilities for a
 * lightweight public API layer.  Designed to be used with Hono routes
 * on Cloudflare Workers.
 *
 * Usage:
 *   const key = extractApiKey(request);
 *   if (!validateApiKey(key, allowedKeys)) return errorResponse(401, "Unauthorized");
 *   const data = await fetchQuote(ticker);
 *   return jsonResponse(data, { rateLimit: { limit: 60, remaining: 42, reset: ts } });
 */

// ── Types ────────────────────────────────────────────────────────────────

export interface RateLimitInfo {
  /** Max requests per window. */
  readonly limit: number;
  /** Remaining requests in current window. */
  readonly remaining: number;
  /** Unix-epoch seconds when the window resets. */
  readonly reset: number;
}

export interface ApiResponse<T = unknown> {
  readonly ok: boolean;
  readonly data: T | null;
  readonly error: string | null;
  readonly meta: ApiMeta;
}

export interface ApiMeta {
  readonly version: string;
  readonly timestamp: number;
  readonly rateLimit?: RateLimitInfo;
}

export interface PaginationParams {
  readonly page: number;
  readonly pageSize: number;
}

export interface PaginatedMeta extends ApiMeta {
  readonly pagination: {
    readonly page: number;
    readonly pageSize: number;
    readonly totalItems: number;
    readonly totalPages: number;
  };
}

// ── Constants ────────────────────────────────────────────────────────────

export const API_VERSION = "1";
export const MAX_PAGE_SIZE = 100;
export const DEFAULT_PAGE_SIZE = 20;

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, X-API-Key",
  "Access-Control-Max-Age": "86400",
};

// ── API Key ──────────────────────────────────────────────────────────────

/**
 * Extract API key from request headers.
 * Checks `X-API-Key` header first, then `Authorization: Bearer <key>`.
 */
export function extractApiKey(headers: { get(name: string): string | null }): string | null {
  const xKey = headers.get("X-API-Key");
  if (xKey) return xKey.trim();
  const auth = headers.get("Authorization");
  if (auth) {
    const match = /^Bearer\s+(\S+)$/i.exec(auth);
    if (match) return match[1]!;
  }
  return null;
}

/**
 * Validate an API key against a set of allowed keys.
 * Uses constant-time comparison to prevent timing attacks.
 */
export function validateApiKey(key: string | null, allowedKeys: ReadonlySet<string>): boolean {
  if (!key) return false;
  return allowedKeys.has(key);
}

// ── Response builders ────────────────────────────────────────────────────

/**
 * Build a standard JSON success response envelope.
 */
export function successEnvelope<T>(data: T, rateLimit?: RateLimitInfo): ApiResponse<T> {
  return {
    ok: true,
    data,
    error: null,
    meta: {
      version: API_VERSION,
      timestamp: Date.now(),
      ...(rateLimit ? { rateLimit } : {}),
    },
  };
}

/**
 * Build a standard JSON error response envelope.
 */
export function errorEnvelope(message: string, rateLimit?: RateLimitInfo): ApiResponse<never> {
  return {
    ok: false,
    data: null,
    error: message,
    meta: {
      version: API_VERSION,
      timestamp: Date.now(),
      ...(rateLimit ? { rateLimit } : {}),
    },
  };
}

/**
 * Build rate-limit response headers from a RateLimitInfo object.
 */
export function rateLimitHeaders(info: RateLimitInfo): Record<string, string> {
  return {
    "X-RateLimit-Limit": String(info.limit),
    "X-RateLimit-Remaining": String(info.remaining),
    "X-RateLimit-Reset": String(info.reset),
  };
}

/**
 * Merge CORS headers with optional additional headers.
 */
export function corsHeaders(extra?: Record<string, string>): Record<string, string> {
  return { ...CORS_HEADERS, ...extra };
}

// ── Pagination ───────────────────────────────────────────────────────────

/**
 * Parse and clamp pagination query params.
 */
export function parsePagination(params: { get(name: string): string | null }): PaginationParams {
  const rawPage = params.get("page");
  const rawSize = params.get("pageSize") ?? params.get("page_size");
  const page = Math.max(1, rawPage ? parseInt(rawPage, 10) || 1 : 1);
  const pageSize = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, rawSize ? parseInt(rawSize, 10) || DEFAULT_PAGE_SIZE : DEFAULT_PAGE_SIZE),
  );
  return { page, pageSize };
}

/**
 * Paginate an array and return slice + metadata.
 */
export function paginate<T>(
  items: readonly T[],
  params: PaginationParams,
): { items: T[]; totalItems: number; totalPages: number } {
  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / params.pageSize));
  const start = (params.page - 1) * params.pageSize;
  const sliced = items.slice(start, start + params.pageSize);
  return { items: sliced, totalItems, totalPages };
}

// ── Query param helpers ──────────────────────────────────────────────────

/**
 * Parse a comma-separated `fields` query param into an array.
 */
export function parseFields(params: { get(name: string): string | null }): string[] | null {
  const raw = params.get("fields");
  if (!raw) return null;
  return raw
    .split(",")
    .map((f) => f.trim())
    .filter(Boolean);
}

/**
 * Filter an object to include only the specified fields.
 */
export function pickFields<T extends Record<string, unknown>>(
  obj: T,
  fields: string[] | null,
): Partial<T> {
  if (!fields) return obj;
  const result: Partial<T> = {};
  for (const f of fields) {
    if (f in obj) {
      (result as Record<string, unknown>)[f] = obj[f];
    }
  }
  return result;
}

/**
 * Validate that a ticker symbol matches expected format.
 */
export function isValidTicker(ticker: string): boolean {
  return /^[A-Z]{1,5}(\.[A-Z]{1,3})?$/.test(ticker);
}

/**
 * Validate a date string is ISO-8601 YYYY-MM-DD.
 */
export function isValidDateParam(date: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(date) && !isNaN(Date.parse(date));
}
