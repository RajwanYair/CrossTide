/**
 * Unit tests for the CSS Anchor Positioning tooltip helper (H1).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { cssAnchorPositioningSupported, createAnchorTooltip } from "../../../src/ui/anchor-tooltip";
import type { AnchorTooltip } from "../../../src/ui/anchor-tooltip";

// ── Helpers ───────────────────────────────────────────────────────────────

function makeEl(): HTMLElement {
  const el = document.createElement("div");
  document.body.appendChild(el);
  return el;
}

function cleanup(...els: HTMLElement[]): void {
  for (const el of els) el.remove();
}

// ── cssAnchorPositioningSupported ─────────────────────────────────────────

describe("cssAnchorPositioningSupported", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns false when CSS.supports is not available", () => {
    vi.stubGlobal("CSS", undefined);
    expect(cssAnchorPositioningSupported()).toBe(false);
    vi.unstubAllGlobals();
  });

  it("returns false when CSS.supports reports anchor-name as unsupported", () => {
    vi.stubGlobal("CSS", { supports: vi.fn().mockReturnValue(false) });
    expect(cssAnchorPositioningSupported()).toBe(false);
    vi.unstubAllGlobals();
  });

  it("returns true when CSS.supports reports anchor-name as supported", () => {
    vi.stubGlobal("CSS", { supports: vi.fn().mockReturnValue(true) });
    expect(cssAnchorPositioningSupported()).toBe(true);
    vi.unstubAllGlobals();
  });
});

// ── createAnchorTooltip (native path) ────────────────────────────────────

describe("createAnchorTooltip — native CSS path", () => {
  let anchor: HTMLElement;
  let tooltip: HTMLElement;
  let ap: AnchorTooltip;

  beforeEach(() => {
    vi.stubGlobal("CSS", { supports: vi.fn().mockReturnValue(true) });
    anchor = makeEl();
    tooltip = makeEl();
    ap = createAnchorTooltip(anchor, tooltip, "--test-anchor");
  });

  afterEach(() => {
    ap.destroy();
    cleanup(anchor, tooltip);
    vi.unstubAllGlobals();
  });

  it("reports native=true", () => {
    expect(ap.native).toBe(true);
  });

  it("sets anchor-name on the anchor element", () => {
    expect(anchor.style.getPropertyValue("anchor-name")).toBe("--test-anchor");
  });

  it("sets position-anchor on the tooltip element", () => {
    expect(tooltip.style.getPropertyValue("position-anchor")).toBe("--test-anchor");
  });

  it("sets position: absolute on the tooltip", () => {
    expect(tooltip.style.position).toBe("absolute");
  });

  it("update() sets --ct-x and --ct-y custom properties on the anchor", () => {
    ap.update(120, 80);
    expect(anchor.style.getPropertyValue("--ct-x")).toBe("120px");
    expect(anchor.style.getPropertyValue("--ct-y")).toBe("80px");
  });

  it("does NOT set style.left / style.top on the tooltip in native path", () => {
    ap.update(120, 80);
    expect(tooltip.style.left).toBe("");
    expect(tooltip.style.top).toBe("");
  });

  it("auto-generates anchor name when not provided", () => {
    const a2 = makeEl();
    const t2 = makeEl();
    const ap2 = createAnchorTooltip(a2, t2);
    expect(a2.style.getPropertyValue("anchor-name")).toMatch(/^--ct-anchor-\d+$/);
    ap2.destroy();
    cleanup(a2, t2);
  });

  it("destroy() clears all inline properties", () => {
    ap.update(10, 20);
    ap.destroy();
    expect(anchor.style.getPropertyValue("anchor-name")).toBe("");
    expect(anchor.style.getPropertyValue("--ct-x")).toBe("");
    expect(tooltip.style.getPropertyValue("position-anchor")).toBe("");
    expect(tooltip.style.position).toBe("");
  });
});

// ── createAnchorTooltip (fallback path) ──────────────────────────────────

describe("createAnchorTooltip — JS fallback path", () => {
  let anchor: HTMLElement;
  let tooltip: HTMLElement;
  let ap: AnchorTooltip;

  beforeEach(() => {
    vi.stubGlobal("CSS", { supports: vi.fn().mockReturnValue(false) });
    anchor = makeEl();
    tooltip = makeEl();
    ap = createAnchorTooltip(anchor, tooltip, "--test-anchor");
  });

  afterEach(() => {
    ap.destroy();
    cleanup(anchor, tooltip);
    vi.unstubAllGlobals();
  });

  it("reports native=false", () => {
    expect(ap.native).toBe(false);
  });

  it("does NOT set anchor-name in the fallback path", () => {
    expect(anchor.style.getPropertyValue("anchor-name")).toBe("");
  });

  it("update() sets style.left and style.top on the tooltip", () => {
    ap.update(55, 30);
    expect(tooltip.style.left).toBe("55px");
    expect(tooltip.style.top).toBe("30px");
  });

  it("update() handles float coordinates", () => {
    ap.update(12.5, 7.25);
    expect(tooltip.style.left).toBe("12.5px");
    expect(tooltip.style.top).toBe("7.25px");
  });

  it("destroy() clears style.left / style.top", () => {
    ap.update(55, 30);
    ap.destroy();
    expect(tooltip.style.left).toBe("");
    expect(tooltip.style.top).toBe("");
  });
});
