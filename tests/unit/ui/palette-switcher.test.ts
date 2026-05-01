import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  applyPalette,
  getActivePalette,
  loadPersistedPalette,
  VALID_PALETTES,
  PALETTE_LABELS,
} from "../../../src/ui/palette-switcher";

function storageMock(): Storage {
  const store = new Map<string, string>();
  return {
    get length() { return store.size; },
    key(i: number) { return [...store.keys()][i] ?? null; },
    getItem(k: string) { return store.get(k) ?? null; },
    setItem(k: string, v: string) { store.set(k, v); },
    removeItem(k: string) { store.delete(k); },
    clear() { store.clear(); },
  };
}

describe("palette-switcher", () => {
  beforeEach(() => {
    // Reset html element
    delete document.documentElement.dataset["palette"];
    vi.stubGlobal("localStorage", storageMock());
  });

  afterEach(() => {
    delete document.documentElement.dataset["palette"];
    vi.unstubAllGlobals();
  });

  describe("applyPalette", () => {
    it("sets data-palette attribute on <html>", () => {
      applyPalette("deuteranopia");
      expect(document.documentElement.dataset["palette"]).toBe("deuteranopia");
    });

    it("removes data-palette attribute for 'default'", () => {
      applyPalette("deuteranopia");
      applyPalette("default");
      expect(document.documentElement.dataset["palette"]).toBeUndefined();
    });

    it("persists to localStorage", () => {
      applyPalette("protanopia");
      expect(localStorage.getItem("crosstide-palette")).toBe("protanopia");
    });

    it("persists 'default' to localStorage", () => {
      applyPalette("default");
      expect(localStorage.getItem("crosstide-palette")).toBe("default");
    });
  });

  describe("getActivePalette", () => {
    it("returns default when no attribute set", () => {
      expect(getActivePalette()).toBe("default");
    });

    it("returns the currently set palette", () => {
      applyPalette("tritanopia");
      expect(getActivePalette()).toBe("tritanopia");
    });

    it("returns default for unknown data-palette values", () => {
      document.documentElement.dataset["palette"] = "invalid-name";
      expect(getActivePalette()).toBe("default");
    });
  });

  describe("loadPersistedPalette", () => {
    it("applies saved palette on load", () => {
      localStorage.setItem("crosstide-palette", "deuteranopia");
      loadPersistedPalette();
      expect(document.documentElement.dataset["palette"]).toBe("deuteranopia");
    });

    it("does nothing when localStorage has no value", () => {
      loadPersistedPalette();
      expect(document.documentElement.dataset["palette"]).toBeUndefined();
    });

    it("does nothing for invalid saved values", () => {
      localStorage.setItem("crosstide-palette", "bogus");
      loadPersistedPalette();
      expect(document.documentElement.dataset["palette"]).toBeUndefined();
    });
  });

  describe("VALID_PALETTES", () => {
    it("includes all expected names", () => {
      expect(VALID_PALETTES).toContain("default");
      expect(VALID_PALETTES).toContain("deuteranopia");
      expect(VALID_PALETTES).toContain("protanopia");
      expect(VALID_PALETTES).toContain("tritanopia");
      expect(VALID_PALETTES).toContain("high-contrast");
    });
  });

  describe("PALETTE_LABELS", () => {
    it("has a human-readable label for every valid palette", () => {
      for (const pal of VALID_PALETTES) {
        expect(PALETTE_LABELS[pal]).toBeTruthy();
      }
    });
  });
});
