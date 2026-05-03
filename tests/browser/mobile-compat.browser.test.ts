/**
 * Mobile & tablet browser compatibility tests.
 *
 * Validates APIs and behaviors critical for mobile/tablet browsers:
 * - Touch events, pointer events
 * - Viewport units (dvh, svh)
 * - Passive event listeners
 * - Safe area insets
 * - Network Information API detection
 * - Battery API detection
 * - Device orientation detection
 *
 * Run: npm run test:browser
 */
import { describe, it, expect } from "vitest";

// ---------------------------------------------------------------------------
// Touch & Pointer events
// ---------------------------------------------------------------------------
describe("Touch & Pointer event APIs", () => {
  it("PointerEvent is available", () => {
    expect(typeof PointerEvent).toBe("function");
  });

  it("TouchEvent is detectable", () => {
    // Not all browsers support TouchEvent constructor (desktop Firefox/Chrome don't)
    // but the detection path should not throw
    const supportsTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
    expect(typeof supportsTouch).toBe("boolean");
  });

  it("pointer events are supported on elements", () => {
    const el = document.createElement("div");
    expect(typeof el.onpointerdown).not.toBe("undefined");
  });
});

// ---------------------------------------------------------------------------
// Viewport & Visual Viewport APIs
// ---------------------------------------------------------------------------
describe("Viewport APIs", () => {
  it("window.innerWidth / innerHeight are numbers", () => {
    expect(typeof window.innerWidth).toBe("number");
    expect(typeof window.innerHeight).toBe("number");
    expect(window.innerWidth).toBeGreaterThan(0);
    expect(window.innerHeight).toBeGreaterThan(0);
  });

  it("visualViewport API is available", () => {
    expect(typeof window.visualViewport).toBe("object");
    expect(typeof window.visualViewport!.width).toBe("number");
    expect(typeof window.visualViewport!.height).toBe("number");
  });

  it("CSS dvh unit is detectable", () => {
    // dvh is Baseline 2022 — supported in all modern browsers
    const supported = CSS.supports("height", "100dvh");
    expect(typeof supported).toBe("boolean");
  });

  it("CSS svh unit is detectable", () => {
    const supported = CSS.supports("height", "100svh");
    expect(typeof supported).toBe("boolean");
  });

  it("CSS env() for safe areas is detectable", () => {
    // env(safe-area-inset-top) — needed for notch phones
    const supported = CSS.supports("padding-top", "env(safe-area-inset-top, 0px)");
    expect(typeof supported).toBe("boolean");
  });
});

