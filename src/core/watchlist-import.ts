/**
 * Watchlist bulk import — parse tickers from CSV text or clipboard paste.
 *
 * Accepts multiple formats:
 * - Comma-separated: "AAPL, MSFT, GOOG"
 * - Newline-separated: "AAPL\nMSFT\nGOOG"
 * - CSV with header: "Symbol,Name\nAAPL,Apple\nMSFT,Microsoft"
 * - Tab-separated: "AAPL\tApple Inc"
 * - Space-separated: "AAPL MSFT GOOG"
 *
 * Returns deduplicated, normalized ticker symbols.
 */

const TICKER_PATTERN = /^[\^A-Z][A-Z0-9.^=]{0,11}$/;
const COMMON_HEADERS = new Set([
  "symbol",
  "ticker",
  "code",
  "stock",
  "name",
  "company",
  "price",
  "change",
  "volume",
  "market",
  "sector",
  "industry",
  "exchange",
  "date",
  "open",
  "high",
  "low",
  "close",
]);

/**
 * Parse raw text input into an array of valid ticker symbols.
 * Filters out headers, duplicates, and invalid patterns.
 */
export function parseTickersFromText(raw: string): string[] {
  if (!raw.trim()) return [];

  // Split into rows first (newlines)
  const rows = raw.split(/[\n\r]+/).filter((r) => r.trim());

  const seen = new Set<string>();
  const result: string[] = [];

  for (const row of rows) {
    // Split row into cells (tabs, commas, semicolons, pipes)
    const cells = row.split(/[,\t;|]+/);

    // Take only the first cell per row as the ticker candidate
    const candidate = cells[0]?.trim().split(/\s+/)[0]?.toUpperCase().trim();
    if (!candidate) continue;

    // Skip common CSV headers
    if (COMMON_HEADERS.has(candidate.toLowerCase())) continue;

    // Validate ticker pattern (must start with letter)
    if (!TICKER_PATTERN.test(candidate)) continue;

    // Deduplicate
    if (seen.has(candidate)) continue;
    seen.add(candidate);
    result.push(candidate);
  }

  // If input was a single line with multiple tickers (no newlines), parse inline
  if (rows.length === 1 && result.length <= 1) {
    const cells = raw.split(/[,\t;|]+/);
    if (cells.length > 1) {
      seen.clear();
      result.length = 0;
      for (const cell of cells) {
        const word = cell.trim().split(/\s+/)[0]?.toUpperCase().trim();
        if (!word) continue;
        if (COMMON_HEADERS.has(word.toLowerCase())) continue;
        if (!TICKER_PATTERN.test(word)) continue;
        if (seen.has(word)) continue;
        seen.add(word);
        result.push(word);
      }
    }
  }

  return result;
}

/**
 * Read tickers from clipboard via Clipboard API.
 * Returns empty array if clipboard access is denied.
 */
export async function readTickersFromClipboard(): Promise<string[]> {
  try {
    const text = await navigator.clipboard.readText();
    return parseTickersFromText(text);
  } catch {
    return [];
  }
}
