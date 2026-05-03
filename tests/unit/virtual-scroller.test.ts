import { describe, it, expect, beforeEach } from "vitest";
import { VirtualScroller, shouldVirtualize } from "../../src/ui/virtual-scroller";

describe("VirtualScroller", () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  it("renders only visible rows based on viewport", () => {
    const vs = new VirtualScroller({
      container,
      rowHeight: 32,
      totalRows: 200,
      renderRow: (i) => `<tr><td>Row ${i}</td></tr>`,
      headerHtml: "<tr><th>Col</th></tr>",
      ariaLabel: "Test Table",
    });

    // Should render some rows but not all 200
    const rows = container.querySelectorAll("tbody tr");
    expect(rows.length).toBeLessThan(200);
    expect(rows.length).toBeGreaterThan(0);

    vs.dispose();
  });

  it("creates a spacer with correct total height", () => {
    const vs = new VirtualScroller({
      container,
      rowHeight: 40,
      totalRows: 100,
      renderRow: (i) => `<tr><td>${i}</td></tr>`,
    });

    const spacer = container.querySelector(".virtual-spacer") as HTMLElement;
    expect(spacer.style.height).toBe("4000px"); // 100 * 40

    vs.dispose();
  });

  it("updates total rows", () => {
    const vs = new VirtualScroller({
      container,
      rowHeight: 32,
      totalRows: 50,
      renderRow: (i) => `<tr><td>${i}</td></tr>`,
    });

    vs.update(200);
    const spacer = container.querySelector(".virtual-spacer") as HTMLElement;
    expect(spacer.style.height).toBe("6400px"); // 200 * 32

    vs.dispose();
  });

  it("setViewportHeight sets max-height on scroll element", () => {
    const vs = new VirtualScroller({
      container,
      rowHeight: 32,
      totalRows: 100,
      renderRow: (i) => `<tr><td>${i}</td></tr>`,
    });

    vs.setViewportHeight(300);
    const scrollEl = container.querySelector(".virtual-scroll-viewport") as HTMLElement;
    expect(scrollEl.style.maxHeight).toBe("300px");

    vs.dispose();
  });
});

describe("shouldVirtualize", () => {
  it("returns true when rows exceed threshold", () => {
    expect(shouldVirtualize(51)).toBe(true);
    expect(shouldVirtualize(100)).toBe(true);
  });

  it("returns false when rows are at or below threshold", () => {
    expect(shouldVirtualize(50)).toBe(false);
    expect(shouldVirtualize(10)).toBe(false);
    expect(shouldVirtualize(0)).toBe(false);
  });

  it("supports custom threshold", () => {
    expect(shouldVirtualize(30, 25)).toBe(true);
    expect(shouldVirtualize(20, 25)).toBe(false);
  });
});
