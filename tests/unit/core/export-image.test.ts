/**
 * Tests for DOM image export helpers.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  captureElementAsPng,
  captureElementAsSvg,
  downloadSvg,
} from "../../../src/core/export-image";

function sizedElement(): HTMLElement {
  const element = document.createElement("section");
  element.innerHTML = "<p>Export me</p>";
  Object.defineProperties(element, {
    offsetWidth: { configurable: true, value: 320 },
    offsetHeight: { configurable: true, value: 180 },
  });
  return element;
}

describe("export-image", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns null when the source has no rendered dimensions", async () => {
    const element = document.createElement("section");
    expect(await captureElementAsPng(element)).toBeNull();
  });

  it("serializes a sized element into an SVG foreignObject", () => {
    const svg = captureElementAsSvg(sizedElement());

    expect(svg).toContain('<svg xmlns="http://www.w3.org/2000/svg"');
    expect(svg).toContain('viewBox="0 0 320 180"');
    expect(svg).toContain("<foreignObject");
    expect(svg).toContain("Export me");
  });

  it("creates and cleans up a temporary download link", () => {
    const createObjectURL = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:test");
    const revokeObjectURL = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined);
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => undefined);
    vi.useFakeTimers();

    downloadSvg("<svg />", "chart.svg");

    const link = document.querySelector<HTMLAnchorElement>('a[download="chart.svg"]');
    expect(createObjectURL).toHaveBeenCalledOnce();
    expect(click).toHaveBeenCalledOnce();
    expect(link).not.toBeNull();
    expect(link?.href).toContain("blob:test");
    expect(link?.download).toBe("chart.svg");

    vi.advanceTimersByTime(100);
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:test");
    expect(document.querySelector('a[download="chart.svg"]')).toBeNull();
    vi.useRealTimers();
  });
});
