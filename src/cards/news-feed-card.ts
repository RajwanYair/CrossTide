/**
 * News feed card with sentiment indicators (Q13).
 *
 * Displays recent news articles for the user's watchlist tickers with
 * a keyword-based sentiment badge per article. Uses the news-digest
 * domain module for parsing and sentiment scoring.
 *
 * Data source: currently uses mock news items seeded from watchlist.
 * Hook point isolated so Finnhub /news endpoint can replace the source.
 */
import { loadConfig } from "../core/config";
import {
  scoreSentiment,
  classifySentiment,
  type FeedItem,
  type SentimentLabel,
} from "../domain/news-digest";
import { patchDOM } from "../core/patch-dom";
import type { CardModule } from "./registry";

/** Sentiment badge CSS class mapping. */
function sentimentClass(label: SentimentLabel): string {
  switch (label) {
    case "bullish":
      return "sentiment-bullish";
    case "bearish":
      return "sentiment-bearish";
    case "neutral":
      return "sentiment-neutral";
  }
}

/** Generate deterministic mock news items for the watchlist. */
export function buildMockNews(): FeedItem[] {
  const cfg = loadConfig();
  const now = Date.now();
  const headlines = [
    "reports strong quarterly earnings beating estimates",
    "faces regulatory headwinds in key markets",
    "announces new product line expansion plans",
    "shares tumble on weaker than expected guidance",
    "upgraded by analysts amid sector rotation",
    "partners with tech giant for ai integration",
    "dividend increase signals management confidence",
    "warns of supply chain disruptions ahead",
  ];

  const items: FeedItem[] = [];
  for (const w of cfg.watchlist) {
    const seed = hashStr(w.ticker);
    const count = (seed % 3) + 1;
    for (let i = 0; i < count; i++) {
      const hIdx = (seed + i * 7) % headlines.length;
      const title = `${w.ticker} ${headlines[hIdx]}`;
      const hoursAgo = ((seed + i * 13) % 72) + 1;
      items.push({
        id: `${w.ticker}-${i}`,
        title,
        link: `#news/${w.ticker}/${i}`,
        pubDate: now - hoursAgo * 3600_000,
        source: "Mock Financial News",
        summary: title,
        tickers: [w.ticker],
      });
    }
  }
  return items.sort((a, b) => b.pubDate - a.pubDate);
}

function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function timeAgo(epochMs: number): string {
  const diff = Date.now() - epochMs;
  const hours = Math.floor(diff / 3600_000);
  if (hours < 1) return "< 1h ago";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function renderNewsFeed(container: HTMLElement, items: readonly FeedItem[]): void {
  if (items.length === 0) {
    patchDOM(
      container,
      `<div class="card"><div class="card-body"><p class="empty-state">No news available.</p></div></div>`,
    );
    return;
  }

  const rows = items
    .slice(0, 20)
    .map((item) => {
      const score = scoreSentiment(item.title);
      const label = classifySentiment(score);
      const badge = `<span class="sentiment-badge ${sentimentClass(label)}">${label}</span>`;
      const tickers = item.tickers.map((t) => `<span class="ticker-tag">${t}</span>`).join(" ");
      return `<li class="news-item">
      <div class="news-item-header">
        ${tickers} ${badge}
        <time class="news-time">${timeAgo(item.pubDate)}</time>
      </div>
      <a href="${escapeHtml(item.link)}" class="news-title">${escapeHtml(item.title)}</a>
      <span class="news-source">${escapeHtml(item.source)}</span>
    </li>`;
    })
    .join("");

  patchDOM(
    container,
    `<div class="card">
      <div class="card-header">
        <h2>News Feed</h2>
        <span class="text-secondary">Sentiment-scored headlines</span>
      </div>
      <div class="card-body">
        <ul class="news-feed-list">${rows}</ul>
      </div>
    </div>`,
  );
}

const newsFeedCard: CardModule = {
  mount(container) {
    renderNewsFeed(container, buildMockNews());
    return {};
  },
};

export default newsFeedCard;
