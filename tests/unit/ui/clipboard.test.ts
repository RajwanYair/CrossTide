import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { copyToClipboard, readClipboard } from "../../../src/ui/clipboard";

describe("copyToClipboard", () => {
  const origNav = (globalThis as { navigator?: Navigator }).navigator;
  afterEach(() => {
    (globalThis as { navigator?: Navigator }).navigator = origNav;
    vi.restoreAllMocks();
  });

  it("uses navigator.clipboard when available", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    (globalThis as { navigator?: unknown }).navigator = { clipboard: { writeText } };
    const r = await copyToClipboard("hello");
    expect(r.ok).toBe(true);
    expect(writeText).toHaveBeenCalledWith("hello");
  });

  it("returns error on rejection (no DOM fallback)", async () => {
    const writeText = vi.fn().mockRejectedValue(new Error("denied"));
    (globalThis as { navigator?: unknown }).navigator = { clipboard: { writeText } };
    const orig = (globalThis as { document?: unknown }).document;
    (globalThis as { document?: unknown }).document = undefined;
    const r = await copyToClipboard("x");
    (globalThis as { document?: unknown }).document = orig;
    expect(r.ok).toBe(false);
    expect(r.error).toContain("denied");
  });

  it("returns ok false when clipboard API absent and no DOM", async () => {
    (globalThis as { navigator?: unknown }).navigator = {};
    const orig = (globalThis as { document?: unknown }).document;
    (globalThis as { document?: unknown }).document = undefined;
    const r = await copyToClipboard("x");
    (globalThis as { document?: unknown }).document = orig;
    expect(r.ok).toBe(false);
  });

  // ── DOM fallback (execCommand) path ────────────────────────────────────────

  it("falls back to execCommand when clipboard API absent", async () => {
    (globalThis as { navigator?: unknown }).navigator = {};
    // happy-dom does not implement execCommand — define it first
    Object.defineProperty(document, "execCommand", {
      value: vi.fn().mockReturnValue(true),
      writable: true,
      configurable: true,
    });
    const r = await copyToClipboard("fallback-text");
    expect(r.ok).toBe(true);
  });

  it("returns ok false when execCommand returns false", async () => {
    (globalThis as { navigator?: unknown }).navigator = {};
    Object.defineProperty(document, "execCommand", {
      value: vi.fn().mockReturnValue(false),
      writable: true,
      configurable: true,
    });
    const r = await copyToClipboard("x");
    expect(r.ok).toBe(false);
    expect(r.error).toContain("execCommand returned false");
  });

  it("returns ok false when execCommand throws", async () => {
    (globalThis as { navigator?: unknown }).navigator = {};
    Object.defineProperty(document, "execCommand", {
      value: vi.fn().mockImplementation(() => {
        throw new Error("not allowed");
      }),
      writable: true,
      configurable: true,
    });
    const r = await copyToClipboard("x");
    expect(r.ok).toBe(false);
    expect(r.error).toBe("not allowed");
  });

  it("uses DOM fallback when clipboard.writeText rejects and DOM is available", async () => {
    const writeText = vi.fn().mockRejectedValue(new Error("permission denied"));
    (globalThis as { navigator?: unknown }).navigator = { clipboard: { writeText } };
    Object.defineProperty(document, "execCommand", {
      value: vi.fn().mockReturnValue(true),
      writable: true,
      configurable: true,
    });
    const r = await copyToClipboard("fallback-after-rejection");
    expect(r.ok).toBe(true);
  });
});

describe("readClipboard", () => {
  const origNav = (globalThis as { navigator?: Navigator }).navigator;
  beforeEach(() => {
    (globalThis as { navigator?: unknown }).navigator = origNav;
  });

  it("returns null when API missing", async () => {
    (globalThis as { navigator?: unknown }).navigator = {};
    expect(await readClipboard()).toBeNull();
  });
  it("returns text when API present", async () => {
    (globalThis as { navigator?: unknown }).navigator = {
      clipboard: { readText: vi.fn().mockResolvedValue("yo") },
    };
    expect(await readClipboard()).toBe("yo");
  });
  it("returns null on rejection", async () => {
    (globalThis as { navigator?: unknown }).navigator = {
      clipboard: { readText: vi.fn().mockRejectedValue(new Error("nope")) },
    };
    expect(await readClipboard()).toBeNull();
  });
});
