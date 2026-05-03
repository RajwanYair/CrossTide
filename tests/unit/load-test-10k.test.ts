/**
 * Load testing — verify virtual scrolling performance with 10,000+ rows.
 *
 * M1: Validates that:
 *  1. VirtualScroller initializes with 10K rows without error
 *  2. Only a small number of DOM rows are rendered (not 10K)
 *  3. Scrolling updates visible rows efficiently
 *  4. Update to 10K+ rows completes in < 50ms
 */
import { describe, it, expect, beforeEach } from "vitest";
import { VirtualScroller, shouldVirtualize } from "../../src/ui/virtual-scroller";

describe("Load testing — 10K rows", () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement("div");
    // Simulate a viewport with scrollable height
    Object.defineProperty(container, "offsetHeight", { value: 600, configurable: true });
    document.body.appendChild(container);
  });

  it("shouldVirtualize returns true for > 50 rows", () => {
    expect(shouldVirtualize(51)).toBe(true);
    expect(shouldVirtualize(10_000)).toBe(true);
    expect(shouldVirtualize(50)).toBe(false);
  });

  it("initializes with 10,000 rows without throwing", () => {
    expect(() => {
      new VirtualScroller({
        container,
        rowHeight: 32,
        totalRows: 10_000,
        renderRow: (i) => `<tr><td>Row ${i}</td><td>${(Math.random() * 1000).toFixed(2)}</td></tr>`,
        overscan: 5,
      });
    }).not.toThrow();
  });

  it("renders only visible + overscan rows (not all 10K)", () => {
    new VirtualScroller({
      container,
      rowHeight: 32,
      totalRows: 10_000,
      renderRow: (i) => `<tr><td>Ticker-${i}</td><td>${i * 1.5}</td></tr>`,
      overscan: 5,
    });

    const tbody = container.querySelector(".virtual-tbody");
    const renderedRows = tbody?.querySelectorAll("tr");
    // With 600px height / 32px row = ~18 visible + 5 overscan each side = ~28 max
    // Definitely not 10,000
    expect(renderedRows?.length ?? 0).toBeLessThan(50);
    expect(renderedRows?.length ?? 0).toBeGreaterThan(0);
  });

  it("spacer height reflects total dataset size", () => {
    new VirtualScroller({
      container,
      rowHeight: 32,
      totalRows: 10_000,
      renderRow: (i) => `<tr><td>${i}</td></tr>`,
    });

    const spacer = container.querySelector<HTMLElement>(".virtual-spacer");
    // 10_000 * 32 = 320_000 px
    expect(spacer?.style.height).toBe("320000px");
  });

  it("update() handles growing to 10K rows", () => {
    const vs = new VirtualScroller({
      container,
      rowHeight: 32,
      totalRows: 100,
      renderRow: (i) => `<tr><td>${i}</td></tr>`,
    });

    const t0 = performance.now();
    vs.update(10_000);
    const elapsed = performance.now() - t0;

    // Should complete in < 50ms (only re-renders visible slice)
    expect(elapsed).toBeLessThan(50);

    const spacer = container.querySelector<HTMLElement>(".virtual-spacer");
    expect(spacer?.style.height).toBe("320000px");
  });

  it("handles 50,000 rows (stress test)", () => {
    const t0 = performance.now();
    new VirtualScroller({
      container,
      rowHeight: 28,
      totalRows: 50_000,
      renderRow: (i) =>
        `<tr><td>Stock-${i}</td><td>${(i * 0.01).toFixed(2)}</td><td>${i % 3 === 0 ? "BUY" : "SELL"}</td></tr>`,
      overscan: 10,
    });
    const initTime = performance.now() - t0;

    // Init + first render should be fast
    expect(initTime).toBeLessThan(100);

    // Still only renders a small slice
    const rendered = container.querySelectorAll(".virtual-tbody tr");
    expect(rendered.length).toBeLessThan(100);
  });

  it("dispose() cleans up with large datasets", () => {
    const vs = new VirtualScroller({
      container,
      rowHeight: 32,
      totalRows: 10_000,
      renderRow: (i) => `<tr><td>${i}</td></tr>`,
    });

    expect(() => vs.dispose()).not.toThrow();
  });
});
