/**
 * Unit tests for news digest domain helpers (I11).
 */
import { describe, it, expect } from "vitest";
import {
  detectFormat,
  parseRssFeed,
  parseAtomFeed,
  parseFeed,
  extractTickers,
  groupByTicker,
  scoreSentiment,
  classifySentiment,
  deduplicateItems,
  sortByDate,
  summariseDigest,
} from "../../../src/domain/news-digest";
import type { FeedItem } from "../../../src/domain/news-digest";

// ── helpers ──────────────────────────────────────────────────────────────

function mkItem(overrides: Partial<FeedItem> = {}): FeedItem {
  return {
    id: "item-1",
    title: "$AAPL surges on earnings beat",
    link: "https://example.com/1",
    pubDate: 1000,
    source: "Test Feed",
    summary: "Apple stock rallies after Q3 results.",
    tickers: ["AAPL"],
    ...overrides,
  };
}

const RSS_SAMPLE = `<?xml version="1.0"?>
<rss version="2.0">
<channel>
  <title>Market News</title>
  <item>
    <title>$AAPL surges on earnings</title>
    <link>https://example.com/1</link>
    <pubDate>Mon, 01 Jul 2025 08:00:00 GMT</pubDate>
    <description>Apple stock &amp; gains.</description>
    <guid>id-1</guid>
  </item>
  <item>
    <title>$MSFT drops after downgrade</title>
    <link>https://example.com/2</link>
    <pubDate>Mon, 01 Jul 2025 09:00:00 GMT</pubDate>
    <description>Microsoft declines.</description>
    <guid>id-2</guid>
  </item>
</channel>
</rss>`;

const ATOM_SAMPLE = `<?xml version="1.0"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>Tech Feed</title>
  <entry>
    <title>$GOOG rally continues</title>
    <link href="https://example.com/3"/>
    <updated>2025-07-01T10:00:00Z</updated>
    <summary>Google shares jump.</summary>
    <id>id-3</id>
  </entry>
</feed>`;

// ── detectFormat ──────────────────────────────────────────────────────────

describe("detectFormat", () => {
  it("detects RSS", () => expect(detectFormat(RSS_SAMPLE)).toBe("rss"));
  it("detects Atom", () => expect(detectFormat(ATOM_SAMPLE)).toBe("atom"));
  it("returns unknown for garbage", () => expect(detectFormat("hello")).toBe("unknown"));
  it("handles leading whitespace", () => expect(detectFormat("  <rss>")).toBe("rss"));
});

// ── parseRssFeed ──────────────────────────────────────────────────────────

describe("parseRssFeed", () => {
  it("parses items from RSS", () => {
    const items = parseRssFeed(RSS_SAMPLE);
    expect(items).toHaveLength(2);
  });

  it("extracts title and link", () => {
    const items = parseRssFeed(RSS_SAMPLE);
    expect(items[0].title).toContain("AAPL");
    expect(items[0].link).toBe("https://example.com/1");
  });

  it("extracts guid as id", () => {
    const items = parseRssFeed(RSS_SAMPLE);
    expect(items[0].id).toBe("id-1");
  });

  it("extracts source from channel title", () => {
    const items = parseRssFeed(RSS_SAMPLE);
    expect(items[0].source).toBe("Market News");
  });

  it("decodes HTML entities in description", () => {
    const items = parseRssFeed(RSS_SAMPLE);
    expect(items[0].summary).toContain("&");
    expect(items[0].summary).not.toContain("&amp;");
  });

  it("extracts tickers from title+description", () => {
    const items = parseRssFeed(RSS_SAMPLE);
    expect(items[0].tickers).toContain("AAPL");
  });

  it("parses pubDate", () => {
    const items = parseRssFeed(RSS_SAMPLE);
    expect(items[0].pubDate).toBeGreaterThan(0);
  });
});

// ── parseAtomFeed ─────────────────────────────────────────────────────────

describe("parseAtomFeed", () => {
  it("parses entries from Atom", () => {
    const items = parseAtomFeed(ATOM_SAMPLE);
    expect(items).toHaveLength(1);
  });

  it("extracts title and link", () => {
    const items = parseAtomFeed(ATOM_SAMPLE);
    expect(items[0].title).toContain("GOOG");
    expect(items[0].link).toBe("https://example.com/3");
  });

  it("uses feed title as source", () => {
    const items = parseAtomFeed(ATOM_SAMPLE);
    expect(items[0].source).toBe("Tech Feed");
  });
});

// ── parseFeed ─────────────────────────────────────────────────────────────

describe("parseFeed", () => {
  it("auto-parses RSS", () => {
    expect(parseFeed(RSS_SAMPLE)).toHaveLength(2);
  });

  it("auto-parses Atom", () => {
    expect(parseFeed(ATOM_SAMPLE)).toHaveLength(1);
  });

  it("returns empty for unknown format", () => {
    expect(parseFeed("not xml")).toEqual([]);
  });
});

// ── extractTickers ────────────────────────────────────────────────────────

