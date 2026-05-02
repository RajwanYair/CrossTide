/**
 * Tests for G9 — Popover API utility module.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  supportsPopover,
  openPopover,
  closePopover,
  togglePopover,
  isPopoverOpen,
  createManagedPopover,
  attachAnchorTrigger,
} from "../../../src/ui/popover";

// ─── helpers ─────────────────────────────────────────────────────────────────

function makeEl(): HTMLElement {
  return document.createElement("div");
}

/** Stub the Popover API on HTMLElement.prototype */
function stubPopoverApi(supported: boolean): () => void {
  if (supported) {
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
    // matches(":popover-open") — simulate via attribute check
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
  // Ensure the API is absent
  delete (HTMLElement.prototype as Record<string, unknown>).showPopover;
  delete (HTMLElement.prototype as Record<string, unknown>).hidePopover;
  delete (HTMLElement.prototype as Record<string, unknown>).togglePopover;
  return () => {
    /* nothing to restore */
  };
}

// ─── supportsPopover ─────────────────────────────────────────────────────────

describe("supportsPopover", () => {
  afterEach(() => {
    delete (HTMLElement.prototype as Record<string, unknown>).showPopover;
  });

  it("returns false when showPopover is absent", () => {
    delete (HTMLElement.prototype as Record<string, unknown>).showPopover;
    expect(supportsPopover()).toBe(false);
  });

  it("returns true when showPopover is present", () => {
    (HTMLElement.prototype as Record<string, unknown>).showPopover = vi.fn();
    expect(supportsPopover()).toBe(true);
  });
});

// ─── openPopover / closePopover ───────────────────────────────────────────────

describe("openPopover / closePopover (native path)", () => {
  let restore: () => void;
  beforeEach(() => {
    restore = stubPopoverApi(true);
  });
  afterEach(() => {
    restore();
    vi.restoreAllMocks();
  });

  it("calls showPopover on the element", () => {
    const el = makeEl();
    openPopover(el);
    expect((el as unknown as Record<string, unknown>).showPopover).toHaveBeenCalledTimes(1);
  });

  it("calls hidePopover on the element", () => {
    const el = makeEl();
    closePopover(el);
    expect((el as unknown as Record<string, unknown>).hidePopover).toHaveBeenCalledTimes(1);
  });
});

describe("openPopover / closePopover (fallback path)", () => {
  let restore: () => void;
  beforeEach(() => {
    restore = stubPopoverApi(false);
  });
  afterEach(() => {
    restore();
  });

  it("sets display:block via fallback", () => {
    const el = makeEl();
    el.style.display = "none";
    openPopover(el);
    expect(el.style.display).toBe("block");
  });

  it("sets display:none via fallback", () => {
    const el = makeEl();
    el.style.display = "block";
    closePopover(el);
    expect(el.style.display).toBe("none");
  });
});

// ─── togglePopover ────────────────────────────────────────────────────────────

describe("togglePopover (fallback)", () => {
  let restore: () => void;
  beforeEach(() => {
    restore = stubPopoverApi(false);
  });
  afterEach(() => {
    restore();
  });

  it("opens a closed element", () => {
    const el = makeEl();
    el.style.display = "none";
    togglePopover(el);
    expect(el.style.display).toBe("block");
  });

  it("closes an open element", () => {
    const el = makeEl();
    el.style.display = "block";
    togglePopover(el);
    expect(el.style.display).toBe("none");
  });
});

// ─── isPopoverOpen ────────────────────────────────────────────────────────────

describe("isPopoverOpen (fallback)", () => {
  let restore: () => void;
  beforeEach(() => {
    restore = stubPopoverApi(false);
  });
  afterEach(() => {
    restore();
  });

  it("returns false when display is empty", () => {
    const el = makeEl();
    expect(isPopoverOpen(el)).toBe(false);
  });

  it("returns true when display is block", () => {
    const el = makeEl();
    el.style.display = "block";
    expect(isPopoverOpen(el)).toBe(true);
  });

  it("returns false when display is none", () => {
    const el = makeEl();
    el.style.display = "none";
    expect(isPopoverOpen(el)).toBe(false);
  });
});

// ─── createManagedPopover ─────────────────────────────────────────────────────

describe("createManagedPopover (fallback)", () => {
  let restore: () => void;
  beforeEach(() => {
    restore = stubPopoverApi(false);
  });
  afterEach(() => {
    restore();
  });

  it("appends a div to host", () => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    const mp = createManagedPopover(host, "<span>hello</span>");
    expect(host.contains(mp.element)).toBe(true);
    host.remove();
  });

  it("populates content string", () => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    const mp = createManagedPopover(host, "<b>test</b>");
    expect(mp.element.innerHTML).toContain("test");
    host.remove();
  });

  it("show() / hide() change display", () => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    const mp = createManagedPopover(host, "content");
    mp.show();
    expect(mp.element.style.display).toBe("block");
    mp.hide();
    expect(mp.element.style.display).toBe("none");
    host.remove();
  });

  it("destroy() removes element from DOM", () => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    const mp = createManagedPopover(host, "bye");
    mp.destroy();
    expect(host.contains(mp.element)).toBe(false);
    host.remove();
  });

  it("accepts DocumentFragment as content", () => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    const frag = document.createDocumentFragment();
    const span = document.createElement("span");
    span.textContent = "fragment";
    frag.appendChild(span);
    const mp = createManagedPopover(host, frag);
    expect(mp.element.textContent).toBe("fragment");
    host.remove();
  });
});

// ─── attachAnchorTrigger ──────────────────────────────────────────────────────

describe("attachAnchorTrigger (fallback)", () => {
  let restore: () => void;
  beforeEach(() => {
    restore = stubPopoverApi(false);
  });
  afterEach(() => {
    restore();
  });

  it("attaches a click listener on the trigger", () => {
    const trigger = document.createElement("button");
    const popover = document.createElement("div");
    document.body.appendChild(popover);
    popover.style.display = "none";

    attachAnchorTrigger(trigger, popover);
    trigger.click();
    expect(popover.style.display).toBe("block");
    popover.remove();
  });

  it("cleanup removes click listener", () => {
    const trigger = document.createElement("button");
    const popover = document.createElement("div");
    document.body.appendChild(popover);
    popover.style.display = "none";

    const cleanup = attachAnchorTrigger(trigger, popover);
    cleanup();
    trigger.click();
    // display should remain none since listener was removed
    expect(popover.style.display).toBe("none");
    popover.remove();
  });
});
