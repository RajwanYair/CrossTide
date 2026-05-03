/**
 * Collaborative watchlist sharing via URL snapshots (I8).
 *
 * Allows users to share watchlist state as compact, URL-safe snapshots
 * with optional TTL expiry.  Watchlists are serialized to a minimal
 * JSON envelope, compressed with base64url, and embedded in shareable URLs.
 *
 * Usage:
 *   const snapshot = createWatchlistSnapshot("My List", ["AAPL","MSFT"], { notes: "Tech picks" });
 *   const url = encodeWatchlistUrl(snapshot, "https://crosstide.app");
 *   const decoded = decodeWatchlistUrl(url);
 */

import { base64UrlEncode, base64UrlDecode } from "../core/base64-url";

// ── Types ────────────────────────────────────────────────────────────────

export interface WatchlistSnapshot {
  /** Schema version. */
  readonly v: 1;
  /** Watchlist display name. */
  readonly name: string;
  /** Ordered ticker symbols. */
  readonly tickers: readonly string[];
  /** ISO-8601 creation timestamp. */
  readonly createdAt: string;
  /** Optional user-provided notes. */
  readonly notes?: string;
  /** Optional TTL in seconds from createdAt. Null = never expires. */
  readonly ttlSeconds?: number;
  /** Deterministic checksum for integrity. */
  readonly checksum: string;
}

export interface WatchlistImportResult {
  readonly ok: boolean;
  readonly snapshot?: WatchlistSnapshot;
  readonly error?: string;
  readonly expired?: boolean;
}

export interface MergeResult {
  /** Merged list of unique tickers preserving order. */
  readonly tickers: readonly string[];
  /** Tickers that were added (new). */
  readonly added: readonly string[];
  /** Tickers that were already present. */
  readonly duplicates: readonly string[];
}

// ── Constants ────────────────────────────────────────────────────────────

const URL_PARAM = "wl";
const MAX_TICKERS = 200;
const MAX_NAME_LENGTH = 100;
const MAX_NOTES_LENGTH = 500;

// ── Checksum ─────────────────────────────────────────────────────────────

/**
 * Simple DJB2 hash for integrity validation.
 */
function djb2(str: string): string {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) | 0;
  }
  return (hash >>> 0).toString(36);
}

function computeChecksum(name: string, tickers: readonly string[]): string {
  return djb2(`${name}|${tickers.join(",")}`);
}

// ── Validation ───────────────────────────────────────────────────────────

function validateTickers(tickers: readonly string[]): string | null {
  if (!Array.isArray(tickers)) return "tickers must be an array";
  if (tickers.length === 0) return "tickers must not be empty";
  if (tickers.length > MAX_TICKERS) return `tickers exceeds max of ${MAX_TICKERS}`;
  for (const t of tickers) {
    if (typeof t !== "string" || t.length === 0 || t.length > 10) {
      return `invalid ticker: "${String(t)}"`;
    }
  }
  return null;
}

function validateName(name: string): string | null {
  if (typeof name !== "string" || name.length === 0) return "name is required";
  if (name.length > MAX_NAME_LENGTH) return `name exceeds max of ${MAX_NAME_LENGTH} chars`;
  return null;
}

// ── Create / Encode / Decode ─────────────────────────────────────────────

/**
 * Create a watchlist snapshot from name and tickers.
 */
export function createWatchlistSnapshot(
  name: string,
  tickers: readonly string[],
  options?: { notes?: string; ttlSeconds?: number },
): WatchlistSnapshot {
  const nameErr = validateName(name);
  if (nameErr) throw new Error(nameErr);
  const tickerErr = validateTickers(tickers);
  if (tickerErr) throw new Error(tickerErr);

  let notes = options?.notes;
  if (notes && notes.length > MAX_NOTES_LENGTH) {
    notes = notes.slice(0, MAX_NOTES_LENGTH);
  }

  return {
    v: 1,
    name,
    tickers,
    createdAt: new Date().toISOString(),
    ...(notes ? { notes } : {}),
    ...(options?.ttlSeconds ? { ttlSeconds: options.ttlSeconds } : {}),
    checksum: computeChecksum(name, tickers),
  };
}

/**
 * Encode a watchlist snapshot into a shareable URL.
 */
export function encodeWatchlistUrl(snapshot: WatchlistSnapshot, baseUrl: string): string {
  const json = JSON.stringify(snapshot);
  const encoded = base64UrlEncode(json);
  const url = new URL(baseUrl);
  url.searchParams.set(URL_PARAM, encoded);
  return url.toString();
}

/**
 * Decode a watchlist snapshot from a URL.
 */
export function decodeWatchlistUrl(url: string, now?: Date): WatchlistImportResult {
  try {
    const parsed = new URL(url);
    const param = parsed.searchParams.get(URL_PARAM);
    if (!param) return { ok: false, error: "Missing watchlist parameter" };
    return decodeWatchlistPayload(param, now);
  } catch {
    return { ok: false, error: "Invalid URL" };
  }
}

/**
 * Decode a raw base64url watchlist payload string.
 */
export function decodeWatchlistPayload(encoded: string, now?: Date): WatchlistImportResult {
  try {
    const json = base64UrlDecode(encoded);
    const data = JSON.parse(json) as Record<string, unknown>;

    if (data.v !== 1) return { ok: false, error: "Unsupported version" };
    if (typeof data.name !== "string") return { ok: false, error: "Missing name" };
    if (!Array.isArray(data.tickers)) return { ok: false, error: "Missing tickers" };

    const snapshot = data as unknown as WatchlistSnapshot;

    // Validate checksum
    const expected = computeChecksum(snapshot.name, snapshot.tickers);
    if (snapshot.checksum !== expected) {
      return { ok: false, error: "Checksum mismatch" };
    }

    // Check expiry
    if (snapshot.ttlSeconds && snapshot.createdAt) {
      const created = new Date(snapshot.createdAt).getTime();
      const expiresAt = created + snapshot.ttlSeconds * 1000;
      const currentTime = (now ?? new Date()).getTime();
      if (currentTime > expiresAt) {
        return { ok: false, error: "Snapshot expired", expired: true };
      }
    }

    return { ok: true, snapshot };
  } catch {
    return { ok: false, error: "Failed to decode payload" };
  }
}

// ── Merge ────────────────────────────────────────────────────────────────

/**
 * Merge imported tickers into an existing watchlist, preserving order.
 */
export function mergeWatchlists(
  existing: readonly string[],
  incoming: readonly string[],
): MergeResult {
  const seen = new Set(existing);
  const added: string[] = [];
  const duplicates: string[] = [];

  for (const t of incoming) {
    if (seen.has(t)) {
      duplicates.push(t);
    } else {
      added.push(t);
      seen.add(t);
    }
  }

  return {
    tickers: [...existing, ...added],
    added,
    duplicates,
  };
}

/**
 * Compute a compact text summary of a snapshot for clipboard/display.
 */
export function snapshotToText(snapshot: WatchlistSnapshot): string {
  const lines = [`📋 ${snapshot.name}`, `Tickers: ${snapshot.tickers.join(", ")}`];
  if (snapshot.notes) lines.push(`Notes: ${snapshot.notes}`);
  lines.push(`Created: ${snapshot.createdAt}`);
  return lines.join("\n");
}
