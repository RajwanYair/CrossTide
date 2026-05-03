/**
 * Unit tests for structured request logger (F4).
 */
import { describe, it, expect } from "vitest";
import {
  hashIp,
  startLogEntry,
  finalizeLogEntry,
  formatLogLine,
  statusToLevel,
} from "../../../src/core/request-logger";
import type { PendingLogEntry, LogEntry } from "../../../src/core/request-logger";

// ── hashIp ───────────────────────────────────────────────────────────────

describe("hashIp", () => {
  it("returns 8-char hex string", () => {
    const hashed = hashIp("192.168.1.1");
    expect(hashed).toMatch(/^[0-9a-f]{8}$/);
  });

  it("is deterministic", () => {
    expect(hashIp("10.0.0.1")).toBe(hashIp("10.0.0.1"));
  });

  it("different IPs produce different hashes", () => {
    expect(hashIp("10.0.0.1")).not.toBe(hashIp("10.0.0.2"));
  });

  it("handles empty string", () => {
    const h = hashIp("");
    expect(h).toMatch(/^[0-9a-f]{8}$/);
  });
});

// ── startLogEntry ────────────────────────────────────────────────────────

describe("startLogEntry", () => {
  function makeRequest(
    method: string,
    url: string,
    headers: Record<string, string> = {},
  ): { method: string; url: string; headers: { get(name: string): string | null } } {
    return {
      method,
      url,
      headers: { get: (name: string): string | null => headers[name.toLowerCase()] ?? null },
    };
  }

  it("extracts method and path", () => {
    const entry = startLogEntry(makeRequest("GET", "https://api.crosstide.dev/api/health"));
    expect(entry.method).toBe("GET");
    expect(entry.path).toBe("/api/health");
  });

  it("extracts query string", () => {
    const entry = startLogEntry(
      makeRequest("GET", "https://api.crosstide.dev/api/search?q=AAPL&limit=10"),
    );
    expect(entry.query).toBe("?q=AAPL&limit=10");
  });

  it("hashes cf-connecting-ip", () => {
    const entry = startLogEntry(
      makeRequest("GET", "https://x.dev/api/health", {
        "cf-connecting-ip": "203.0.113.42",
      }),
    );
    expect(entry.ip).toMatch(/^[0-9a-f]{8}$/);
    expect(entry.ip).not.toBe("203.0.113.42");
  });

  it("falls back to x-forwarded-for", () => {
    const entry = startLogEntry(
      makeRequest("GET", "https://x.dev/api/health", {
        "x-forwarded-for": "10.0.0.1, 10.0.0.2",
      }),
    );
    expect(entry.ip).toBe(hashIp("10.0.0.1"));
  });

  it("uses 'unknown' when no IP headers", () => {
    const entry = startLogEntry(makeRequest("GET", "https://x.dev/api/health"));
    expect(entry.ip).toBe(hashIp("unknown"));
  });

  it("captures user-agent", () => {
    const entry = startLogEntry(
      makeRequest("GET", "https://x.dev/", {
        "user-agent": "CrossTide/1.0",
      }),
    );
    expect(entry.userAgent).toBe("CrossTide/1.0");
  });

  it("captures cf-ray header", () => {
    const entry = startLogEntry(
      makeRequest("GET", "https://x.dev/", {
        "cf-ray": "abc123-LAX",
      }),
    );
    expect(entry.rayId).toBe("abc123-LAX");
  });

  it("rayId is null when header absent", () => {
    const entry = startLogEntry(makeRequest("GET", "https://x.dev/"));
    expect(entry.rayId).toBeNull();
  });

  it("records startedAt timestamp", () => {
    const before = Date.now();
    const entry = startLogEntry(makeRequest("GET", "https://x.dev/"));
    expect(entry.startedAt).toBeGreaterThanOrEqual(before);
    expect(entry.startedAt).toBeLessThanOrEqual(Date.now());
  });
});

// ── finalizeLogEntry ─────────────────────────────────────────────────────

