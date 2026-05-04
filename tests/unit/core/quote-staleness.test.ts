import { describe, it, expect } from "vitest";
import {
  checkStaleness,
  checkMultipleStaleness,
  getStaleQuotes,
  getExpiredQuotes,
  stalenessSummary,
  formatAge,
  isMarketHours,
} from "../../../src/core/quote-staleness";

describe("quote-staleness", () => {
  const NOW = 1_700_000_000_000;

  it("checkStaleness marks fresh within threshold", () => {
    const result = checkStaleness("AAPL", NOW - 60_000, NOW); // 1 min ago
    expect(result.status).toBe("fresh");
    expect(result.ticker).toBe("AAPL");
    expect(result.ageMs).toBe(60_000);
  });

  it("checkStaleness marks stale between thresholds", () => {
    const result = checkStaleness("MSFT", NOW - 10 * 60_000, NOW); // 10 min ago
    expect(result.status).toBe("stale");
  });

  it("checkStaleness marks expired beyond threshold", () => {
    const result = checkStaleness("GOOG", NOW - 60 * 60_000, NOW); // 60 min ago
    expect(result.status).toBe("expired");
  });

  it("checkStaleness uses custom thresholds", () => {
    const thresholds = { freshMs: 1000, staleMs: 5000 };
    const result = checkStaleness("X", NOW - 3000, NOW, thresholds);
    expect(result.status).toBe("stale");
  });

  it("checkMultipleStaleness processes array", () => {
    const tickers = [
      { ticker: "A", lastUpdateAt: NOW - 60_000 },
      { ticker: "B", lastUpdateAt: NOW - 10 * 60_000 },
      { ticker: "C", lastUpdateAt: NOW - 60 * 60_000 },
    ];
    const results = checkMultipleStaleness(tickers, NOW);
    expect(results).toHaveLength(3);
    expect(results[0]!.status).toBe("fresh");
    expect(results[1]!.status).toBe("stale");
    expect(results[2]!.status).toBe("expired");
  });

  it("getStaleQuotes excludes fresh", () => {
    const checks = [
      { ticker: "A", lastUpdateAt: 0, ageMs: 1000, status: "fresh" as const },
      { ticker: "B", lastUpdateAt: 0, ageMs: 600_000, status: "stale" as const },
      { ticker: "C", lastUpdateAt: 0, ageMs: 3_600_000, status: "expired" as const },
    ];
    expect(getStaleQuotes(checks)).toHaveLength(2);
  });

  it("getExpiredQuotes returns only expired", () => {
    const checks = [
      { ticker: "A", lastUpdateAt: 0, ageMs: 1000, status: "fresh" as const },
      { ticker: "B", lastUpdateAt: 0, ageMs: 3_600_000, status: "expired" as const },
    ];
    expect(getExpiredQuotes(checks)).toHaveLength(1);
    expect(getExpiredQuotes(checks)[0]!.ticker).toBe("B");
  });

  it("stalenessSummary counts correctly", () => {
    const checks = [
      { ticker: "A", lastUpdateAt: 0, ageMs: 1000, status: "fresh" as const },
      { ticker: "B", lastUpdateAt: 0, ageMs: 1000, status: "fresh" as const },
      { ticker: "C", lastUpdateAt: 0, ageMs: 600_000, status: "stale" as const },
      { ticker: "D", lastUpdateAt: 0, ageMs: 3_600_000, status: "expired" as const },
    ];
    const summary = stalenessSummary(checks);
    expect(summary.fresh).toBe(2);
    expect(summary.stale).toBe(1);
    expect(summary.expired).toBe(1);
  });

  it("formatAge returns readable strings", () => {
    expect(formatAge(30_000)).toBe("30s ago");
    expect(formatAge(180_000)).toBe("3m ago");
    expect(formatAge(7_200_000)).toBe("2h 0m ago");
    expect(formatAge(5_400_000)).toBe("1h 30m ago");
  });

  it("isMarketHours returns false on weekends", () => {
    // Sunday
    const sunday = new Date("2025-01-05T15:00:00Z");
    expect(isMarketHours(sunday)).toBe(false);
    // Saturday
    const saturday = new Date("2025-01-04T15:00:00Z");
    expect(isMarketHours(saturday)).toBe(false);
  });

  it("isMarketHours returns true during trading hours", () => {
    // Wednesday 15:00 UTC = 11:00 ET (market open)
    const wednesday = new Date("2025-01-08T15:00:00Z");
    expect(isMarketHours(wednesday)).toBe(true);
  });
});
