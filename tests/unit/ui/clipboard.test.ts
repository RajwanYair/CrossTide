import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { copyToClipboard, readClipboard } from "../../../src/ui/clipboard";

describe("copyToClipboard", () => {
  const origNav = (globalThis as { navigator?: Navigator }).navigator;
  afterEach(() => {
    (globalThis as { navigator?: Navigator }).navigator = origNav;
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
