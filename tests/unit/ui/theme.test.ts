/**
 * Theme tests.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { applyTheme, initTheme } from "../../../src/ui/theme";

describe("applyTheme", () => {
  it("sets data-theme attribute on documentElement", () => {
    applyTheme("dark");
    expect(document.documentElement.dataset["theme"]).toBe("dark");

    applyTheme("light");
    expect(document.documentElement.dataset["theme"]).toBe("light");
  });
});

describe("initTheme", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("applies theme and sets select value", () => {
    document.body.innerHTML =
      '<select id="theme-select"><option value="dark">Dark</option><option value="light">Light</option></select>';

    initTheme("dark");

    expect(document.documentElement.dataset["theme"]).toBe("dark");
    const select = document.getElementById("theme-select") as HTMLSelectElement;
    expect(select.value).toBe("dark");
  });

  it("works without a select element", () => {
    initTheme("light");
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
