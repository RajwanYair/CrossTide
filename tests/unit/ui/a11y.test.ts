import { describe, it, expect, beforeEach } from "vitest";
import { announce, trapFocus, prefersReducedMotion } from "../../../src/ui/a11y";

describe("announce", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("creates a live region", () => {
    announce("hello");
    const el = document.getElementById("sr-announcer");
    expect(el).not.toBeNull();
    expect(el!.getAttribute("aria-live")).toBe("polite");
    expect(el!.textContent).toBe("hello");
  });

  it("supports assertive priority", () => {
    announce("urgent", "assertive");
    const el = document.getElementById("sr-announcer");
    expect(el!.getAttribute("aria-live")).toBe("assertive");
  });

  it("reuses existing live region", () => {
    announce("first");
    announce("second");
    const els = document.querySelectorAll("#sr-announcer");
    expect(els).toHaveLength(1);
    expect(els[0]!.textContent).toBe("second");
  });
});

describe("trapFocus", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("returns a cleanup function", () => {
    const container = document.createElement("div");
    container.innerHTML = "<button>A</button><button>B</button>";
    document.body.appendChild(container);
    const cleanup = trapFocus(container);
    expect(typeof cleanup).toBe("function");
    cleanup();
  });

  it("focuses the first focusable element", () => {
    const container = document.createElement("div");
    const btn = document.createElement("button");
    btn.textContent = "First";
    container.appendChild(btn);
    document.body.appendChild(container);

    trapFocus(container);
    expect(document.activeElement).toBe(btn);
  });
});

describe("prefersReducedMotion", () => {
  it("returns a boolean", () => {
    expect(typeof prefersReducedMotion()).toBe("boolean");
  });
});
