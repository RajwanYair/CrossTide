/**
 * Unit tests for `<ct-stat-grid>` Web Component (P10).
 */
import { describe, it, expect, beforeEach } from "vitest";
import "../../../src/ui/stat-grid";
import type { CtStatGrid, StatItem } from "../../../src/ui/stat-grid";

function createElement(): CtStatGrid {
  return document.createElement("ct-stat-grid") as CtStatGrid;
}

const sampleStats: StatItem[] = [
  { label: "Market Cap", value: "$2.8T", trend: "up" },
  { label: "P/E Ratio", value: "28.5" },
  { label: "Dividend", value: "0.55%", trend: "down", subtext: "-0.02%" },
];

describe("ct-stat-grid", () => {
  let el: CtStatGrid;

  beforeEach(() => {
    el = createElement();
  });

  it("is defined as a custom element", () => {
    expect(customElements.get("ct-stat-grid")).toBeDefined();
  });

  it("renders nothing before connected", () => {
    el.stats = sampleStats;
    expect(el.innerHTML).toBe("");
  });

  it("renders grid with items on connect", () => {
    el.stats = sampleStats;
    document.body.appendChild(el);

    const grid = el.querySelector(".ct-sg");
    expect(grid).not.toBeNull();
    expect(grid!.getAttribute("role")).toBe("list");

    const items = el.querySelectorAll(".ct-sg-item");
    expect(items).toHaveLength(3);

    document.body.removeChild(el);
  });

  it("renders labels and values correctly", () => {
    el.stats = sampleStats;
    document.body.appendChild(el);

    const labels = el.querySelectorAll(".ct-sg-label");
    expect(labels[0]!.textContent).toBe("Market Cap");
    expect(labels[1]!.textContent).toBe("P/E Ratio");

    const values = el.querySelectorAll(".ct-sg-value");
    expect(values[1]!.textContent).toBe("28.5");

    document.body.removeChild(el);
  });

  it("renders trend up indicator", () => {
    el.stats = sampleStats;
    document.body.appendChild(el);

    const items = el.querySelectorAll(".ct-sg-item");
    expect(items[0]!.classList.contains("ct-sg-item--up")).toBe(true);
    const trendIcon = items[0]!.querySelector(".ct-sg-trend--up");
    expect(trendIcon).not.toBeNull();
    expect(trendIcon!.textContent).toContain("▲");

    document.body.removeChild(el);
  });

  it("renders trend down indicator", () => {
    el.stats = sampleStats;
    document.body.appendChild(el);

    const items = el.querySelectorAll(".ct-sg-item");
    expect(items[2]!.classList.contains("ct-sg-item--down")).toBe(true);
    const trendIcon = items[2]!.querySelector(".ct-sg-trend--down");
    expect(trendIcon).not.toBeNull();
    expect(trendIcon!.textContent).toContain("▼");

    document.body.removeChild(el);
  });

  it("renders subtext when provided", () => {
    el.stats = sampleStats;
    document.body.appendChild(el);

    const subtexts = el.querySelectorAll(".ct-sg-subtext");
    expect(subtexts).toHaveLength(1);
    expect(subtexts[0]!.textContent).toBe("-0.02%");

    document.body.removeChild(el);
  });

  it("applies custom grid options", () => {
    el.stats = sampleStats;
    el.options = { minColumnWidth: "200px", gap: "1rem", ariaLabel: "Key metrics" };
    document.body.appendChild(el);

    const grid = el.querySelector(".ct-sg") as HTMLElement;
    expect(grid.style.gridTemplateColumns).toContain("200px");
    expect(grid.style.gap).toBe("1rem");
    expect(grid.getAttribute("aria-label")).toBe("Key metrics");

    document.body.removeChild(el);
  });

  it("escapes HTML in labels and values", () => {
    el.stats = [{ label: "<b>XSS</b>", value: "<script>alert(1)</script>" }];
    document.body.appendChild(el);

    const label = el.querySelector(".ct-sg-label")!;
    expect(label.textContent).toBe("<b>XSS</b>");
    expect(label.innerHTML).not.toContain("<b>");

    document.body.removeChild(el);
  });

  it("re-renders when stats are updated after connect", () => {
    el.stats = sampleStats;
    document.body.appendChild(el);

    el.stats = [{ label: "New", value: "42" }];
    const items = el.querySelectorAll(".ct-sg-item");
    expect(items).toHaveLength(1);
    expect(el.querySelector(".ct-sg-label")!.textContent).toBe("New");

    document.body.removeChild(el);
  });

  it("does not render when no stats", () => {
    el.stats = [];
    document.body.appendChild(el);

    const items = el.querySelectorAll(".ct-sg-item");
    expect(items).toHaveLength(0);

    document.body.removeChild(el);
  });
});
