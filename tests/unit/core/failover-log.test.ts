import { describe, it, expect, beforeEach, vi } from "vitest";

beforeEach(() => {
  vi.resetModules();
});

describe("failover-log", () => {
  async function loadModule() {
    return import("../../../src/core/failover-log");
  }

  const sampleEvent = {
    timestamp: Date.now(),
    ticker: "AAPL",
    failedProvider: "yahoo",
    reason: "timeout",
    fallbackProvider: "finnhub",
    latencyMs: 250,
  };

  it("starts with empty log", async () => {
    const { getFailoverLog } = await loadModule();
    expect(getFailoverLog()).toEqual([]);
  });

  it("records a failover event", async () => {
    const { recordFailover, getFailoverLog } = await loadModule();
    recordFailover(sampleEvent);
    expect(getFailoverLog()).toHaveLength(1);
    expect(getFailoverLog()[0]).toEqual(sampleEvent);
  });

  it("limits to MAX_EVENTS entries", async () => {
    const { recordFailover, getFailoverLog, getMaxEvents } = await loadModule();
    const max = getMaxEvents();
    for (let i = 0; i < max + 10; i++) {
      recordFailover({ ...sampleEvent, timestamp: i });
    }
    expect(getFailoverLog()).toHaveLength(max);
    // Oldest events should be trimmed
    expect(getFailoverLog()[0]!.timestamp).toBe(10);
  });

  it("getRecentFailovers returns last N", async () => {
    const { recordFailover, getRecentFailovers } = await loadModule();
    for (let i = 0; i < 20; i++) {
      recordFailover({ ...sampleEvent, timestamp: i });
    }
    const recent = getRecentFailovers(5);
    expect(recent).toHaveLength(5);
    expect(recent[0]!.timestamp).toBe(15);
  });

  it("getFailoverCountByProvider counts correctly", async () => {
    const { recordFailover, getFailoverCountByProvider } = await loadModule();
    recordFailover({ ...sampleEvent, failedProvider: "yahoo" });
    recordFailover({ ...sampleEvent, failedProvider: "yahoo" });
    recordFailover({ ...sampleEvent, failedProvider: "finnhub" });
    expect(getFailoverCountByProvider("yahoo")).toBe(2);
    expect(getFailoverCountByProvider("finnhub")).toBe(1);
  });

  it("getFailoverSummary aggregates by provider", async () => {
    const { recordFailover, getFailoverSummary } = await loadModule();
    recordFailover({ ...sampleEvent, failedProvider: "yahoo", timestamp: 100 });
    recordFailover({ ...sampleEvent, failedProvider: "yahoo", timestamp: 200 });
    recordFailover({ ...sampleEvent, failedProvider: "stooq", timestamp: 150 });
    const summary = getFailoverSummary();
    expect(summary.get("yahoo")).toEqual({ failures: 2, lastFailure: 200 });
    expect(summary.get("stooq")).toEqual({ failures: 1, lastFailure: 150 });
  });

  it("onFailover subscriber is called", async () => {
    const { recordFailover, onFailover } = await loadModule();
    const fn = vi.fn();
    onFailover(fn);
    recordFailover(sampleEvent);
    expect(fn).toHaveBeenCalledWith(sampleEvent);
  });

  it("unsubscribe stops notifications", async () => {
    const { recordFailover, onFailover } = await loadModule();
    const fn = vi.fn();
    const unsub = onFailover(fn);
    unsub();
    recordFailover(sampleEvent);
    expect(fn).not.toHaveBeenCalled();
  });

  it("clearFailoverLog empties the log", async () => {
    const { recordFailover, clearFailoverLog, getFailoverLog } = await loadModule();
    recordFailover(sampleEvent);
    clearFailoverLog();
    expect(getFailoverLog()).toHaveLength(0);
  });
});
