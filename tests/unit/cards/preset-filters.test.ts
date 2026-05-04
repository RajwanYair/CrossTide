/**
 * Preset screener filter tests.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  PRESET_FILTERS,
  getPresetById,
  renderPresetPicker,
} from "../../../src/cards/preset-filters";

describe("PRESET_FILTERS", () => {
  it("has at least 5 presets", () => {
    expect(PRESET_FILTERS.length).toBeGreaterThanOrEqual(5);
  });

  it("all presets have unique ids", () => {
    const ids = PRESET_FILTERS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("all presets have at least one filter", () => {
    for (const p of PRESET_FILTERS) {
      expect(p.filters.length).toBeGreaterThanOrEqual(1);
    }
  });

  it("all presets have name and description", () => {
    for (const p of PRESET_FILTERS) {
      expect(p.name.length).toBeGreaterThan(0);
      expect(p.description.length).toBeGreaterThan(0);
    }
  });
});

describe("getPresetById", () => {
  it("finds a known preset", () => {
    const p = getPresetById("oversold-buy");
    expect(p).toBeDefined();
    expect(p!.name).toBe("Oversold Bounce");
  });

  it("returns undefined for unknown id", () => {
    expect(getPresetById("nonexistent")).toBeUndefined();
  });
});

describe("renderPresetPicker", () => {
  let container: HTMLElement;
  beforeEach(() => {
    container = document.createElement("div");
  });

  it("renders a button per preset", () => {
    renderPresetPicker(container, () => {});
    const buttons = container.querySelectorAll(".preset-btn");
    expect(buttons.length).toBe(PRESET_FILTERS.length);
  });

  it("buttons have data-preset-id", () => {
    renderPresetPicker(container, () => {});
    const btn = container.querySelector<HTMLButtonElement>(".preset-btn");
    expect(btn?.dataset.presetId).toBe(PRESET_FILTERS[0].id);
  });

  it("calls onSelect with correct preset on click", () => {
    const handler = vi.fn();
    renderPresetPicker(container, handler);
    const btn = container.querySelector<HTMLButtonElement>(`[data-preset-id="oversold-buy"]`);
    btn?.click();
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0][0].id).toBe("oversold-buy");
  });

  it("has aria group label", () => {
    renderPresetPicker(container, () => {});
    const group = container.querySelector(".preset-picker");
    expect(group?.getAttribute("aria-label")).toBe("Screener Presets");
  });
});
