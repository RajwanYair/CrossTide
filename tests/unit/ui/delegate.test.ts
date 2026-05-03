import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createDelegate } from "../../../src/ui/delegate";

describe("createDelegate (K4)", () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
  });

  it("dispatches click to matching data-action handler", () => {
    container.innerHTML = `<button data-action="test-action">Click</button>`;
    const calls: string[] = [];
    const delegate = createDelegate(container, {
      "test-action": (el) => calls.push(el.dataset["action"] ?? ""),
    });

    container.querySelector("button")!.click();
    expect(calls).toEqual(["test-action"]);

    delegate.dispose();
  });

  it("ignores clicks without data-action", () => {
    container.innerHTML = `<button>No action</button>`;
    const calls: string[] = [];
    createDelegate(container, {
      anything: () => calls.push("x"),
    });

    container.querySelector("button")!.click();
    expect(calls).toEqual([]);
  });

  it("matches ancestor with data-action (bubbling)", () => {
    container.innerHTML = `<div data-action="parent"><span class="icon">X</span></div>`;
    const calls: string[] = [];
    createDelegate(container, {
      parent: () => calls.push("hit"),
    });

    container.querySelector("span")!.click();
    expect(calls).toEqual(["hit"]);
  });

  it("does not fire after dispose", () => {
    container.innerHTML = `<button data-action="x">X</button>`;
    const calls: string[] = [];
    const d = createDelegate(container, { x: () => calls.push("x") });

    d.dispose();
    container.querySelector("button")!.click();
    expect(calls).toEqual([]);
  });

  it("supports custom event types", () => {
    container.innerHTML = `<input data-action="typed" />`;
    const calls: string[] = [];
    createDelegate(container, { typed: () => calls.push("input") }, { eventTypes: ["input"] });

    const input = container.querySelector("input")!;
    input.dispatchEvent(new Event("input", { bubbles: true }));
    expect(calls).toEqual(["input"]);
  });
});
