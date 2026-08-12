/**
 * Public UI barrel tests — component registration and route-loader exports.
 */
import { describe, expect, it } from "vitest";
import * as ui from "../../../src/ui/index";

describe("ui public barrel", () => {
  it("registers reusable Web Components", () => {
    expect(customElements.get("ct-chart-frame")).toBeDefined();
    expect(customElements.get("ct-empty-state")).toBeDefined();
    expect(customElements.get("ct-filter-bar")).toBeDefined();
    expect(customElements.get("ct-stat-grid")).toBeDefined();
  });

  it("exports route-loader controls", () => {
    expect(typeof ui.defineRoute).toBe("function");
    expect(typeof ui.registerRouteLoader).toBe("function");
    expect(typeof ui.getRouteLoader).toBe("function");
    expect(typeof ui.onRouteNavigated).toBe("function");
  });
});
