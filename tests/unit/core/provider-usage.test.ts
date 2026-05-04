import { describe, it, expect, beforeEach, vi } from "vitest";

beforeEach(() => {
  vi.resetModules();
});

describe("provider-usage", () => {
  async function loadModule() {
    return import("../../../src/core/provider-usage");
  }

  it("starts with no usage data", async () => {
    const { getAllProviderUsage, getTotalCalls } = await loadModule();
    expect(getAllProviderUsage()).toEqual([]);
    expect(getTotalCalls()).toBe(0);
  });

  it("recordProviderCall tracks calls and latency", async () => {
    const { recordProviderCall, getProviderUsage } = await loadModule();
    recordProviderCall("yahoo", 100);
    recordProviderCall("yahoo", 200);
    const usage = getProviderUsage("yahoo");
    expect(usage).not.toBeNull();
    expect(usage!.calls).toBe(2);
    expect(usage!.avgLatencyMs).toBe(150);
  });

  it("recordProviderError tracks errors", async () => {
    const { recordProviderCall, recordProviderError, getProviderUsage } = await loadModule();
    recordProviderCall("finnhub", 50);
    recordProviderError("finnhub");
    const usage = getProviderUsage("finnhub");
    expect(usage!.calls).toBe(1);
    expect(usage!.errors).toBe(1);
  });

  it("normalizes provider names to lowercase", async () => {
    const { recordProviderCall, getProviderUsage } = await loadModule();
    recordProviderCall("Yahoo", 100);
    recordProviderCall("YAHOO", 200);
    expect(getProviderUsage("yahoo")!.calls).toBe(2);
  });

  it("getMostUsedProvider returns top provider", async () => {
    const { recordProviderCall, getMostUsedProvider } = await loadModule();
    recordProviderCall("yahoo", 50);
    recordProviderCall("yahoo", 50);
    recordProviderCall("finnhub", 50);
    expect(getMostUsedProvider()).toBe("yahoo");
  });

  it("getMostUsedProvider returns null when empty", async () => {
    const { getMostUsedProvider } = await loadModule();
    expect(getMostUsedProvider()).toBeNull();
  });

  it("getErrorRate computes ratio correctly", async () => {
    const { recordProviderCall, recordProviderError, getErrorRate } = await loadModule();
    recordProviderCall("stooq", 100);
    recordProviderCall("stooq", 100);
    recordProviderCall("stooq", 100);
    recordProviderError("stooq");
    // 1 error out of (3 calls + 1 error) = 0.25
    expect(getErrorRate("stooq")).toBeCloseTo(0.25, 5);
  });

  it("getTotalCalls sums across providers", async () => {
    const { recordProviderCall, getTotalCalls } = await loadModule();
    recordProviderCall("yahoo", 50);
    recordProviderCall("finnhub", 50);
    recordProviderCall("stooq", 50);
    expect(getTotalCalls()).toBe(3);
  });

  it("resetProviderUsage clears everything", async () => {
    const { recordProviderCall, resetProviderUsage, getAllProviderUsage } = await loadModule();
    recordProviderCall("yahoo", 50);
    resetProviderUsage();
    expect(getAllProviderUsage()).toEqual([]);
  });

  it("getProviderUsage returns null for unknown provider", async () => {
    const { getProviderUsage } = await loadModule();
    expect(getProviderUsage("unknown")).toBeNull();
  });
});
