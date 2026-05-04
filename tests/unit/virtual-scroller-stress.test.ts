/**
 * Virtual Scroller Stress Tests — M1 load testing.
 *
 * Validates that VirtualScroller handles 10K+ rows without performance
 * degradation: O(visible) DOM nodes, fast scroll updates, correct render
 * after rapid update() calls.
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { VirtualScroller } from "../../src/ui/virtual-scroller";

describe("VirtualScroller stress (10K rows)", () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement("div");
    // Simulate a fixed viewport for deterministic testing
    Object.defineProperty(container, "clientHeight", { value: 600, configurable: true });
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
  });

  it("renders fewer than 50 DOM rows for 10,000 total rows", () => {
    const vs = new VirtualScroller({
      container,
      rowHeight: 36,
      totalRows: 10_000,
      renderRow: (i) =>
        `<tr><td>Ticker-${i}</td><td>${(100 + Math.random() * 200).toFixed(2)}</td></tr>`,
      overscan: 5,
    });

    const renderedRows = container.querySelectorAll("tbody tr");
    // With 600px viewport / 36px row height ≈ 17 visible + 10 overscan = ~27
    expect(renderedRows.length).toBeLessThan(50);
    expect(renderedRows.length).toBeGreaterThan(0);

    vs.dispose();
  });

  it("spacer height matches 10K × rowHeight", () => {
    const vs = new VirtualScroller({
      container,
      rowHeight: 36,
      totalRows: 10_000,
      renderRow: (i) => `<tr><td>${i}</td></tr>`,
    });

    const spacer = container.querySelector<HTMLElement>(".virtual-spacer")!;
    expect(spacer.style.height).toBe("360000px");

    vs.dispose();
  });

  it("update() to 10K rows completes without error", () => {
    const vs = new VirtualScroller({
      container,
      rowHeight: 36,
      totalRows: 100,
      renderRow: (i) => `<tr><td>${i}</td></tr>`,
    });

    // Scale up to 10K
    vs.update(10_000);
    const spacer = container.querySelector<HTMLElement>(".virtual-spacer")!;
    expect(spacer.style.height).toBe("360000px");

    const renderedRows = container.querySelectorAll("tbody tr");
    expect(renderedRows.length).toBeLessThan(50);

    vs.dispose();
  });

  it("rapid sequential updates do not throw or leak", () => {
    const vs = new VirtualScroller({
      container,
      rowHeight: 36,
      totalRows: 100,
      renderRow: (i) => `<tr><td>${i}</td></tr>`,
    });

    // Simulate rapid data refreshes (100 updates)
    for (let n = 1000; n <= 10_000; n += 100) {
      vs.update(n);
    }

    const spacer = container.querySelector<HTMLElement>(".virtual-spacer")!;
    expect(spacer.style.height).toBe("360000px");

    const renderedRows = container.querySelectorAll("tbody tr");
    expect(renderedRows.length).toBeLessThan(50);

    vs.dispose();
  });

  it("scroll simulation renders correct row range", () => {
    const vs = new VirtualScroller({
      container,
      rowHeight: 36,
      totalRows: 10_000,
      overscan: 3,
      renderRow: (i) => `<tr data-row="${i}"><td>Row ${i}</td></tr>`,
    });

    const scrollEl = container.querySelector<HTMLElement>(".virtual-scroll-viewport")!;
    // Simulate clientHeight for the scroll viewport
    Object.defineProperty(scrollEl, "clientHeight", { value: 400, configurable: true });

    // Simulate scrolling to row 5000 (offset 180000px)
    Object.defineProperty(scrollEl, "scrollTop", { value: 180_000, configurable: true });
    scrollEl.dispatchEvent(new Event("scroll"));

    const firstRow = container.querySelector<HTMLElement>("[data-row]");
    const rowIndex = parseInt(firstRow?.dataset["row"] ?? "-1", 10);
    // Should be around 5000 - overscan (4997)
    expect(rowIndex).toBeGreaterThanOrEqual(4990);
    expect(rowIndex).toBeLessThanOrEqual(5000);

    vs.dispose();
  });

  it("dispose prevents further scroll handling", () => {
    const vs = new VirtualScroller({
      container,
      rowHeight: 36,
      totalRows: 10_000,
      renderRow: (i) => `<tr><td>${i}</td></tr>`,
    });

    vs.dispose();

    const scrollEl = container.querySelector<HTMLElement>(".virtual-scroll-viewport")!;
    // Scrolling after dispose should not throw
    Object.defineProperty(scrollEl, "scrollTop", { value: 50_000, configurable: true });
    expect(() => scrollEl.dispatchEvent(new Event("scroll"))).not.toThrow();
  });

  it("renderRow is called with correct indices at scroll position", () => {
    const calledIndices: number[] = [];
    const vs = new VirtualScroller({
      container,
      rowHeight: 36,
      totalRows: 10_000,
      overscan: 2,
      renderRow: (i) => {
        calledIndices.push(i);
        return `<tr><td>${i}</td></tr>`;
      },
    });

    // Initial render should have sequential indices starting near 0
    expect(calledIndices[0]).toBe(0);
    expect(calledIndices).toEqual([...calledIndices].sort((a, b) => a - b));
    expect(calledIndices.length).toBeLessThan(30);

    vs.dispose();
  });
});
