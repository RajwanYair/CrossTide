import { describe, it, expect } from "vitest";
import { renderSparkline } from "../../../src/ui/sparkline";

describe("renderSparkline", () => {
  it("returns empty string for fewer than 2 points", () => {
    expect(renderSparkline([])).toBe("");
    expect(renderSparkline([100])).toBe("");
  });

  it("returns an SVG string for 2+ points", () => {
    const svg = renderSparkline([100, 105, 102, 108]);
    expect(svg).toContain("<svg");
    expect(svg).toContain("</svg>");
    expect(svg).toContain("<polyline");
  });

  it("includes default dimensions", () => {
    const svg = renderSparkline([1, 2, 3]);
    expect(svg).toContain('width="80"');
    expect(svg).toContain('height="24"');
  });

  it("respects custom dimensions", () => {
    const svg = renderSparkline([1, 2], { width: 120, height: 32 });
    expect(svg).toContain('width="120"');
    expect(svg).toContain('height="32"');
  });

  it("uses custom stroke color", () => {
    const svg = renderSparkline([1, 2], { strokeColor: "#00ff00" });
    expect(svg).toContain('stroke="#00ff00"');
  });

  it("has aria-label for accessibility", () => {
    const svg = renderSparkline([10, 20]);
    expect(svg).toContain('aria-label="Price sparkline"');
    expect(svg).toContain('role="img"');
  });

  it("handles flat data (all same values)", () => {
    const svg = renderSparkline([50, 50, 50, 50]);
    expect(svg).toContain("<polyline");
    // Should not throw or produce NaN
    expect(svg).not.toContain("NaN");
  });

  it("points count matches data length", () => {
    const data = [10, 20, 30, 40, 50];
    const svg = renderSparkline(data);
    const match = svg.match(/points="([^"]+)"/);
    expect(match).not.toBeNull();
    const pointPairs = match![1]!.trim().split(" ");
    expect(pointPairs).toHaveLength(data.length);
  });
});
