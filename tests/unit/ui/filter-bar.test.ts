/**
 * Unit tests for `<ct-filter-bar>` Web Component (Q7).
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import "../../../src/ui/filter-bar";
import type { CtFilterBar, FilterBarPreset } from "../../../src/ui/filter-bar";

function createElement(): CtFilterBar {
  return document.createElement("ct-filter-bar") as CtFilterBar;
}

const samplePresets: FilterBarPreset[] = [
  { id: "value", label: "Value", description: "P/E < 15" },
  { id: "growth", label: "Growth", description: "Revenue YoY > 20%" },
  { id: "dividend", label: "Dividend", description: "Yield > 3%" },
];

describe("ct-filter-bar", () => {
  let el: CtFilterBar;

  beforeEach(() => {
    el = createElement();
  });

  it("is defined as a custom element", () => {
    expect(customElements.get("ct-filter-bar")).toBeDefined();
  });

  it("renders nothing before connected", () => {
    el.presets = samplePresets;
    expect(el.innerHTML).toBe("");
  });

  it("renders preset buttons on connect", () => {
    el.presets = samplePresets;
    document.body.appendChild(el);

    const buttons = el.querySelectorAll(".ct-fb-btn");
    expect(buttons).toHaveLength(3);
    expect(buttons[0]!.textContent).toBe("Value");
    expect(buttons[1]!.textContent).toBe("Growth");
    expect(buttons[2]!.textContent).toBe("Dividend");

    document.body.removeChild(el);
  });

  it("renders group with aria-label", () => {
    el.presets = samplePresets;
    document.body.appendChild(el);

    const group = el.querySelector('[role="group"]');
    expect(group).not.toBeNull();
    expect(group!.getAttribute("aria-label")).toBe("Filter presets");

    document.body.removeChild(el);
  });

  it("sets title attribute from description", () => {
    el.presets = samplePresets;
    document.body.appendChild(el);

    const btn = el.querySelector(".ct-fb-btn") as HTMLButtonElement;
    expect(btn.title).toBe("P/E < 15");

    document.body.removeChild(el);
  });

  it("highlights active preset", () => {
    el.presets = samplePresets;
    el.active = "growth";
    document.body.appendChild(el);

    const buttons = el.querySelectorAll(".ct-fb-btn");
    expect(buttons[0]!.classList.contains("active")).toBe(false);
    expect(buttons[1]!.classList.contains("active")).toBe(true);
    expect(buttons[2]!.classList.contains("active")).toBe(false);

    document.body.removeChild(el);
  });

  it("emits preset-select event on click", () => {
    el.presets = samplePresets;
    document.body.appendChild(el);

    const handler = vi.fn();
    el.addEventListener("preset-select", handler);

    const btn = el.querySelectorAll(".ct-fb-btn")[1] as HTMLElement;
    btn.click();

    expect(handler).toHaveBeenCalledTimes(1);
    const detail = handler.mock.calls[0]![0].detail;
    expect(detail.id).toBe("growth");
    expect(detail.index).toBe(1);

    document.body.removeChild(el);
  });

  it("updates active state on click", () => {
    el.presets = samplePresets;
    document.body.appendChild(el);

    const btn = el.querySelectorAll(".ct-fb-btn")[2] as HTMLElement;
    btn.click();

    expect(el.active).toBe("dividend");
    expect(btn.classList.contains("active")).toBe(true);

    document.body.removeChild(el);
  });

  it("updates active via attribute change", () => {
    el.presets = samplePresets;
    document.body.appendChild(el);

    el.setAttribute("active", "value");
    const buttons = el.querySelectorAll(".ct-fb-btn");
    expect(buttons[0]!.classList.contains("active")).toBe(true);
    expect(buttons[1]!.classList.contains("active")).toBe(false);

    document.body.removeChild(el);
  });

  it("re-renders when presets change after connect", () => {
    el.presets = samplePresets;
    document.body.appendChild(el);

    el.presets = [{ id: "new", label: "New Filter" }];
    const buttons = el.querySelectorAll(".ct-fb-btn");
    expect(buttons).toHaveLength(1);
    expect(buttons[0]!.textContent).toBe("New Filter");

    document.body.removeChild(el);
  });

  it("removes click listener on disconnect", () => {
    el.presets = samplePresets;
    document.body.appendChild(el);
    document.body.removeChild(el);

    // Re-attach and click should still work
    document.body.appendChild(el);
    const handler = vi.fn();
    el.addEventListener("preset-select", handler);
    const btn = el.querySelector(".ct-fb-btn") as HTMLElement;
    btn.click();
    // Should fire once (not twice from duplicate listeners)
    expect(handler).toHaveBeenCalledTimes(1);

    document.body.removeChild(el);
  });

  it("escapes preset labels", () => {
    el.presets = [{ id: "xss", label: "<img src=x onerror=alert(1)>" }];
    document.body.appendChild(el);

    const btn = el.querySelector(".ct-fb-btn")!;
    expect(btn.innerHTML).not.toContain("<img");
    expect(btn.textContent).toBe("<img src=x onerror=alert(1)>");

    document.body.removeChild(el);
  });
});
