/**
 * Company name enrichment helpers (G19).
 *
 * Finance data providers return noisy, inconsistent company names:
 *
 *   - "Apple Inc." vs "Apple, Inc." vs "APPLE INC"
 *   - "iShares Core S&P 500 ETF" vs "ISHARES CORE S&P 500 ETF"
 *   - "Alphabet Inc. Class A" (long-form with share class)
 *
 * This module provides pure, deterministic helpers to:
 *
 *   - `extractShortName(rawName, ticker)` — strip legal suffixes, share-class
 *     qualifiers, and excessive whitespace to produce a compact display name.
 *   - `formatDisplayName(ticker, name?)` — combine ticker + optional name
 *     in a consistent `"AAPL · Apple"` format.
 *   - `enrichWatchlistEntry(entry, rawName)` — return an updated
 *     `WatchlistEntry` with a normalised `name` field.
 *   - `buildNameMap(entries)` — build a `Map<ticker, shortName>` from an
 *     array of entries for O(1) lookup.
 *   - `normaliseCompanyName(raw)` — title-case + strip trailing punctuation.
 *
 * All functions are pure and side-effect free.
 *
 * @module domain/name-enrichment
 */

import type { WatchlistEntry } from "../types/domain";

// ─── constants ────────────────────────────────────────────────────────────────

/**
 * Legal-entity suffixes and qualifiers to strip from company names.
 * Ordered from longest to shortest to avoid partial matches.
 */
const LEGAL_SUFFIXES = [
  "Incorporated",
  "Corporation",
  "Holdings",
  "Holding",
  "Limited",
  "International",
  "Group",
  "Trust",
  "Fund",
  "Inc.",
  "Inc",
  "Corp.",
  "Corp",
  "Ltd.",
  "Ltd",
  "Co.",
  "Co",
  "PLC",
  "plc",
  "N.V.",
  "NV",
  "AG",
  "SA",
  "S.A.",
  "LP",
  "L.P.",
] as const;

/**
 * Share-class and instrument qualifiers appended by data providers.
 * E.g. "Alphabet Inc. Class A" → strip "Class A".
 */
const SHARE_CLASS_PATTERNS = [/\bClass\s+[A-Z]\b/g, /\bSeries\s+[A-Z]\b/g, /\b[A-Z]+\s+Shares?\b/g];

// ─── helpers ──────────────────────────────────────────────────────────────────

/**
 * Title-case a string: each word starts with an uppercase letter, the rest
 * lowercase.  Preserves known all-caps acronyms of ≤ 4 characters (ETF, S&P).
 */
export function normaliseCompanyName(raw: string): string {
  return raw
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[.,;:!?]+$/, "") // strip trailing punctuation
    .split(" ")
    .map((word) => {
      // Preserve short acronyms (≤4 chars) and tokens containing & / digits
      if (word.length <= 4 && /^[A-Z&\d]+$/.test(word)) return word;
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");
}

/**
 * Extract a compact short name from a raw provider name.
 *
 * Steps:
 * 1. Normalise whitespace.
 * 2. Strip share-class patterns.
 * 3. Strip legal suffixes (comma-preceded or standalone).
 * 4. Title-case.
 * 5. Fall back to `ticker` when the result is empty.
 *
 * @param rawName  Raw company name from a data provider.
 * @param ticker   Ticker symbol used as a fallback.
 */
export function extractShortName(rawName: string, ticker: string): string {
  let name = rawName.trim().replace(/\s+/g, " ");

  // Remove share-class qualifiers
  for (const pattern of SHARE_CLASS_PATTERNS) {
    name = name.replace(pattern, "");
  }

  // Remove legal suffixes (optionally preceded by a comma)
  for (const suffix of LEGAL_SUFFIXES) {
    // Match `, Suffix` or ` Suffix` at end of string
    const re = new RegExp(`(?:^|,?)\\s*${suffix.replace(/\./g, "\\.")}\\.?\\s*$`, "i");
    name = name.replace(re, "");
  }

  name = normaliseCompanyName(name);
  return name.length > 0 ? name : ticker.toUpperCase();
}

// ─── display formatting ───────────────────────────────────────────────────────

/**
 * Format a ticker and optional short name into a compact display string.
 *
 * Examples:
 * - `formatDisplayName("AAPL", "Apple")` → `"AAPL · Apple"`
 * - `formatDisplayName("AAPL")` → `"AAPL"`
 *
 * @param ticker   Uppercase ticker symbol.
 * @param name     Optional short company name.
 */
export function formatDisplayName(ticker: string, name?: string): string {
  if (!name || name.trim() === "" || name.trim() === ticker) {
    return ticker.toUpperCase();
  }
  return `${ticker.toUpperCase()} · ${name}`;
}

// ─── WatchlistEntry enrichment ────────────────────────────────────────────────

/**
 * Return an updated `WatchlistEntry` with a normalised `name` field.
 *
 * @param entry    Existing watchlist entry (immutable input).
 * @param rawName  Raw provider name to enrich with.
 */
export function enrichWatchlistEntry(entry: WatchlistEntry, rawName: string): WatchlistEntry {
  const shortName = extractShortName(rawName, entry.ticker);
  return { ...entry, name: shortName };
}

// ─── bulk helpers ─────────────────────────────────────────────────────────────

/**
 * Build a `Map<ticker, shortName>` from a list of `WatchlistEntry` objects
 * for O(1) display-name lookup.
 *
 * Entries without a `name` are mapped to their ticker symbol.
 */
export function buildNameMap(entries: readonly WatchlistEntry[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const entry of entries) {
    map.set(entry.ticker.toUpperCase(), entry.name ?? entry.ticker.toUpperCase());
  }
  return map;
}
