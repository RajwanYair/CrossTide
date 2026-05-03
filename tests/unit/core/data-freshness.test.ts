/**
 * Data freshness tracker tests.
 */
import { describe, it, expect, beforeEach } from "vitest";
import {
  markFetched,
  getFreshness,
  getAllFreshness,
  resetFreshness,
  renderFreshnessBadge,
} from "../../../src/core/data-freshness";

describe("data-freshness", () => {
  beforeEach(() => {
    resetFreshness();
  });

  it("returns expired status for unknown tickers", () => {
    const status = getFreshness("UNKNOWN");
    expect(status.level).toBe("expired");
    expect(status.label).toBe("No data");
    expect(status.ageMs).toBe(Infinity);
  });

  it("returns fresh status when just fetched", () => {
    const now = Date.now();
    markFetched("AAPL", now);
    const status = getFreshness("AAPL", now + 1000); // 1 second later
    expect(status.level).toBe("fresh");
    expect(status.label).toBe("Live");
  });

  it("returns stale after 5 minutes", () => {
    const now = Date.now();
    markFetched("AAPL", now);
    const status = getFreshness("AAPL", now + 6 * 60_000); // 6 minutes
    expect(status.level).toBe("stale");
    expect(status.label).toBe("6m ago");
  });

  it("returns expired after 30 minutes", () => {
    const now = Date.now();
    markFetched("AAPL", now);
    const status = getFreshness("AAPL", now + 35 * 60_000); // 35 minutes
    expect(status.level).toBe("expired");
    expect(status.label).toBe("35m ago");
  });

  it("shows hours for very old data", () => {
    const now = Date.now();
    markFetched("TSLA", now);
    const status = getFreshness("TSLA", now + 90 * 60_000); // 90 minutes
    expect(status.level).toBe("expired");
    expect(status.label).toBe("1h ago");
  });

  it("is case-insensitive for ticker", () => {
    markFetched("aapl");
    const status = getFreshness("AAPL");
    expect(status.level).toBe("fresh");
  });

  it("getAllFreshness returns all tracked tickers", () => {
    const now = Date.now();
    markFetched("AAPL", now);
    markFetched("MSFT", now);
    const all = getAllFreshness(now);
    expect(all).toHaveLength(2);
  });

  it("resetFreshness clears all entries", () => {
    markFetched("AAPL");
    resetFreshness();
    expect(getAllFreshness()).toHaveLength(0);
  });

  it("renderFreshnessBadge generates correct HTML", () => {
    const now = Date.now();
    markFetched("SPY", now);
    const status = getFreshness("SPY", now + 1000);
    const html = renderFreshnessBadge(status);
    expect(html).toContain("freshness-fresh");
    expect(html).toContain("Live");
  });
});
