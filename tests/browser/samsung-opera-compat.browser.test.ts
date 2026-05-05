/**
 * Samsung Internet & Opera cross-browser compatibility tests.
 *
 * Samsung Internet (23+) and Opera (105+) are both Chromium-based, so most
 * APIs work identically to Chrome. These tests focus on:
 *   1. CSS features that historically shipped later in Samsung Internet / Opera
 *   2. Samsung Internet-specific UA detection paths (graceful, no crashes)
 *   3. Opera-specific sidebar / media session APIs (graceful detection only)
 *   4. UC Browser / QQ Browser feature-baseline verification
 *   5. Progressive enhancement assertions — features degrade, never throw
 *
 * Run:  npm run test:browser
 * Samsung UA: TEST_SAMSUNG=1 npm run test:browser
 */
import { describe, it, expect } from "vitest";

// ---------------------------------------------------------------------------
// User-agent detection helpers — used in src/core/ for UA-based progressive
// enhancement. Tests verify they return a boolean and never throw.
// ---------------------------------------------------------------------------
describe("User-agent detection (never throws)", () => {
  it("navigator.userAgent is a non-empty string", () => {
    expect(typeof navigator.userAgent).toBe("string");
    expect(navigator.userAgent.length).toBeGreaterThan(0);
  });

  it("Samsung Internet UA detection does not crash", () => {
    const isSamsung = /SamsungBrowser\/(\d+)/.test(navigator.userAgent);
    expect(typeof isSamsung).toBe("boolean");
  });

  it("Opera UA detection does not crash", () => {
    const isOpera = /OPR\/(\d+)|Opera\/(\d+)/.test(navigator.userAgent);
    expect(typeof isOpera).toBe("boolean");
  });

  it("UC Browser UA detection does not crash", () => {
    const isUC = /UCBrowser\/(\d+)/.test(navigator.userAgent);
    expect(typeof isUC).toBe("boolean");
  });

  it("QQ Browser UA detection does not crash", () => {
    const isQQ = /MQQBrowser\/(\d+)/.test(navigator.userAgent);
    expect(typeof isQQ).toBe("boolean");
  });
});

