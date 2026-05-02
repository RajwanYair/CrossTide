/**
 * News digest domain helpers (I11).
 *
 * Parse RSS/Atom feeds, extract ticker mentions, group articles by ticker,
 * and perform lightweight keyword-based sentiment scoring.  Designed for
 * the "News" card in the dashboard.
 *
 * Exports:
 *   - `parseRssFeed(xml)` — parse RSS 2.0 XML into FeedItem[]
 *   - `parseAtomFeed(xml)` — parse Atom 1.0 XML into FeedItem[]
 *   - `detectFormat(xml)` — "rss" | "atom" | "unknown"
 *   - `parseFeed(xml)` — auto-detect and parse
 *   - `extractTickers(text)` — find $TICKER mentions
 *   - `groupByTicker(items)` — Map<ticker, FeedItem[]>
 *   - `scoreSentiment(text)` — numeric sentiment score
 *   - `classifySentiment(score)` — "bullish" | "bearish" | "neutral"
 *   - `deduplicateItems(items)` — remove duplicate articles
 *   - `sortByDate(items)` — newest first
 *   - `summariseDigest(items)` — aggregate stats
 */

// ── Types ─────────────────────────────────────────────────────────────────

export interface FeedItem {
  id: string;
  title: string;
  link: string;
  pubDate: number; // epoch ms
  source: string;
  summary: string;
  tickers: string[];
}

export type FeedFormat = "rss" | "atom" | "unknown";
export type SentimentLabel = "bullish" | "bearish" | "neutral";

export interface DigestSummary {
  totalItems: number;
  uniqueTickers: number;
  avgSentiment: number;
  label: SentimentLabel;
  topTickers: string[];
}

// ── Feed parsing ──────────────────────────────────────────────────────────

/** Detect whether an XML string is RSS 2.0, Atom, or unknown. */
export function detectFormat(xml: string): FeedFormat {
  const trimmed = xml.trimStart();
  if (/<rss[\s>]/i.test(trimmed)) return "rss";
  if (/<feed[\s>]/i.test(trimmed)) return "atom";
  return "unknown";
}

/** Parse RSS 2.0 XML into FeedItem[]. Uses regex for zero-dep parsing. */
export function parseRssFeed(xml: string): FeedItem[] {
  const items: FeedItem[] = [];
  const itemRe = /<item>([\s\S]*?)<\/item>/gi;
  const channelTitle = extractTag(xml, "title") ?? "";
  let match: RegExpExecArray | null;

  while ((match = itemRe.exec(xml)) !== null) {
    const block = match[1];
    const title = extractTag(block, "title") ?? "";
    const link = extractTag(block, "link") ?? "";
    const pubDate = extractTag(block, "pubDate") ?? "";
    const description = extractTag(block, "description") ?? "";
    const guid = extractTag(block, "guid") ?? (link || crypto.randomUUID());

    items.push({
      id: guid,
      title: decodeEntities(title),
      link: decodeEntities(link),
      pubDate: parsePubDate(pubDate),
      source: decodeEntities(channelTitle),
      summary: decodeEntities(stripHtml(description)).slice(0, 500),
      tickers: extractTickers(title + " " + description),
    });
  }
  return items;
}

/** Parse Atom 1.0 XML into FeedItem[]. */
export function parseAtomFeed(xml: string): FeedItem[] {
  const items: FeedItem[] = [];
  const entryRe = /<entry>([\s\S]*?)<\/entry>/gi;
  const feedTitle = extractTag(xml, "title") ?? "";
  let match: RegExpExecArray | null;

  while ((match = entryRe.exec(xml)) !== null) {
    const block = match[1];
    const title = extractTag(block, "title") ?? "";
    const link = extractAtomLink(block);
    const updated = extractTag(block, "updated") ?? extractTag(block, "published") ?? "";
    const summary = extractTag(block, "summary") ?? extractTag(block, "content") ?? "";
    const id = extractTag(block, "id") ?? (link || crypto.randomUUID());

    items.push({
      id: decodeEntities(id),
      title: decodeEntities(title),
      link: decodeEntities(link),
      pubDate: parsePubDate(updated),
      source: decodeEntities(feedTitle),
      summary: decodeEntities(stripHtml(summary)).slice(0, 500),
      tickers: extractTickers(title + " " + summary),
    });
  }
  return items;
}

/** Auto-detect format and parse. */
export function parseFeed(xml: string): FeedItem[] {
  const fmt = detectFormat(xml);
  if (fmt === "rss") return parseRssFeed(xml);
  if (fmt === "atom") return parseAtomFeed(xml);
  return [];
}

