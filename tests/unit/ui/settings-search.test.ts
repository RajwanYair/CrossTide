import { describe, it, expect, beforeEach } from "vitest";
import { initSettingsSearch } from "../../../src/ui/settings-search";

describe("settings-search", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  function setup(): HTMLElement {
    const container = document.createElement("div");
    container.innerHTML = `
      <div class="setting-group"><label>Theme</label><select><option>Dark</option><option>Light</option></select></div>
      <div class="setting-group"><label>Language</label><select><option>English</option><option>Hebrew</option></select></div>
      <div class="setting-group"><label>Cache</label><button>Clear Cache</button></div>
      <div class="setting-group"><label>Export</label><button>Export JSON</button></div>
    `;
    document.body.appendChild(container);
    return container;
  }

  it("adds a search input to the container", () => {
    const container = setup();
    initSettingsSearch(container);
    const input = container.querySelector<HTMLInputElement>(".settings-search");
    expect(input).not.toBeNull();
    expect(input?.type).toBe("search");
  });

  it("does not add duplicate search inputs", () => {
    const container = setup();
    initSettingsSearch(container);
    initSettingsSearch(container);
    const inputs = container.querySelectorAll(".settings-search");
    expect(inputs.length).toBe(1);
  });

  it("filters setting groups by label text", () => {
    const container = setup();
    initSettingsSearch(container);
    const input = container.querySelector<HTMLInputElement>(".settings-search")!;
    input.value = "theme";
    input.dispatchEvent(new Event("input"));

    const groups = container.querySelectorAll<HTMLElement>(".setting-group");
    expect(groups[0].style.display).toBe(""); // Theme — visible
    expect(groups[1].style.display).toBe("none"); // Language — hidden
    expect(groups[2].style.display).toBe("none"); // Cache — hidden
  });

  it("shows all groups when search is cleared", () => {
    const container = setup();
    initSettingsSearch(container);
    const input = container.querySelector<HTMLInputElement>(".settings-search")!;
    input.value = "cache";
    input.dispatchEvent(new Event("input"));
    input.value = "";
    input.dispatchEvent(new Event("input"));

    const groups = container.querySelectorAll<HTMLElement>(".setting-group");
    for (const g of groups) {
      expect(g.style.display).toBe("");
    }
  });

  it("matches option text inside selects", () => {
    const container = setup();
    initSettingsSearch(container);
    const input = container.querySelector<HTMLInputElement>(".settings-search")!;
    input.value = "hebrew";
    input.dispatchEvent(new Event("input"));

    const groups = container.querySelectorAll<HTMLElement>(".setting-group");
    expect(groups[0].style.display).toBe("none"); // Theme
    expect(groups[1].style.display).toBe(""); // Language (Hebrew)
  });

  it("cleanup removes the search input", () => {
    const container = setup();
    const cleanup = initSettingsSearch(container);
    cleanup();
    expect(container.querySelector(".settings-search")).toBeNull();
  });
});
