import { describe, it, expect } from "vitest";
import { renderNewsFeed } from "../../../src/cards/news-feed-card";
import type { FeedItem } from "../../../src/domain/news-digest";

function makeMockItems(count: number): FeedItem[] {
  const now = Date.now();
  return Array.from({ length: count }, (_, i) => ({
    id: `item-${i}`,
    title: i % 2 === 0 ? "stock surges on strong growth" : "company faces decline amid losses",
    link: `#news/test/${i}`,
    pubDate: now - i * 3600_000,
    source: "Test Source",
    summary: "test summary",
    tickers: ["AAPL"],
  }));
}

describe("news-feed-card", () => {
  describe("renderNewsFeed", () => {
    it("renders empty state when no items", () => {
      const el = document.createElement("div");
      renderNewsFeed(el, []);
      expect(el.innerHTML).toContain("No news available");
    });

    it("renders items with sentiment badges", () => {
      const el = document.createElement("div");
      renderNewsFeed(el, makeMockItems(3));
      expect(el.innerHTML).toContain("sentiment-badge");
      expect(el.innerHTML).toContain("news-item");
    });

    it("caps output at 20 items", () => {
      const el = document.createElement("div");
      renderNewsFeed(el, makeMockItems(30));
      const listItems = el.querySelectorAll(".news-item");
      expect(listItems.length).toBe(20);
    });

    it("shows ticker tags", () => {
      const el = document.createElement("div");
      renderNewsFeed(el, makeMockItems(2));
      expect(el.innerHTML).toContain("ticker-tag");
      expect(el.innerHTML).toContain("AAPL");
    });

    it("shows time ago text", () => {
      const el = document.createElement("div");
      renderNewsFeed(el, makeMockItems(1));
      expect(el.innerHTML).toContain("news-time");
    });
  });
});