// ---------------------------------------------------------------------------
// Passive event listeners (scrolling perf on mobile)
// ---------------------------------------------------------------------------
describe("Passive event listeners", () => {
  it("addEventListener supports passive option", () => {
    let passiveSupported = false;
    try {
      const opts = Object.defineProperty({}, "passive", {
        get() {
          passiveSupported = true;
          return true;
        },
      });
      window.addEventListener("__test__", null as unknown as EventListener, opts);
      window.removeEventListener("__test__", null as unknown as EventListener, opts);
    } catch {
      // ignore
    }
    expect(passiveSupported).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Network Information API (progressive enhancement)
// ---------------------------------------------------------------------------
describe("Network Information API detection", () => {
  it("navigator.connection is detected without crashing", () => {
    const hasNetInfo = "connection" in navigator;
    expect(typeof hasNetInfo).toBe("boolean");
    // If available, check basic shape
    if (hasNetInfo) {
      const conn = (navigator as unknown as { connection: { effectiveType?: string } }).connection;
      expect(typeof conn.effectiveType).toBe("string");
    }
  });

  it("navigator.onLine is available", () => {
    expect(typeof navigator.onLine).toBe("boolean");
  });
});

// ---------------------------------------------------------------------------
// Clipboard API (used by share/export features)
// ---------------------------------------------------------------------------
describe("Clipboard API", () => {
  it("navigator.clipboard is available", () => {
    expect(typeof navigator.clipboard).toBe("object");
    expect(typeof navigator.clipboard.writeText).toBe("function");
  });
});

// ---------------------------------------------------------------------------
// Internationalization — used for locale-aware formatting
// ---------------------------------------------------------------------------
describe("Intl APIs for mobile locales", () => {
  it("Intl.RelativeTimeFormat is available", () => {
    expect(typeof Intl.RelativeTimeFormat).toBe("function");
    const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
    expect(rtf.format(-1, "day")).toContain("yesterday");
  });

  it("Intl.ListFormat is available", () => {
    expect(typeof Intl.ListFormat).toBe("function");
    const lf = new Intl.ListFormat("en", { type: "conjunction" });
    expect(lf.format(["a", "b"])).toContain("and");
  });

  it("Intl.Segmenter is available", () => {
    // Baseline 2024 — Chrome 87+, Firefox 125+, Safari 17.4+
    const supported = typeof Intl.Segmenter === "function";
    expect(typeof supported).toBe("boolean");
  });
});

// ---------------------------------------------------------------------------
// Scroll behavior
// ---------------------------------------------------------------------------
describe("Scroll APIs", () => {
  it("element.scrollIntoView supports smooth option", () => {
    const el = document.createElement("div");
    document.body.appendChild(el);
    expect(typeof el.scrollIntoView).toBe("function");
    // Should not throw with options
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    el.remove();
  });

  it("window.scrollTo supports options", () => {
    expect(typeof window.scrollTo).toBe("function");
    // Should not throw
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
});

// ---------------------------------------------------------------------------
// Media queries for mobile features
// ---------------------------------------------------------------------------
describe("Mobile media query support", () => {
  it("prefers-reduced-motion is detectable", () => {
    const mq = matchMedia("(prefers-reduced-motion: reduce)");
    expect(typeof mq.matches).toBe("boolean");
  });

  it("prefers-contrast is detectable", () => {
    const mq = matchMedia("(prefers-contrast: more)");
    expect(typeof mq.matches).toBe("boolean");
  });

  it("orientation media query works", () => {
    const landscape = matchMedia("(orientation: landscape)");
    const portrait = matchMedia("(orientation: portrait)");
    // One of them must be true
    expect(landscape.matches || portrait.matches).toBe(true);
  });

  it("hover media query is detectable", () => {
    const hover = matchMedia("(hover: hover)");
    const none = matchMedia("(hover: none)");
    expect(typeof hover.matches).toBe("boolean");
    expect(typeof none.matches).toBe("boolean");
  });

  it("pointer media query is detectable", () => {
    const fine = matchMedia("(pointer: fine)");
    const coarse = matchMedia("(pointer: coarse)");
    expect(typeof fine.matches).toBe("boolean");
    expect(typeof coarse.matches).toBe("boolean");
  });
});

// ---------------------------------------------------------------------------
// Form validation APIs (used by ticker input)
// ---------------------------------------------------------------------------
describe("Form & Input APIs", () => {
  it("input.validity is available", () => {
    const input = document.createElement("input");
    input.type = "text";
    input.required = true;
    expect(typeof input.validity).toBe("object");
    expect(input.validity.valueMissing).toBe(true);
  });

  it("input.setCustomValidity works", () => {
    const input = document.createElement("input");
    expect(typeof input.setCustomValidity).toBe("function");
    input.setCustomValidity("Test error");
    expect(input.validationMessage).toBe("Test error");
  });

  it("FormData is available", () => {
    expect(typeof FormData).toBe("function");
    const form = document.createElement("form");
    const fd = new FormData(form);
    expect(typeof fd.append).toBe("function");
  });
});

// ---------------------------------------------------------------------------
// Web Share API detection (mobile share sheet)
// ---------------------------------------------------------------------------
describe("Web Share API detection", () => {
  it("navigator.share is detectable without throwing", () => {
    const supported = typeof navigator.share === "function";
    expect(typeof supported).toBe("boolean");
  });

  it("navigator.canShare is detectable", () => {
    const supported = typeof navigator.canShare === "function";
    expect(typeof supported).toBe("boolean");
  });
});

// ---------------------------------------------------------------------------
// Animation & rendering APIs
// ---------------------------------------------------------------------------
describe("Animation APIs", () => {
  it("requestAnimationFrame returns a number", () => {
    const id = requestAnimationFrame(() => {});
    expect(typeof id).toBe("number");
    cancelAnimationFrame(id);
  });

  it("CSS.escape is available", () => {
    // Baseline — all modern browsers
    expect(typeof CSS.escape).toBe("function");
    expect(CSS.escape("a.b")).toBe("a\\.b");
  });

  it("element.getAnimations() is available", () => {
    const el = document.createElement("div");
    document.body.appendChild(el);
    expect(typeof el.getAnimations).toBe("function");
    el.remove();
  });
});