// ── Ticker extraction ─────────────────────────────────────────────────────

const TICKER_RE = /\$([A-Z]{1,5})\b/g;

/** Extract $TICKER cashtag mentions from text. Returns unique sorted list. */
export function extractTickers(text: string): string[] {
  const tickers = new Set<string>();
  let m: RegExpExecArray | null;
  const re = new RegExp(TICKER_RE.source, TICKER_RE.flags);
  while ((m = re.exec(text)) !== null) {
    tickers.add(m[1]);
  }
  return [...tickers].sort();
}

/** Group feed items by ticker mention. Items with no tickers are skipped. */
export function groupByTicker(items: FeedItem[]): Map<string, FeedItem[]> {
  const map = new Map<string, FeedItem[]>();
  for (const item of items) {
    for (const t of item.tickers) {
      const list = map.get(t);
      if (list) list.push(item);
      else map.set(t, [item]);
    }
  }
  return map;
}

// ── Sentiment scoring ─────────────────────────────────────────────────────

const BULLISH_WORDS = new Set([
  "surge",
  "surges",
  "surging",
  "rally",
  "rallies",
  "bullish",
  "gain",
  "gains",
  "soar",
  "soars",
  "jump",
  "jumps",
  "upgrade",
  "upgraded",
  "beat",
  "beats",
  "outperform",
  "record",
  "high",
  "growth",
  "strong",
  "boom",
  "positive",
  "optimistic",
  "buy",
  "breakout",
  "upside",
]);

const BEARISH_WORDS = new Set([
  "crash",
  "crashes",
  "plunge",
  "plunges",
  "bearish",
  "loss",
  "losses",
  "drop",
  "drops",
  "decline",
  "declines",
  "downgrade",
  "downgraded",
  "miss",
  "misses",
  "underperform",
  "low",
  "weak",
  "recession",
  "negative",
  "pessimistic",
  "sell",
  "breakdown",
  "downside",
  "slump",
  "tumble",
]);

/**
 * Score the sentiment of a text snippet.
 * Returns a value in [-1, 1] where positive = bullish, negative = bearish.
 */
export function scoreSentiment(text: string): number {
  const words = text
    .toLowerCase()
    .split(/[^a-z]+/)
    .filter(Boolean);
  if (words.length === 0) return 0;

  let bull = 0;
  let bear = 0;
  for (const w of words) {
    if (BULLISH_WORDS.has(w)) bull++;
    if (BEARISH_WORDS.has(w)) bear++;
  }
  const total = bull + bear;
  if (total === 0) return 0;
  return (bull - bear) / total;
}

/** Classify a sentiment score into a label. */
export function classifySentiment(score: number): SentimentLabel {
  if (score > 0.2) return "bullish";
  if (score < -0.2) return "bearish";
  return "neutral";
}

// ── Utilities ─────────────────────────────────────────────────────────────

/** Remove duplicate items by id. Keeps the first occurrence. */
export function deduplicateItems(items: FeedItem[]): FeedItem[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

/** Sort items by pubDate descending (newest first). */
export function sortByDate(items: FeedItem[]): FeedItem[] {
  return [...items].sort((a, b) => b.pubDate - a.pubDate);
}

/** Aggregate stats from a list of feed items. */
export function summariseDigest(items: FeedItem[]): DigestSummary {
  const allTickers = new Map<string, number>();
  let sentimentSum = 0;

  for (const item of items) {
    sentimentSum += scoreSentiment(item.title + " " + item.summary);
    for (const t of item.tickers) {
      allTickers.set(t, (allTickers.get(t) ?? 0) + 1);
    }
  }

  const avgSentiment = items.length > 0 ? sentimentSum / items.length : 0;
  const topTickers = [...allTickers.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([ticker]) => ticker);

  return {
    totalItems: items.length,
    uniqueTickers: allTickers.size,
    avgSentiment: Math.round(avgSentiment * 100) / 100,
    label: classifySentiment(avgSentiment),
    topTickers,
  };
}

// ── Internal helpers ──────────────────────────────────────────────────────

function extractTag(xml: string, tag: string): string | undefined {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i");
  const m = re.exec(xml);
  return m ? m[1].trim() : undefined;
}

function extractAtomLink(block: string): string {
  const m = /<link[^>]+href=["']([^"']+)["']/i.exec(block);
  return m ? m[1] : "";
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function decodeEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
}

function parsePubDate(dateStr: string): number {
  if (!dateStr) return 0;
  const ms = Date.parse(dateStr);
  return Number.isNaN(ms) ? 0 : ms;
}
