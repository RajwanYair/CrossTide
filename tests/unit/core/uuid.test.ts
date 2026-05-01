import { describe, it, expect, vi, afterEach } from "vitest";
import { uuidV4, isUuidV4, nanoId } from "../../../src/core/uuid";

describe("uuidV4", () => {
  it("produces a valid v4 UUID", () => {
    const id = uuidV4();
    expect(isUuidV4(id)).toBe(true);
  });
  it("produces unique ids", () => {
    const set = new Set(Array.from({ length: 200 }, () => uuidV4()));
    expect(set.size).toBe(200);
  });
});

describe("isUuidV4", () => {
  it("rejects non-UUID strings", () => {
    expect(isUuidV4("not-a-uuid")).toBe(false);
    expect(isUuidV4("00000000-0000-1000-8000-000000000000")).toBe(false); // version 1
  });
  it("accepts canonical v4", () => {
    expect(isUuidV4("550e8400-e29b-41d4-a716-446655440000")).toBe(true);
  });
});

describe("nanoId", () => {
  it("default length is 21", () => {
    expect(nanoId().length).toBe(21);
  });
  it("respects custom size", () => {
    expect(nanoId(10).length).toBe(10);
  });
  it("uses URL-safe characters only", () => {
    const id = nanoId(64);
    expect(/^[A-Za-z0-9_-]+$/.test(id)).toBe(true);
  });
  it("produces unique ids", () => {
    const set = new Set(Array.from({ length: 200 }, () => nanoId()));
    expect(set.size).toBe(200);
  });
});

describe("uuidV4 — fallback paths", () => {
  afterEach(() => {
    // Restore real crypto
    vi.restoreAllMocks();
  });

  it("falls back to getRandomValues when randomUUID is absent", () => {
    const origRandomUUID = globalThis.crypto.randomUUID;
    try {
      // Temporarily remove randomUUID to force getRandomValues path
      Object.defineProperty(globalThis.crypto, "randomUUID", {
        value: undefined,
        writable: true,
        configurable: true,
      });
      const id = uuidV4();
      expect(isUuidV4(id)).toBe(true);
    } finally {
      Object.defineProperty(globalThis.crypto, "randomUUID", {
        value: origRandomUUID,
        writable: true,
        configurable: true,
      });
    }
  });

  it("output matches UUID v4 format regardless of path", () => {
    // Test the UUID pattern with multiple calls
    for (let i = 0; i < 5; i++) {
      const id = uuidV4();
      expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    }
  });
});

describe("nanoId — fallback path", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("falls back to Math.random when getRandomValues is absent", () => {
    const orig = globalThis.crypto.getRandomValues;
    try {
      Object.defineProperty(globalThis.crypto, "getRandomValues", {
        value: undefined,
        writable: true,
        configurable: true,
      });
      const id = nanoId(21);
      expect(id.length).toBe(21);
      expect(/^[A-Za-z0-9_-]+$/.test(id)).toBe(true);
    } finally {
      Object.defineProperty(globalThis.crypto, "getRandomValues", {
        value: orig,
        writable: true,
        configurable: true,
      });
    }
  });

  it("size 0 returns empty string", () => {
    expect(nanoId(0)).toBe("");
  });
});