describe("finalizeLogEntry", () => {
  const pending: PendingLogEntry = {
    startedAt: Date.now() - 50,
    method: "GET",
    path: "/api/chart",
    query: "?ticker=MSFT",
    ip: "aabbccdd",
    userAgent: "TestBot",
    rayId: "ray-1",
  };

  function makeResponse(
    status: number,
    headers: Record<string, string> = {},
  ): { status: number; headers: { get(name: string): string | null } } {
    return {
      status,
      headers: { get: (name: string): string | null => headers[name.toLowerCase()] ?? null },
    };
  }

  it("computes durationMs", () => {
    const entry = finalizeLogEntry(pending, makeResponse(200));
    expect(entry.durationMs).toBeGreaterThanOrEqual(0);
  });

  it("copies pending fields", () => {
    const entry = finalizeLogEntry(pending, makeResponse(200));
    expect(entry.method).toBe("GET");
    expect(entry.path).toBe("/api/chart");
    expect(entry.query).toBe("?ticker=MSFT");
    expect(entry.ip).toBe("aabbccdd");
    expect(entry.userAgent).toBe("TestBot");
    expect(entry.rayId).toBe("ray-1");
  });

  it("sets status from response", () => {
    const entry = finalizeLogEntry(pending, makeResponse(201));
    expect(entry.status).toBe(201);
  });

  it("parses content-length header", () => {
    const entry = finalizeLogEntry(pending, makeResponse(200, { "content-length": "1234" }));
    expect(entry.contentLength).toBe(1234);
  });

  it("contentLength is null when header absent", () => {
    const entry = finalizeLogEntry(pending, makeResponse(200));
    expect(entry.contentLength).toBeNull();
  });

  it("level is info for 2xx", () => {
    expect(finalizeLogEntry(pending, makeResponse(200)).level).toBe("info");
    expect(finalizeLogEntry(pending, makeResponse(204)).level).toBe("info");
  });

  it("level is warn for 4xx", () => {
    expect(finalizeLogEntry(pending, makeResponse(400)).level).toBe("warn");
    expect(finalizeLogEntry(pending, makeResponse(429)).level).toBe("warn");
  });

  it("level is error for 5xx", () => {
    expect(finalizeLogEntry(pending, makeResponse(500)).level).toBe("error");
    expect(finalizeLogEntry(pending, makeResponse(502)).level).toBe("error");
  });

  it("level is error when error message provided", () => {
    const entry = finalizeLogEntry(pending, makeResponse(200), "boom");
    expect(entry.level).toBe("error");
    expect(entry.error).toBe("boom");
  });

  it("error is null by default", () => {
    expect(finalizeLogEntry(pending, makeResponse(200)).error).toBeNull();
  });

  it("timestamp is ISO string", () => {
    const entry = finalizeLogEntry(pending, makeResponse(200));
    expect(entry.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });
});

// ── formatLogLine ────────────────────────────────────────────────────────

describe("formatLogLine", () => {
  it("returns valid JSON string", () => {
    const entry: LogEntry = {
      timestamp: "2025-01-15T10:00:00.000Z",
      method: "GET",
      path: "/api/health",
      query: "",
      status: 200,
      durationMs: 5,
      ip: "aabbccdd",
      userAgent: "Test",
      contentLength: null,
      rayId: null,
      error: null,
      level: "info",
    };
    const line = formatLogLine(entry);
    const parsed = JSON.parse(line);
    expect(parsed.method).toBe("GET");
    expect(parsed.status).toBe(200);
  });
});

// ── statusToLevel ────────────────────────────────────────────────────────

describe("statusToLevel", () => {
  it("200 → info", () => expect(statusToLevel(200)).toBe("info"));
  it("301 → info", () => expect(statusToLevel(301)).toBe("info"));
  it("400 → warn", () => expect(statusToLevel(400)).toBe("warn"));
  it("404 → warn", () => expect(statusToLevel(404)).toBe("warn"));
  it("500 → error", () => expect(statusToLevel(500)).toBe("error"));
  it("503 → error", () => expect(statusToLevel(503)).toBe("error"));
});
