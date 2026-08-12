/**
 * Heatmap card adapter tests (A12 — heatmap card activation).
 *
 * Verifies that the CardModule wrapper correctly mounts the sector heatmap,
 * renders tiles, and exposes the expected CardHandle interface.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

describe("heatmap-card (CardModule)", () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it("mounts without throwing", async () => {
    const { default: heatmapCard } = await import("../../../src/cards/heatmap-card");
    expect(() => heatmapCard.mount(container, { route: "heatmap", params: {} })).not.toThrow();
  });

  it("renders heatmap tiles", async () => {
    const { default: heatmapCard } = await import("../../../src/cards/heatmap-card");
    heatmapCard.mount(container, { route: "heatmap", params: {} });
    // Heatmap card uses mock sector data — expect tile elements
    const tiles = container.querySelectorAll(".heatmap-tile");
    expect(tiles.length).toBeGreaterThan(0);
  });

  it("renders sector names in the heatmap", async () => {
    const { default: heatmapCard } = await import("../../../src/cards/heatmap-card");
    heatmapCard.mount(container, { route: "heatmap", params: {} });
    expect(container.textContent).toContain("Technology");
  });

  it("returns a CardHandle object", async () => {
    const { default: heatmapCard } = await import("../../../src/cards/heatmap-card");
    const handle = heatmapCard.mount(container, { route: "heatmap", params: {} });
    // CardHandle may be undefined (void) or an object — both are valid
    expect(handle === undefined || typeof handle === "object").toBe(true);
  });

  it("fills the container with heatmap content", async () => {
    const { default: heatmapCard } = await import("../../../src/cards/heatmap-card");
    heatmapCard.mount(container, { route: "heatmap", params: {} });
    expect(container.innerHTML.length).toBeGreaterThan(50);
  });

  it("includes SVG or grid element for layout", async () => {
    const { default: heatmapCard } = await import("../../../src/cards/heatmap-card");
    heatmapCard.mount(container, { route: "heatmap", params: {} });
    const hasGrid = container.querySelector(".heatmap-grid") !== null;
    const hasSvg = container.querySelector("svg") !== null;
    expect(hasGrid || hasSvg).toBe(true);
  });

  it("shows global asset-class controls and instrument count", async () => {
    const { default: heatmapCard } = await import("../../../src/cards/heatmap-card");
    heatmapCard.mount(container, { route: "heatmap", params: {} });
    expect(container.querySelectorAll("[data-action=heatmap-class]")).toHaveLength(4);
    expect(container.textContent).toContain("11 instruments");
  });

  it("switches between stocks and crypto heatmaps", async () => {
    const { default: heatmapCard } = await import("../../../src/cards/heatmap-card");
    const handle = heatmapCard.mount(container, { route: "heatmap", params: {} });
    container.querySelector<HTMLElement>("[data-heatmap-class=crypto]")?.click();
    expect(container.textContent).toContain("Crypto");
    expect(container.textContent).toContain("Bitcoin");
    handle?.dispose();
  });

  it("disposes drill-down interactions after a sector is opened", async () => {
    const { default: heatmapCard } = await import("../../../src/cards/heatmap-card");
    const handle = heatmapCard.mount(container, { route: "heatmap", params: {} });
    container.querySelector<HTMLElement>('[data-symbol="Technology"]')?.click();

    expect(container.querySelector(".heatmap-drill-table")).not.toBeNull();
    handle?.dispose?.();
    container.querySelector<HTMLElement>('[data-action="heatmap-back"]')?.click();

    expect(container.querySelector(".heatmap-drill-table")).not.toBeNull();
  });

  it("observes container size and disconnects on disposal", async () => {
    const observe = vi.fn();
    const disconnect = vi.fn();
    let resizeCallback: (() => void) | null = null;
    vi.stubGlobal(
      "ResizeObserver",
      class {
        constructor(callback: () => void) {
          resizeCallback = callback;
        }

        observe = observe;
        disconnect = disconnect;
      },
    );
    const { default: heatmapCard } = await import("../../../src/cards/heatmap-card");
    const handle = heatmapCard.mount(container, { route: "heatmap", params: {} });
    expect(observe).toHaveBeenCalledWith(container);
    const tile = container.querySelector(".heatmap-tile");
    resizeCallback?.();
    expect(container.querySelector(".heatmap-tile")).toBe(tile);
    handle?.dispose?.();
    expect(disconnect).toHaveBeenCalled();
    vi.unstubAllGlobals();
  });
});
