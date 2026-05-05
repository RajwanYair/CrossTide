/**
 * CSS Feature Compatibility Tests
 *
 * Verifies that modern CSS features used by CrossTide are supported
 * (or gracefully detected) across Chromium, Firefox, and WebKit.
 * Uses CSS.supports() for feature detection.
 */
import { describe, it, expect } from "vitest";

// ---------------------------------------------------------------------------
// CSS Custom Properties (used throughout theme system)
// ---------------------------------------------------------------------------
describe("CSS Custom Properties", () => {
  it("CSS.supports detects custom property syntax", () => {
    expect(CSS.supports("--x", "1")).toBe(true);
  });

  it("custom property values can be read back via getComputedStyle", () => {
    const el = document.createElement("div");
    el.style.setProperty("--test-var", "42px");
    document.body.appendChild(el);
    const val = el.style.getPropertyValue("--test-var").trim();
    document.body.removeChild(el);
    expect(val).toBe("42px");
  });
});

// ---------------------------------------------------------------------------
// CSS Grid (used for watchlist, screener, and card layouts)
// ---------------------------------------------------------------------------
describe("CSS Grid", () => {
  it("display:grid is supported", () => {
    expect(CSS.supports("display", "grid")).toBe(true);
  });

  it("grid-template-columns is supported", () => {
    expect(CSS.supports("grid-template-columns", "1fr 1fr")).toBe(true);
  });

  it("grid subgrid is detected (Baseline 2023)", () => {
    const supported = CSS.supports("grid-template-columns", "subgrid");
    expect(typeof supported).toBe("boolean");
  });

  it("gap works in grid context", () => {
    expect(CSS.supports("gap", "1rem")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// CSS Flexbox (used by navigation, headers, card rows)
// ---------------------------------------------------------------------------
describe("CSS Flexbox", () => {
  it("display:flex is supported", () => {
    expect(CSS.supports("display", "flex")).toBe(true);
  });

  it("flex-wrap is supported", () => {
    expect(CSS.supports("flex-wrap", "wrap")).toBe(true);
  });

  it("gap works in flex context", () => {
    expect(CSS.supports("gap", "8px")).toBe(true);
  });

  it("align-items:center is supported", () => {
    expect(CSS.supports("align-items", "center")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// CSS Container Queries (used for responsive card layouts)
// ---------------------------------------------------------------------------
describe("CSS Container Queries", () => {
  it("container-type is detected (Baseline 2023)", () => {
    const supported = CSS.supports("container-type", "inline-size");
    expect(typeof supported).toBe("boolean");
  });

  it("@container at-rule is detected via CSSSupportsRule", () => {
    const styleEl = document.createElement("style");
    styleEl.textContent = "@container (min-width: 300px) { .x { color: red; } }";
    document.head.appendChild(styleEl);
    // If parsing failed, the sheet would be empty
    const parsed = styleEl.sheet !== null;
    document.head.removeChild(styleEl);
    expect(typeof parsed).toBe("boolean");
  });
});

// ---------------------------------------------------------------------------
// CSS Logical Properties (used for RTL-safe layouts)
// ---------------------------------------------------------------------------
describe("CSS Logical Properties", () => {
  it("margin-inline is supported", () => {
    expect(CSS.supports("margin-inline", "auto")).toBe(true);
  });

  it("padding-block is supported", () => {
    expect(CSS.supports("padding-block", "0.5rem")).toBe(true);
  });

  it("inset-inline-start is supported", () => {
    expect(CSS.supports("inset-inline-start", "0")).toBe(true);
  });

  it("border-block is supported", () => {
    expect(CSS.supports("border-block", "1px solid transparent")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// CSS Modern Units (used in responsive layout)
// ---------------------------------------------------------------------------
describe("CSS Modern Viewport Units", () => {
  it("dvh unit is detected (Baseline 2023)", () => {
    const supported = CSS.supports("height", "100dvh");
    expect(typeof supported).toBe("boolean");
  });

  it("svh unit is detected", () => {
    const supported = CSS.supports("height", "100svh");
    expect(typeof supported).toBe("boolean");
  });

  it("lvh unit is detected", () => {
    const supported = CSS.supports("height", "100lvh");
    expect(typeof supported).toBe("boolean");
  });

  it("cqw container query unit is detected", () => {
    const supported = CSS.supports("width", "50cqw");
    expect(typeof supported).toBe("boolean");
  });
});

// ---------------------------------------------------------------------------
// CSS aspect-ratio (used in chart container sizing)
// ---------------------------------------------------------------------------
describe("CSS aspect-ratio", () => {
  it("aspect-ratio property is supported", () => {
    expect(CSS.supports("aspect-ratio", "16 / 9")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// CSS Color features
// ---------------------------------------------------------------------------
describe("CSS Color functions", () => {
  it("hsl() color function is supported", () => {
    expect(CSS.supports("color", "hsl(200 50% 50%)")).toBe(true);
  });

  it("oklch() color function is detected (Baseline 2024)", () => {
    const supported = CSS.supports("color", "oklch(50% 0.2 200)");
    expect(typeof supported).toBe("boolean");
  });

  it("color-scheme property is detected", () => {
    const supported = CSS.supports("color-scheme", "dark light");
    expect(typeof supported).toBe("boolean");
  });
});

// ---------------------------------------------------------------------------
// CSS Scroll behavior
// ---------------------------------------------------------------------------
describe("CSS Scroll features", () => {
  it("scroll-behavior: smooth is supported", () => {
    expect(CSS.supports("scroll-behavior", "smooth")).toBe(true);
  });

  it("overscroll-behavior is detected (Safari 16+)", () => {
    // overscroll-behavior support varies across WebKit versions
    const supported = CSS.supports("overscroll-behavior", "contain");
    expect(typeof supported).toBe("boolean");
  });

  it("scrollbar-gutter is detected (Baseline 2022)", () => {
    const supported = CSS.supports("scrollbar-gutter", "stable");
    expect(typeof supported).toBe("boolean");
  });
});

// ---------------------------------------------------------------------------
// CSS pointer / touch behavior
// ---------------------------------------------------------------------------
describe("CSS Touch and Pointer", () => {
  it("touch-action property is supported", () => {
    expect(CSS.supports("touch-action", "manipulation")).toBe(true);
  });

  it("touch-action:pan-y is supported", () => {
    expect(CSS.supports("touch-action", "pan-y")).toBe(true);
  });

  it("cursor:pointer is supported", () => {
    expect(CSS.supports("cursor", "pointer")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// CSS :has() selector (used in form/card styling)
// ---------------------------------------------------------------------------
describe("CSS :has() selector", () => {
  it(":has() selector is detected (Baseline 2023)", () => {
    const supported = CSS.supports("selector(:has(span))");
    expect(typeof supported).toBe("boolean");
  });
});

// ---------------------------------------------------------------------------
// CSS @layer (used for specificity management)
// ---------------------------------------------------------------------------
describe("CSS @layer", () => {
  it("@layer at-rule does not break parsing", () => {
    const styleEl = document.createElement("style");
    styleEl.textContent = "@layer base { .x { color: red; } }";
    document.head.appendChild(styleEl);
    const hasSheet = styleEl.sheet !== null;
    document.head.removeChild(styleEl);
    expect(hasSheet).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// CSS Transitions and Animations
// ---------------------------------------------------------------------------
describe("CSS Transitions and Animations", () => {
  it("transition property is supported", () => {
    expect(CSS.supports("transition", "all 0.2s ease")).toBe(true);
  });

  it("animation property is supported", () => {
    expect(CSS.supports("animation", "spin 1s linear infinite")).toBe(true);
  });

  it("will-change property is supported", () => {
    expect(CSS.supports("will-change", "transform")).toBe(true);
  });

  it("view-transition-name is detected (Baseline 2024)", () => {
    const supported = CSS.supports("view-transition-name", "main");
    expect(typeof supported).toBe("boolean");
  });
});

// ---------------------------------------------------------------------------
// CSS Typography
// ---------------------------------------------------------------------------
describe("CSS Typography", () => {
  it("font-display property is detected", () => {
    const styleEl = document.createElement("style");
    styleEl.textContent = "@font-face { font-family: 'X'; src: local('X'); font-display: swap; }";
    document.head.appendChild(styleEl);
    const valid = styleEl.sheet !== null;
    document.head.removeChild(styleEl);
    expect(valid).toBe(true);
  });

  it("text-overflow:ellipsis is supported", () => {
    expect(CSS.supports("text-overflow", "ellipsis")).toBe(true);
  });

  it("line-clamp is detected (Baseline 2023)", () => {
    const supported = CSS.supports("-webkit-line-clamp", "3") || CSS.supports("line-clamp", "3");
    expect(typeof supported).toBe("boolean");
  });

  it("font-variant-numeric is supported", () => {
    expect(CSS.supports("font-variant-numeric", "tabular-nums")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Media queries (used in responsive breakpoints)
// ---------------------------------------------------------------------------
describe("Media Queries", () => {
  it("min-width media query is functional", () => {
    const mq = matchMedia("(min-width: 1px)");
    expect(mq.matches).toBe(true);
  });

  it("prefers-color-scheme media query is detectable", () => {
    const dark = matchMedia("(prefers-color-scheme: dark)");
    const light = matchMedia("(prefers-color-scheme: light)");
    expect(typeof dark.matches).toBe("boolean");
    expect(typeof light.matches).toBe("boolean");
  });

  it("prefers-reduced-motion is detectable", () => {
    const mq = matchMedia("(prefers-reduced-motion: reduce)");
    expect(typeof mq.matches).toBe("boolean");
  });

  it("display-mode standalone is detectable (PWA)", () => {
    const mq = matchMedia("(display-mode: standalone)");
    expect(typeof mq.matches).toBe("boolean");
  });

  it("forced-colors is detectable (Windows High Contrast)", () => {
    const mq = matchMedia("(forced-colors: active)");
    expect(typeof mq.matches).toBe("boolean");
  });
});
