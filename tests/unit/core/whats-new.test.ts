import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock openModal
vi.mock("../../../src/ui/modal", () => ({
  openModal: vi.fn(),
}));

import { openModal } from "../../../src/ui/modal";

function storageMock(): Storage {
  const store: Record<string, string> = {};
  return {
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => {
      store[k] = v;
    },
    removeItem: (k: string) => {
      delete store[k];
    },
    clear: () => {
      Object.keys(store).forEach((k) => delete store[k]);
    },
    key: (i: number) => Object.keys(store)[i] ?? null,
    get length() {
      return Object.keys(store).length;
    },
  };
}

describe("whats-new", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", storageMock());
    vi.mocked(openModal).mockClear();
    vi.resetModules();
  });

  async function loadModule() {
    const mod = await import("../../../src/core/whats-new");
    return mod;
  }

  it("does not show modal on first visit (no previous version)", async () => {
    const { checkWhatsNew } = await loadModule();
    checkWhatsNew();
    expect(openModal).not.toHaveBeenCalled();
  });

  it("does not show modal when version unchanged", async () => {
    const { checkWhatsNew, APP_VERSION } = await loadModule();
    localStorage.setItem("crosstide_last_seen_version", APP_VERSION);
    checkWhatsNew();
    expect(openModal).not.toHaveBeenCalled();
  });

  it("shows modal when version differs from stored", async () => {
    localStorage.setItem("crosstide_last_seen_version", "0.0.1");
    const { checkWhatsNew } = await loadModule();
    checkWhatsNew();
    expect(openModal).toHaveBeenCalledTimes(1);
    const call = vi.mocked(openModal).mock.calls[0][0];
    expect(call.title).toBe("What's New");
    expect(call.content).toBeInstanceOf(HTMLElement);
  });

  it("stores new version after check", async () => {
    localStorage.setItem("crosstide_last_seen_version", "0.0.1");
    const { checkWhatsNew, APP_VERSION } = await loadModule();
    checkWhatsNew();
    expect(localStorage.getItem("crosstide_last_seen_version")).toBe(APP_VERSION);
  });

  it("WHATS_NEW registry is non-empty", async () => {
    const { WHATS_NEW } = await loadModule();
    expect(WHATS_NEW.length).toBeGreaterThan(0);
    for (const entry of WHATS_NEW) {
      expect(entry.version).toBeTruthy();
      expect(entry.highlights.length).toBeGreaterThan(0);
    }
  });
});
