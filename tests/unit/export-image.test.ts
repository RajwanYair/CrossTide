/**
 * Unit tests for export-image module.
 */
import { describe, it, expect } from "vitest";
import { captureElementAsSvg } from "../../src/core/export-image";

describe("captureElementAsSvg", () => {
  it("generates SVG with foreignObject wrapping the element", () => {
    const el = document.createElement("div");
    el.innerHTML = `<span class="test">Hello</span>`;
    // Set dimensions (happy-dom won't compute layout, so offsetWidth = 0)
    Object.defineProperty(el, "offsetWidth", { value: 300 });
    Object.defineProperty(el, "offsetHeight", { value: 200 });

    const svg = captureElementAsSvg(el);

    expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"');
    expect(svg).toContain('width="300"');
    expect(svg).toContain('height="200"');
    expect(svg).toContain("foreignObject");
    expect(svg).toContain("Hello");
  });

  it("handles empty element", () => {
    const el = document.createElement("div");
    Object.defineProperty(el, "offsetWidth", { value: 100 });
    Object.defineProperty(el, "offsetHeight", { value: 50 });

    const svg = captureElementAsSvg(el);

    expect(svg).toContain('viewBox="0 0 100 50"');
  });

  it("includes nested element content", () => {
    const el = document.createElement("div");
    el.innerHTML = `<table><tr><td>AAPL</td><td>150.00</td></tr></table>`;
    Object.defineProperty(el, "offsetWidth", { value: 400 });
    Object.defineProperty(el, "offsetHeight", { value: 300 });

    const svg = captureElementAsSvg(el);

    expect(svg).toContain("AAPL");
    expect(svg).toContain("150.00");
  });
});
