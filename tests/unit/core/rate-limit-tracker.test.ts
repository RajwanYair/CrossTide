/**
 * Rate limit tracker tests.
 */
import { describe, it, expect, beforeEach } from "vitest";
import {
  recordRequest,
  getRateLimitInfo,
  getAllRateLimits,
  setProviderCapacity,
  resetRateLimits,
} from "../../../src/core/rate-limit-tracker";

describe("rate-limit-tracker", () => {
  beforeEach(() => {
    resetRateLimits();
  });

  it("starts with zero requests", () => {
    const info = getRateLimitInfo("yahoo");
    expect(info.requestsInWindow).toBe(0);
    expect(info.usagePercent).toBe(0);
  });

  it("counts requests in window", () => {
    const now = Date.now();
    recordRequest("yahoo", now);
    recordRequest("yahoo", now + 100);
    recordRequest("yahoo", now + 200);
    const info = getRateLimitInfo("yahoo", now + 300);
    expect(info.requestsInWindow).toBe(3);
    expect(info.capacity).toBe(60);
    expect(info.usagePercent).toBe(5);
  });

  it("prunes old requests outside window", () => {
    const now = Date.now();
    recordRequest("yahoo", now - 90_000); // old, outside 60s window
    recordRequest("yahoo", now - 30_000); // still in window
    const info = getRateLimitInfo("yahoo", now);
    expect(info.requestsInWindow).toBe(1);
  });

  it("respects custom capacity", () => {
    const now = Date.now();
    setProviderCapacity("yahoo", 10);
    for (let i = 0; i < 6; i++) recordRequest("yahoo", now);
    const info = getRateLimitInfo("yahoo", now);
    expect(info.capacity).toBe(10);
    expect(info.usagePercent).toBe(60);
  });

  it("caps usage at 100%", () => {
    const now = Date.now();
    setProviderCapacity("test", 5);
    for (let i = 0; i < 10; i++) recordRequest("test", now);
    const info = getRateLimitInfo("test", now);
    expect(info.usagePercent).toBe(100);
  });

  it("getAllRateLimits returns all providers", () => {
    recordRequest("yahoo");
    recordRequest("finnhub");
    const all = getAllRateLimits();
    expect(all.length).toBe(2);
    expect(all.map((r) => r.provider)).toContain("yahoo");
    expect(all.map((r) => r.provider)).toContain("finnhub");
  });

  it("is case-insensitive", () => {
    recordRequest("Yahoo");
    recordRequest("YAHOO");
    const info = getRateLimitInfo("yahoo");
    expect(info.requestsInWindow).toBe(2);
  });
});
