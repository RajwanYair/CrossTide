/**
 * Additional coverage tests for src/ui/popover.ts
 * Targets uncovered lines:
 *  - 68: native el.togglePopover() when supportsPopover() = true
 *  - 81: native el.matches(":popover-open") when supportsPopover() = true
 *  - 127: toggle() lambda body in ManagedPopover handle (never called by existing tests)
 *  - 151-152: popovertarget attribute path in attachAnchorTrigger when supported
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  togglePopover,
  isPopoverOpen,
  createManagedPopover,
  attachAnchorTrigger,
} from "../../../src/ui/popover";

// ── Popover API stub ──────────────────────────────────────────────────────────

function stubPopoverApi(): () => void {
  const stubs = {
    showPopover: vi.fn(function (this: HTMLElement) {
      this.setAttribute("popover-open", "");
    }),
    hidePopover: vi.fn(function (this: HTMLElement) {
      this.removeAttribute("popover-open");
    }),
    togglePopover: vi.fn(function (this: HTMLElement) {
      if (this.hasAttribute("popover-open")) {
        this.removeAttribute("popover-open");
      } else {
        this.setAttribute("popover-open", "");
      }
    }),
  };
  Object.assign(HTMLElement.prototype, stubs);
  const origMatches = HTMLElement.prototype.matches;
  HTMLElement.prototype.matches = function (selector: string) {
    if (selector === ":popover-open") return this.hasAttribute("popover-open");
    return origMatches.call(this, selector);
  };
  return () => {
    delete (HTMLElement.prototype as Record<string, unknown>).showPopover;
    delete (HTMLElement.prototype as Record<string, unknown>).hidePopover;
    delete (HTMLElement.prototype as Record<string, unknown>).togglePopover;
    HTMLElement.prototype.matches = origMatches;
  };
}

// ──────────────────────────────────────────────────────────────────────────────

describe("togglePopover — native API path (line 68)", () => {
  let restore: () => void;
  beforeEach(() => {
    restore = stubPopoverApi();
  });
  afterEach(() => {
    restore();
  });

  it("calls el.togglePopover() when supportsPopover() is true", () => {
    const el = document.createElement("div");
    document.body.appendChild(el);

    togglePopover(el);
    expect(el.hasAttribute("popover-open")).toBe(true);

    togglePopover(el);
    expect(el.hasAttribute("popover-open")).toBe(false);

    el.remove();
  });
});

describe("isPopoverOpen — native API path (line 81)", () => {
  let restore: () => void;
  beforeEach(() => {
    restore = stubPopoverApi();
  });
  afterEach(() => {
    restore();
  });

  it("returns true via :popover-open pseudo-class when element is open", () => {
    const el = document.createElement("div");
    document.body.appendChild(el);

    expect(isPopoverOpen(el)).toBe(false);

    el.setAttribute("popover-open", ""); // simulate open state
    expect(isPopoverOpen(el)).toBe(true);

    el.remove();
  });
});

describe("createManagedPopover — toggle() handle method (line 127)", () => {
  let restore: () => void;
  beforeEach(() => {
    restore = stubPopoverApi();
  });
  afterEach(() => {
    restore();
  });

  it("toggle() on managed popover calls togglePopover on the element", () => {
    const host = document.createElement("div");
    document.body.appendChild(host);

    const mp = createManagedPopover(host, "<span>content</span>");

    // Initially closed
    expect(isPopoverOpen(mp.element)).toBe(false);

    mp.toggle();
    expect(isPopoverOpen(mp.element)).toBe(true);

    mp.toggle();
    expect(isPopoverOpen(mp.element)).toBe(false);

    mp.destroy();
    host.remove();
  });
});

describe("attachAnchorTrigger — native popovertarget path (lines 151-152)", () => {
  let restore: () => void;
  beforeEach(() => {
    restore = stubPopoverApi();
  });
  afterEach(() => {
    restore();
  });

  it("sets popovertarget attribute when supportsPopover() and popover.id are truthy", () => {
    const trigger = document.createElement("button");
    const popover = document.createElement("div");
    popover.id = "my-popover-id";
    document.body.appendChild(trigger);
    document.body.appendChild(popover);

    const cleanup = attachAnchorTrigger(trigger, popover);

    expect(trigger.getAttribute("popovertarget")).toBe("my-popover-id");

    cleanup();
    expect(trigger.hasAttribute("popovertarget")).toBe(false);

    trigger.remove();
    popover.remove();
  });

  it("falls back to click listener when popover has no id", () => {
    const trigger = document.createElement("button");
    const popover = document.createElement("div");
    // no id set
    document.body.appendChild(trigger);
    document.body.appendChild(popover);

    const cleanup = attachAnchorTrigger(trigger, popover);

    // Should NOT have popovertarget (falls back to listener)
    expect(trigger.hasAttribute("popovertarget")).toBe(false);

    cleanup();
    trigger.remove();
    popover.remove();
  });
});
