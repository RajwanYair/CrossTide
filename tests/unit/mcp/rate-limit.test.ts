/**
 * Guards the MCP per-tool rate limiter (roadmap E04).
 */
import { describe, expect, it, beforeEach } from "vitest";
import { checkToolRateLimit, resetToolRateLimits } from "../../../mcp-server/src/rate-limit.js";

describe("checkToolRateLimit", () => {
  beforeEach(() => {
    resetToolRateLimits();
  });

  it("allows calls within the capacity", () => {
    const now = 0;
    for (let i = 0; i < 30; i++) {
      expect(checkToolRateLimit("get_quote", now)).toBe(true);
    }
  });

  it("rejects a call once the bucket for that tool is exhausted", () => {
    const now = 0;
    for (let i = 0; i < 30; i++) {
      checkToolRateLimit("get_quote", now);
    }
    expect(checkToolRateLimit("get_quote", now)).toBe(false);
  });

  it("tracks buckets independently per tool name", () => {
    const now = 0;
    for (let i = 0; i < 30; i++) {
      checkToolRateLimit("get_quote", now);
    }
    expect(checkToolRateLimit("get_quote", now)).toBe(false);
    expect(checkToolRateLimit("run_screener", now)).toBe(true);
  });

  it("refills the bucket after the window elapses", () => {
    const start = 0;
    for (let i = 0; i < 30; i++) {
      checkToolRateLimit("get_quote", start);
    }
    expect(checkToolRateLimit("get_quote", start)).toBe(false);
    expect(checkToolRateLimit("get_quote", start + 60_001)).toBe(true);
  });
});