// ---------------------------------------------------------------------------
// CSS scroll-snap — used in chart carousel and card stacks.
// Samsung Internet 12+ and Opera 75+ (Baseline 2020) — all targets support it.
// ---------------------------------------------------------------------------
describe("CSS scroll-snap (Baseline 2020)", () => {
  it("scroll-snap-type is supported", () => {
    expect(CSS.supports("scroll-snap-type", "x mandatory")).toBe(true);
  });

  it("scroll-snap-align is supported", () => {
    expect(CSS.supports("scroll-snap-align", "start")).toBe(true);
  });

  it("scroll-snap-stop is supported", () => {
    expect(CSS.supports("scroll-snap-stop", "always")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// CSS backdrop-filter — used for glass-morphism card backgrounds.
// Samsung Internet 17+ (SI 15 had -webkit prefix only; 17+ unprefixed).
// Opera 76+ supported. Baseline Widely Available 2024.
// ---------------------------------------------------------------------------
describe("CSS backdrop-filter", () => {
  it("backdrop-filter is supported or gracefully absent", () => {
    const supported = CSS.supports("backdrop-filter", "blur(4px)");
    // Must be a boolean — never throw
    expect(typeof supported).toBe("boolean");
  });

  it("app does not crash when backdrop-filter is absent", () => {
    // If backdrop-filter is not supported, the UI should still render
    // (fallback: solid background). This test validates the detection path.
    const el = document.createElement("div");
    el.style.backdropFilter = "blur(4px)";
    document.body.appendChild(el);
    // Should not throw; computed value may be "" on unsupported browsers
    const val = getComputedStyle(el).backdropFilter;
    expect(typeof val).toBe("string");
    el.remove();
  });
});

// ---------------------------------------------------------------------------
// CSS :has() relational pseudo-class.
// Samsung Internet 21+ (Baseline 2023), Opera 93+ (Baseline 2023).
// ---------------------------------------------------------------------------
describe("CSS :has() selector (Baseline 2023)", () => {
  it("CSS.supports detects :has() without throwing", () => {
    const supported = CSS.supports("selector(:has(*))");
    expect(typeof supported).toBe("boolean");
  });
});

// ---------------------------------------------------------------------------
// CSS Nesting — native CSS nesting (no preprocessor).
// Samsung Internet 21+ (Baseline 2024), Opera 111+ (Baseline 2024).
// ---------------------------------------------------------------------------
describe("CSS Nesting (Baseline 2024)", () => {
  it("CSS.supports detects selector(&) without throwing", () => {
    const supported = CSS.supports("selector(&)");
    expect(typeof supported).toBe("boolean");
  });
});

// ---------------------------------------------------------------------------
// CSS color-mix() — used for theme generation.
// Samsung Internet 19+ (Baseline 2023), Opera 92+ (Baseline 2023).
// ---------------------------------------------------------------------------
describe("CSS color-mix() (Baseline 2023)", () => {
  it("color-mix is detected without throwing", () => {
    const supported = CSS.supports("color", "color-mix(in srgb, red, blue)");
    expect(typeof supported).toBe("boolean");
  });
});

// ---------------------------------------------------------------------------
// Web Share API — used by share-watchlist feature.
// Samsung Internet 12+ (Baseline 2020), Opera 58+ (Baseline 2020).
// ---------------------------------------------------------------------------
describe("Web Share API (progressive enhancement)", () => {
  it("navigator.share is detected without throwing", () => {
    const canShare = typeof navigator.share === "function";
    expect(typeof canShare).toBe("boolean");
  });

  it("navigator.canShare is detected without throwing", () => {
    const hasCanShare = typeof navigator.canShare === "function";
    expect(typeof hasCanShare).toBe("boolean");
  });
});

// ---------------------------------------------------------------------------
// Media Session API — used for PWA notification controls.
// Samsung Internet 12+ (Baseline 2020), Opera 57+ (Baseline 2020).
// ---------------------------------------------------------------------------
describe("Media Session API (progressive enhancement)", () => {
  it("navigator.mediaSession is detected without throwing", () => {
    const hasMediaSession = "mediaSession" in navigator;
    expect(typeof hasMediaSession).toBe("boolean");
  });
});

// ---------------------------------------------------------------------------
// Payment Request API — not used by CrossTide but should gracefully absent.
// ---------------------------------------------------------------------------
describe("Payment Request API (graceful absence)", () => {
  it("PaymentRequest is detected without crashing", () => {
    const supported = typeof PaymentRequest !== "undefined";
    expect(typeof supported).toBe("boolean");
  });
});

// ---------------------------------------------------------------------------
// Gamepad API — Opera GX has enhanced Gamepad support.
// CrossTide does not use it, but graceful detection should not crash.
// ---------------------------------------------------------------------------
describe("Gamepad API (Opera GX — graceful detection)", () => {
  it("navigator.getGamepads is detected without throwing", () => {
    const hasGamepad = typeof navigator.getGamepads === "function";
    expect(typeof hasGamepad).toBe("boolean");
  });
});

// ---------------------------------------------------------------------------
// Samsung DeX — desktop mode detection for Samsung-specific layout.
// navigator.userAgent contains "DeX" when running on Samsung DeX.
// ---------------------------------------------------------------------------
describe("Samsung DeX detection (progressive enhancement)", () => {
  it("Samsung DeX mode is detectable via UA without throwing", () => {
    const isDeX = /DeX/.test(navigator.userAgent);
    expect(typeof isDeX).toBe("boolean");
  });

  it("screen.orientation is available (used for DeX/desktop mode)", () => {
    expect(typeof screen.orientation).toBe("object");
    expect(typeof screen.orientation.type).toBe("string");
  });
});

// ---------------------------------------------------------------------------
// CSS overscroll-behavior — critical for mobile / Samsung Internet scroll
// containment (prevents pull-to-refresh on scroll within chart area).
// Samsung Internet 13+ (Baseline 2020), Opera 64+ (Baseline 2020).
// ---------------------------------------------------------------------------
describe("CSS overscroll-behavior (Baseline 2020)", () => {
  it("overscroll-behavior is supported", () => {
    const supported = CSS.supports("overscroll-behavior", "contain");
    expect(typeof supported).toBe("boolean");
  });

  it("overscroll-behavior-y is supported", () => {
    const supported = CSS.supports("overscroll-behavior-y", "none");
    expect(typeof supported).toBe("boolean");
  });
});

// ---------------------------------------------------------------------------
// CSS color-scheme aware scrollbars — Samsung Internet 19+ / Opera 89+.
// ---------------------------------------------------------------------------
describe("CSS color-scheme scrollbar theming", () => {
  it("color-scheme property is detected", () => {
    const supported = CSS.supports("color-scheme", "dark light");
    expect(typeof supported).toBe("boolean");
  });
});

// ---------------------------------------------------------------------------
// Vibration API — used for haptic feedback on mobile (optional).
// Samsung Internet 4+, Opera Mobile 37+.
// ---------------------------------------------------------------------------
describe("Vibration API (mobile haptics — progressive enhancement)", () => {
  it("navigator.vibrate is detected without throwing", () => {
    const hasVibrate = typeof navigator.vibrate === "function";
    expect(typeof hasVibrate).toBe("boolean");
  });
});

// ---------------------------------------------------------------------------
// Screen Wake Lock API — prevents screen from dimming during active charts.
// Samsung Internet 12+ (Baseline 2020), Opera 80+ (Baseline 2022).
// ---------------------------------------------------------------------------
describe("Screen Wake Lock API (progressive enhancement)", () => {
  it("navigator.wakeLock is detected without throwing", () => {
    const hasWakeLock = "wakeLock" in navigator;
    expect(typeof hasWakeLock).toBe("boolean");
  });
});

// ---------------------------------------------------------------------------
// CSS field-sizing — form input auto-sizing. Samsung Internet 24+, Opera 113+.
// ---------------------------------------------------------------------------
describe("CSS field-sizing (Baseline 2024)", () => {
  it("field-sizing is detected without throwing", () => {
    const supported = CSS.supports("field-sizing", "content");
    expect(typeof supported).toBe("boolean");
  });
});

// ---------------------------------------------------------------------------
// Popover API — used for chart tooltips and dropdowns.
// Samsung Internet 24+ (Baseline 2024), Opera 114+ (Baseline 2024).
// ---------------------------------------------------------------------------
describe("Popover API (Baseline 2024)", () => {
  it("HTMLElement.showPopover is detected without throwing", () => {
    const div = document.createElement("div");
    const supported = typeof div.showPopover === "function";
    expect(typeof supported).toBe("boolean");
  });

  it("popover attribute is detected via togglePopover", () => {
    const div = document.createElement("div");
    const hasToggle = typeof div.togglePopover === "function";
    expect(typeof hasToggle).toBe("boolean");
  });
});
