/**
 * Browser-mode tests for CSS Anchor Positioning feature detection.  (G17 / H1)
 *
 * These tests run in real Chromium via @vitest/browser + Playwright.
 * They verify behaviour that differs between happy-dom and a real browser.
 */
import { describe, it, expect } from "vitest";
import { cssAnchorPositioningSupported, createAnchorTooltip } from "../../src/ui/anchor-tooltip";

describe("cssAnchorPositioningSupported (real browser)", () => {
  it("returns a boolean", () => {
    const result = cssAnchorPositioningSupported();
    expect(typeof result).toBe("boolean");
  });

  it("CSS.supports is available in a real browser", () => {
    expect(typeof CSS).toBe("object");
    expect(typeof CSS.supports).toBe("function");
  });

  it("anchor-name support matches CSS.supports result directly", () => {
    const expected = CSS.supports("anchor-name", "--test");
    expect(cssAnchorPositioningSupported()).toBe(expected);
  });
});

describe("createAnchorTooltip (real browser DOM)", () => {
  it("correctly sets anchor-name as an inline style when native is true", () => {
    if (!cssAnchorPositioningSupported()) return; // skip on non-native browsers

    const anchor = document.createElement("div");
    const tooltip = document.createElement("div");
    document.body.append(anchor, tooltip);

    const ap = createAnchorTooltip(anchor, tooltip, "--chart-crosshair");
    expect(anchor.style.getPropertyValue("anchor-name")).toBe("--chart-crosshair");
    expect(tooltip.style.getPropertyValue("position-anchor")).toBe("--chart-crosshair");

    ap.destroy();
    anchor.remove();
    tooltip.remove();
  });

  it("update() positions tooltip via style.left/top in fallback path", () => {
    // Force fallback by temporarily stubbing CSS.supports to return false
    const origSupports = CSS.supports.bind(CSS);

    (CSS as any).supports = (): boolean => false;

    const anchor = document.createElement("div");
    const tooltip = document.createElement("div");
    document.body.append(anchor, tooltip);

    const ap = createAnchorTooltip(anchor, tooltip);
    ap.update(100, 50);

    expect(tooltip.style.left).toBe("100px");
    expect(tooltip.style.top).toBe("50px");

    ap.destroy();
    anchor.remove();
    tooltip.remove();
    // Restore

    (CSS as any).supports = origSupports;
  });
});
