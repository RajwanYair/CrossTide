import { describe, it, expect, beforeEach } from "vitest";
import { patchDOM } from "../../src/core/patch-dom";

describe("patchDOM", () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  it("renders initial content via innerHTML on empty container", () => {
    patchDOM(container, `<p class="test">Hello</p>`);
    expect(container.innerHTML).toContain("Hello");
    expect(container.querySelector("p")?.className).toBe("test");
  });

  it("patches existing content without full re-render", () => {
    container.innerHTML = `<p class="test">Hello</p>`;
    const p = container.querySelector("p")!;

    patchDOM(container, `<p class="test">World</p>`);

    // The element should be morphed, not replaced
    expect(container.querySelector("p")?.textContent).toBe("World");
  });

  it("adds new elements", () => {
    patchDOM(container, `<p>One</p>`);
    patchDOM(container, `<p>One</p><p>Two</p>`);
    expect(container.querySelectorAll("p")).toHaveLength(2);
  });

  it("removes extra elements", () => {
    patchDOM(container, `<p>One</p><p>Two</p>`);
    patchDOM(container, `<p>One</p>`);
    expect(container.querySelectorAll("p")).toHaveLength(1);
  });

  it("updates attributes", () => {
    patchDOM(container, `<span class="a">X</span>`);
    patchDOM(container, `<span class="b">X</span>`);
    expect(container.querySelector("span")?.className).toBe("b");
  });

  it("handles empty new html", () => {
    patchDOM(container, `<p>Content</p>`);
    patchDOM(container, ``);
    expect(container.children).toHaveLength(0);
  });
});