describe("extractTickers", () => {
  it("extracts cashtags", () => {
    expect(extractTickers("Buy $AAPL and $MSFT")).toEqual(["AAPL", "MSFT"]);
  });

  it("returns unique sorted list", () => {
    expect(extractTickers("$AAPL $AAPL $GOOG")).toEqual(["AAPL", "GOOG"]);
  });

  it("ignores lowercase", () => {
    expect(extractTickers("$aapl")).toEqual([]);
  });

  it("returns empty for no tickers", () => {
    expect(extractTickers("no tickers here")).toEqual([]);
  });

  it("limits to 5 chars", () => {
    expect(extractTickers("$ABCDEF")).toEqual([]);
  });
});

// ── groupByTicker ─────────────────────────────────────────────────────────

describe("groupByTicker", () => {
  it("groups items by ticker mention", () => {
    const items = [
      mkItem({ id: "1", tickers: ["AAPL", "MSFT"] }),
      mkItem({ id: "2", tickers: ["AAPL"] }),
      mkItem({ id: "3", tickers: ["GOOG"] }),
    ];
    const grouped = groupByTicker(items);
    expect(grouped.get("AAPL")).toHaveLength(2);
    expect(grouped.get("MSFT")).toHaveLength(1);
    expect(grouped.get("GOOG")).toHaveLength(1);
  });

  it("skips items without tickers", () => {
    const items = [mkItem({ tickers: [] })];
    const grouped = groupByTicker(items);
    expect(grouped.size).toBe(0);
  });
});

// ── scoreSentiment ────────────────────────────────────────────────────────

describe("scoreSentiment", () => {
  it("returns positive for bullish text", () => {
    expect(scoreSentiment("stock surges and rallies")).toBeGreaterThan(0);
  });

  it("returns negative for bearish text", () => {
    expect(scoreSentiment("stock crashes and plunges")).toBeLessThan(0);
  });

  it("returns 0 for neutral text", () => {
    expect(scoreSentiment("the weather is nice today")).toBe(0);
  });

  it("returns 0 for empty string", () => {
    expect(scoreSentiment("")).toBe(0);
  });

  it("value is between -1 and 1", () => {
    const score = scoreSentiment("surge crash rally plunge gains losses");
    expect(score).toBeGreaterThanOrEqual(-1);
    expect(score).toBeLessThanOrEqual(1);
  });
});

// ── classifySentiment ─────────────────────────────────────────────────────

describe("classifySentiment", () => {
  it("bullish for positive", () => expect(classifySentiment(0.5)).toBe("bullish"));
  it("bearish for negative", () => expect(classifySentiment(-0.5)).toBe("bearish"));
  it("neutral for near-zero", () => expect(classifySentiment(0.1)).toBe("neutral"));
  it("neutral at boundary", () => expect(classifySentiment(0.2)).toBe("neutral"));
  it("neutral at negative boundary", () => expect(classifySentiment(-0.2)).toBe("neutral"));
});

// ── deduplicateItems ──────────────────────────────────────────────────────

describe("deduplicateItems", () => {
  it("removes duplicates by id", () => {
    const items = [mkItem({ id: "a" }), mkItem({ id: "b" }), mkItem({ id: "a" })];
    expect(deduplicateItems(items)).toHaveLength(2);
  });

  it("keeps first occurrence", () => {
    const items = [mkItem({ id: "a", title: "first" }), mkItem({ id: "a", title: "second" })];
    expect(deduplicateItems(items)[0].title).toBe("first");
  });
});

// ── sortByDate ────────────────────────────────────────────────────────────

describe("sortByDate", () => {
  it("sorts newest first", () => {
    const items = [
      mkItem({ id: "old", pubDate: 100 }),
      mkItem({ id: "new", pubDate: 300 }),
      mkItem({ id: "mid", pubDate: 200 }),
    ];
    const sorted = sortByDate(items);
    expect(sorted[0].id).toBe("new");
    expect(sorted[2].id).toBe("old");
  });

  it("does not mutate original", () => {
    const items = [mkItem({ pubDate: 200 }), mkItem({ pubDate: 100 })];
    sortByDate(items);
    expect(items[0].pubDate).toBe(200);
  });
});

// ── summariseDigest ───────────────────────────────────────────────────────

describe("summariseDigest", () => {
  it("aggregates stats", () => {
    const items = [
      mkItem({ tickers: ["AAPL"], title: "surges" }),
      mkItem({ tickers: ["AAPL", "MSFT"], title: "rally" }),
      mkItem({ tickers: ["GOOG"], title: "steady" }),
    ];
    const digest = summariseDigest(items);
    expect(digest.totalItems).toBe(3);
    expect(digest.uniqueTickers).toBe(3);
    expect(digest.topTickers.length).toBeLessThanOrEqual(5);
  });

  it("returns neutral for empty list", () => {
    const digest = summariseDigest([]);
    expect(digest.totalItems).toBe(0);
    expect(digest.label).toBe("neutral");
    expect(digest.avgSentiment).toBe(0);
  });

  it("top tickers sorted by frequency", () => {
    const items = [
      mkItem({ tickers: ["AAPL"] }),
      mkItem({ tickers: ["AAPL"] }),
      mkItem({ tickers: ["MSFT"] }),
    ];
    const digest = summariseDigest(items);
    expect(digest.topTickers[0]).toBe("AAPL");
  });
});
