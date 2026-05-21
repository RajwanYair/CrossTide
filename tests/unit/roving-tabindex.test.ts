/**
 * Unit tests for roving tabindex navigation utility.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { enableRovingTabindex } from "../../src/ui/roving-tabindex";

function createList(n: number): HTMLElement {
  const ul = document.createElement("ul");
  ul.setAttribute("role", "listbox");
  for (let i = 0; i < n; i++) {
    const li = document.createElement("li");
    li.setAttribute("role", "option");
    li.className = "item";
    li.textContent = `Item ${i}`;
    ul.appendChild(li);
  }
  document.body.appendChild(ul);
  return ul;
}

function press(el: HTMLElement, key: string): void {
  el.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true }));
}

describe("enableRovingTabindex", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("sets tabindex=0 on first item and -1 on others", () => {
    const container = createList(4);
    enableRovingTabindex(container, { selector: ".item" });
    const items = container.querySelectorAll(".item");
    expect(items[0]!.getAttribute("tabindex")).toBe("0");
    expect(items[1]!.getAttribute("tabindex")).toBe("-1");
    expect(items[2]!.getAttribute("tabindex")).toBe("-1");
    expect(items[3]!.getAttribute("tabindex")).toBe("-1");
  });

  it("ArrowDown moves focus to next item", () => {
    const container = createList(4);
    const handle = enableRovingTabindex(container, {
      selector: ".item",
      orientation: "vertical",
    });
    const items = container.querySelectorAll<HTMLElement>(".item");
    items[0]!.focus();
    press(items[0]!, "ArrowDown");
    expect(handle.activeIndex()).toBe(1);
    expect(items[1]!.getAttribute("tabindex")).toBe("0");
    expect(items[0]!.getAttribute("tabindex")).toBe("-1");
  });

  it("ArrowUp moves focus to previous item", () => {
    const container = createList(4);
    const handle = enableRovingTabindex(container, {
      selector: ".item",
      orientation: "vertical",
    });
    const items = container.querySelectorAll<HTMLElement>(".item");
    handle.focusItem(2);
    press(items[2]!, "ArrowUp");
    expect(handle.activeIndex()).toBe(1);
  });

  it("wraps from last to first by default", () => {
    const container = createList(3);
    const handle = enableRovingTabindex(container, {
      selector: ".item",
      orientation: "vertical",
    });
    const items = container.querySelectorAll<HTMLElement>(".item");
    handle.focusItem(2);
    press(items[2]!, "ArrowDown");
    expect(handle.activeIndex()).toBe(0);
  });

  it("does not wrap when wrap=false", () => {
    const container = createList(3);
    const handle = enableRovingTabindex(container, {
      selector: ".item",
      orientation: "vertical",
      wrap: false,
    });
    const items = container.querySelectorAll<HTMLElement>(".item");
    handle.focusItem(2);
    press(items[2]!, "ArrowDown");
    expect(handle.activeIndex()).toBe(2); // stays at last
  });

  it("Home moves to first item", () => {
    const container = createList(5);
    const handle = enableRovingTabindex(container, { selector: ".item" });
    const items = container.querySelectorAll<HTMLElement>(".item");
    handle.focusItem(3);
    press(items[3]!, "Home");
    expect(handle.activeIndex()).toBe(0);
  });

  it("End moves to last item", () => {
    const container = createList(5);
    const handle = enableRovingTabindex(container, { selector: ".item" });
    const items = container.querySelectorAll<HTMLElement>(".item");
    press(items[0]!, "End");
    expect(handle.activeIndex()).toBe(4);
  });

  it("horizontal mode: ArrowRight/ArrowLeft navigate", () => {
    const container = createList(3);
    const handle = enableRovingTabindex(container, {
      selector: ".item",
      orientation: "horizontal",
    });
    const items = container.querySelectorAll<HTMLElement>(".item");
    items[0]!.focus();
    press(items[0]!, "ArrowRight");
    expect(handle.activeIndex()).toBe(1);
    press(items[1]!, "ArrowLeft");
    expect(handle.activeIndex()).toBe(0);
  });

  it("horizontal mode ignores ArrowUp/ArrowDown", () => {
    const container = createList(3);
    const handle = enableRovingTabindex(container, {
      selector: ".item",
      orientation: "horizontal",
    });
    const items = container.querySelectorAll<HTMLElement>(".item");
    items[0]!.focus();
    press(items[0]!, "ArrowDown");
    expect(handle.activeIndex()).toBe(0); // unchanged
  });

  it("onActivate callback fires on navigation", () => {
    const container = createList(3);
    const activated: number[] = [];
    enableRovingTabindex(container, {
      selector: ".item",
      orientation: "vertical",
      onActivate: (_el, idx) => activated.push(idx),
    });
    const items = container.querySelectorAll<HTMLElement>(".item");
    items[0]!.focus();
    press(items[0]!, "ArrowDown");
    press(items[1]!, "ArrowDown");
    expect(activated).toEqual([1, 2]);
  });

  it("destroy removes listeners and resets tabindex", () => {
    const container = createList(3);
    const handle = enableRovingTabindex(container, { selector: ".item" });
    handle.destroy();
    const items = container.querySelectorAll(".item");
    for (const item of items) {
      expect(item.hasAttribute("tabindex")).toBe(false);
    }
  });

  it("refresh updates item list after DOM changes", () => {
    const container = createList(2);
    const handle = enableRovingTabindex(container, { selector: ".item" });
    // Add a new item
    const newLi = document.createElement("li");
    newLi.className = "item";
    newLi.textContent = "Item 2";
    container.appendChild(newLi);
    handle.refresh();
    // New item should have tabindex="-1"
    expect(newLi.getAttribute("tabindex")).toBe("-1");
    // Navigate to last
    handle.focusItem(2);
    expect(handle.activeIndex()).toBe(2);
  });
});
