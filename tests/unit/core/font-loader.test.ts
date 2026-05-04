/**
 * Tests for G16 — Font loading helpers.
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import {
  fontLoadingSupported,
  isFontLoaded,
  waitForFont,
  preloadFont,
  observeFontLoad,
} from "../../../src/core/font-loader";

// ─── helpers ─────────────────────────────────────────────────────────────────

/** Stub document.fonts with a fake FontFaceSet. */
function stubFonts(
  overrides: Partial<{
    check: () => boolean;
    load: () => Promise<FontFace[]>;
    add: (f: FontFace) => void;
    addEventListener: (ev: string, h: EventListenerOrEventListenerObject) => void;
    removeEventListener: (ev: string, h: EventListenerOrEventListenerObject) => void;
  }>,
): () => void {
  const orig = Object.getOwnPropertyDescriptor(document, "fonts");
  Object.defineProperty(document, "fonts", {
    configurable: true,
    value: {
      check: vi.fn(() => false),
      load: vi.fn(() => Promise.resolve([])),
      add: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      ...overrides,
    },
  });
  return () => {
    if (orig) {
      Object.defineProperty(document, "fonts", orig);
    }
  };
}

/** Stub the FontFace constructor as a proper class. */
function stubFontFace(): () => void {
  const orig = globalThis.FontFace;
  class MockFontFace {
    load = vi.fn().mockResolvedValue(this);
  }
  globalThis.FontFace = MockFontFace as unknown as typeof FontFace;
  return () => {
    globalThis.FontFace = orig;
  };
}

// ─── fontLoadingSupported ─────────────────────────────────────────────────────

describe("fontLoadingSupported", () => {
  it("returns true when document.fonts and FontFace are available", () => {
    // happy-dom should have document.fonts
    if (typeof document.fonts !== "undefined" && typeof FontFace !== "undefined") {
      expect(fontLoadingSupported()).toBe(true);
    }
  });

  it("returns false when document.fonts is missing", () => {
    const orig = Object.getOwnPropertyDescriptor(document, "fonts");
    Object.defineProperty(document, "fonts", { configurable: true, value: undefined });
    expect(fontLoadingSupported()).toBe(false);
    if (orig) Object.defineProperty(document, "fonts", orig);
  });
});

// ─── isFontLoaded ─────────────────────────────────────────────────────────────

describe("isFontLoaded", () => {
  afterEach(() => vi.restoreAllMocks());

  it("returns false when fonts.check returns false", () => {
    const restore = stubFonts({ check: () => false });
    expect(isFontLoaded("Inter Variable")).toBe(false);
    restore();
  });

  it("returns true when fonts.check returns true", () => {
    const restore = stubFonts({ check: () => true });
    expect(isFontLoaded("Inter Variable")).toBe(true);
    restore();
  });

  it("uses the provided size in the check call", () => {
    const checkFn = vi.fn(() => true);
    const restore = stubFonts({ check: checkFn });
    isFontLoaded("Inter Variable", "16px");
    expect(checkFn).toHaveBeenCalledWith('16px "Inter Variable"');
    restore();
  });

  it("returns false when check throws", () => {
    const restore = stubFonts({
      check: () => {
        throw new Error("unsupported");
      },
    });
    expect(isFontLoaded("Inter Variable")).toBe(false);
    restore();
  });
});

// ─── waitForFont ──────────────────────────────────────────────────────────────

describe("waitForFont", () => {
  it("resolves true when font loads before timeout", async () => {
    const restore = stubFonts({
      load: () => Promise.resolve([]),
    });
    const result = await waitForFont("Inter Variable", 1000);
    expect(result).toBe(true);
    restore();
  });

  it("resolves false when fontLoadingSupported returns false", async () => {
    const origFonts = Object.getOwnPropertyDescriptor(document, "fonts");
    Object.defineProperty(document, "fonts", { configurable: true, value: undefined });
    const result = await waitForFont("Inter Variable", 100);
    expect(result).toBe(false);
    if (origFonts) Object.defineProperty(document, "fonts", origFonts);
  });
});

// ─── preloadFont ──────────────────────────────────────────────────────────────

describe("preloadFont", () => {
  it("returns null when fontLoadingSupported is false", async () => {
    const origFonts = Object.getOwnPropertyDescriptor(document, "fonts");
    const origFF = globalThis.FontFace;
    Object.defineProperty(document, "fonts", { configurable: true, value: undefined });
    const result = await preloadFont("/fonts/inter.woff2", "Inter Variable");
    expect(result).toBeNull();
    if (origFonts) Object.defineProperty(document, "fonts", origFonts);
    globalThis.FontFace = origFF;
  });

  it("calls document.fonts.add with the loaded face", async () => {
    const addFn = vi.fn();
    const restoreFonts = stubFonts({ add: addFn });
    const restoreFF = stubFontFace();

    await preloadFont("/fonts/inter.woff2", "Inter Variable");
    expect(addFn).toHaveBeenCalledTimes(1);

    restoreFonts();
    restoreFF();
  });
});

// ─── observeFontLoad ──────────────────────────────────────────────────────────

describe("observeFontLoad", () => {
  it("calls callback(false) immediately when unsupported", () => {
    const origFonts = Object.getOwnPropertyDescriptor(document, "fonts");
    Object.defineProperty(document, "fonts", { configurable: true, value: undefined });
    const cb = vi.fn();
    observeFontLoad(cb);
    expect(cb).toHaveBeenCalledWith(false);
    if (origFonts) Object.defineProperty(document, "fonts", origFonts);
  });

  it("registers loadingdone event listener", () => {
    const addFn = vi.fn();
    const restore = stubFonts({ addEventListener: addFn });
    observeFontLoad(vi.fn());
    expect(addFn).toHaveBeenCalledWith("loadingdone", expect.any(Function));
    restore();
  });

  it("cleanup removes the listener", () => {
    const removeFn = vi.fn();
    const restore = stubFonts({ removeEventListener: removeFn });
    const cleanup = observeFontLoad(vi.fn());
    cleanup();
    expect(removeFn).toHaveBeenCalledWith("loadingdone", expect.any(Function));
    restore();
  });
});
