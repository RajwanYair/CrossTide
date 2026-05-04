import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  getPalette,
  pickColor,
  isHexColor,
  PALETTE_NAMES,
  applyPalette,
  persistPalette,
  loadPalette,
  activatePaletteFromStorage,
  type SemanticColor,
} from "../../../src/ui/palettes";

const ALL_KINDS: SemanticColor[] = [
  "bullish",
  "bearish",
  "neutral",
  "accent1",
  "accent2",
  "accent3",
  "warning",
  "info",
];

describe("palettes", () => {
  it("PALETTE_NAMES contains four palettes", () => {
    expect(PALETTE_NAMES).toHaveLength(4);
  });

  it("every palette defines every semantic color", () => {
    for (const name of PALETTE_NAMES) {
      const p = getPalette(name);
      for (const k of ALL_KINDS) {
        expect(p[k]).toBeDefined();
        expect(isHexColor(p[k])).toBe(true);
      }
    }
  });

  it("pickColor returns the same value as getPalette", () => {
    for (const name of PALETTE_NAMES) {
      expect(pickColor(name, "bullish")).toBe(getPalette(name).bullish);
    }
  });

  it("default palette uses red/green for bull/bear", () => {
    expect(getPalette("default").bullish).toBe("#16a34a");
    expect(getPalette("default").bearish).toBe("#dc2626");
  });

  it("deuteranopia avoids red/green confusion", () => {
    const p = getPalette("deuteranopia");
    expect(p.bullish).not.toBe("#16a34a");
    expect(p.bearish).not.toBe("#dc2626");
  });

  it("isHexColor accepts valid 6-digit hex", () => {
    expect(isHexColor("#abcdef")).toBe(true);
    expect(isHexColor("#ABCDEF")).toBe(true);
    expect(isHexColor("#123456")).toBe(true);
  });

  it("isHexColor rejects invalid", () => {
    expect(isHexColor("abcdef")).toBe(false);
    expect(isHexColor("#abc")).toBe(false);
    expect(isHexColor("#abcdefg")).toBe(false);
    expect(isHexColor("")).toBe(false);
  });

  it("palettes have no duplicate colors within a single palette", () => {
    for (const name of PALETTE_NAMES) {
      const p = getPalette(name);
      const colors = ALL_KINDS.map((k) => p[k]);
      expect(new Set(colors).size).toBe(colors.length);
    }
  });
});

// ── Runtime palette activation tests (C2) ────────────────────────────────────

function createStorageMock(): Storage {
  const store = new Map<string, string>();
  return {
    get length() {
      return store.size;
    },
    key(i: number) {
      return [...store.keys()][i] ?? null;
    },
    getItem(k: string) {
      return store.get(k) ?? null;
    },
    setItem(k: string, v: string) {
      store.set(k, v);
    },
    removeItem(k: string) {
      store.delete(k);
    },
    clear() {
      store.clear();
    },
  };
}

describe("applyPalette", () => {
  it("sets CSS custom properties on the provided root element", () => {
    const root = document.createElement("div");
    applyPalette("default", root);
    expect(root.style.getPropertyValue("--color-bullish")).toBe("#16a34a");
    expect(root.style.getPropertyValue("--color-bearish")).toBe("#dc2626");
  });

  it("sets data-palette attribute on root", () => {
    const root = document.createElement("div");
    applyPalette("deuteranopia", root);
    expect(root.getAttribute("data-palette")).toBe("deuteranopia");
  });

  it("applies every semantic color for all palettes", () => {
    for (const name of PALETTE_NAMES) {
      const root = document.createElement("div");
      applyPalette(name, root);
      const palette = getPalette(name);
      for (const [kind, hex] of Object.entries(palette) as [SemanticColor, string][]) {
        expect(root.style.getPropertyValue(`--color-${kind}`)).toBe(hex);
      }
    }
  });

  it("overwrites an existing palette when called again", () => {
    const root = document.createElement("div");
    applyPalette("default", root);
    applyPalette("deuteranopia", root);
    // deuteranopia bullish is blue (#0072b2), not the default green
    expect(root.style.getPropertyValue("--color-bullish")).toBe("#0072b2");
    expect(root.getAttribute("data-palette")).toBe("deuteranopia");
  });
});

describe("persistPalette / loadPalette", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", createStorageMock());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("loadPalette returns null when nothing is stored", () => {
    expect(loadPalette()).toBeNull();
  });

  it("persistPalette + loadPalette roundtrip all palette names", () => {
    for (const name of PALETTE_NAMES) {
      persistPalette(name);
      expect(loadPalette()).toBe(name);
    }
  });

  it("loadPalette returns null for unknown stored value", () => {
    localStorage.setItem("ct_palette", "rainbow");
    expect(loadPalette()).toBeNull();
  });

  it("persistPalette does not throw when localStorage is unavailable", () => {
    vi.stubGlobal("localStorage", {
      setItem: () => {
        throw new Error("unavailable");
      },
      getItem: () => null,
      removeItem: () => null,
      key: () => null,
      clear: () => null,
      length: 0,
    });
    expect(() => persistPalette("default")).not.toThrow();
  });

  it("loadPalette does not throw when localStorage is unavailable", () => {
    vi.stubGlobal("localStorage", {
      getItem: () => {
        throw new Error("unavailable");
      },
      setItem: () => null,
      removeItem: () => null,
      key: () => null,
      clear: () => null,
      length: 0,
    });
    expect(() => loadPalette()).not.toThrow();
    expect(loadPalette()).toBeNull();
  });
});

describe("activatePaletteFromStorage", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", createStorageMock());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns null when no palette is stored", () => {
    const _root = document.createElement("div");
    const spy = vi.spyOn({ applyPalette }, "applyPalette");
    expect(activatePaletteFromStorage()).toBeNull();
    spy.mockRestore();
  });

  it("returns the stored palette name when present", () => {
    persistPalette("protanopia");
    expect(activatePaletteFromStorage()).toBe("protanopia");
  });

  it("applies stored palette to document.documentElement", () => {
    persistPalette("deuteranopia");
    activatePaletteFromStorage();
    // After activation, documentElement should have data-palette="deuteranopia"
    expect(document.documentElement.getAttribute("data-palette")).toBe("deuteranopia");
  });
});
