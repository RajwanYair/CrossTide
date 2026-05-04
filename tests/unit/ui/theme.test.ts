/**
 * Theme tests.
 */
import { describe, it, expect, beforeEach } from "vitest";
import {
  applyTheme,
  initTheme,
  detectHighContrast,
  detectPreferredTheme,
} from "../../../src/ui/theme";
import type { Theme } from "../../../src/ui/theme";

describe("applyTheme", () => {
  it("sets data-theme attribute on documentElement", () => {
    applyTheme("dark");
    expect(document.documentElement.dataset["theme"]).toBe("dark");

    applyTheme("light");
    expect(document.documentElement.dataset["theme"]).toBe("light");
  });

  it("supports high-contrast theme", () => {
    applyTheme("high-contrast");
    expect(document.documentElement.dataset["theme"]).toBe("high-contrast");
  });
});

describe("initTheme", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("applies theme and sets select value", () => {
    document.body.innerHTML =
      '<select id="theme-select"><option value="dark">Dark</option><option value="light">Light</option></select>';

    const result = initTheme("dark");

    expect(result).toBe("dark");
    expect(document.documentElement.dataset["theme"]).toBe("dark");
    const select = document.getElementById("theme-select") as HTMLSelectElement;
    expect(select.value).toBe("dark");
  });

  it("works without a select element", () => {
    const result = initTheme("light");
    expect(result).toBe("light");
    expect(document.documentElement.dataset["theme"]).toBe("light");
  });

  it("responds to change event on select", () => {
    document.body.innerHTML =
      '<select id="theme-select"><option value="dark">Dark</option><option value="light">Light</option></select>';

    initTheme("dark");

    const select = document.getElementById("theme-select") as HTMLSelectElement;
    select.value = "light";
    select.dispatchEvent(new Event("change"));

    expect(document.documentElement.dataset["theme"]).toBe("light");
  });
});

describe("detectHighContrast", () => {
  it("returns a boolean", () => {
    expect(typeof detectHighContrast()).toBe("boolean");
  });
});

describe("detectPreferredTheme", () => {
  it("returns a valid theme", () => {
    const valid: Theme[] = ["dark", "light", "high-contrast"];
    expect(valid).toContain(detectPreferredTheme());
  });
});

describe("theme transition animation", () => {
  beforeEach(() => {
    document.documentElement.classList.remove("theme-transitioning");
    delete document.documentElement.dataset["theme"];
  });

  it("does not add transition class on first apply (no prior theme)", () => {
    applyTheme("dark");
    expect(document.documentElement.classList.contains("theme-transitioning")).toBe(false);
  });

  it("adds theme-transitioning class when switching themes", () => {
    applyTheme("dark"); // initial
    applyTheme("light"); // switch
    expect(document.documentElement.classList.contains("theme-transitioning")).toBe(true);
  });

  it("removes theme-transitioning class after timeout", async () => {
    const { vi } = await import("vitest");
    vi.useFakeTimers();
    applyTheme("dark");
    applyTheme("light");
    expect(document.documentElement.classList.contains("theme-transitioning")).toBe(true);
    vi.advanceTimersByTime(300);
    expect(document.documentElement.classList.contains("theme-transitioning")).toBe(false);
    vi.useRealTimers();
  });
});
