/**
 * Scroll-driven coverage boost — targets attachScrollProgress native path
 * (lines 140-171) and scroll event fallback edge cases.
 */
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { attachScrollProgress, createViewTimeline } from "../../../src/ui/scroll-driven";

describe("attachScrollProgress — fallback scroll handler", () => {
  it("calls onProgress with 0 when element is not scrollable", () => {
    const el = document.createElement("div");
    Object.defineProperty(el, "scrollHeight", { value: 100 });
    Object.defineProperty(el, "clientHeight", { value: 100 });
    Object.defineProperty(el, "scrollTop", { value: 0 });

    const spy = vi.fn();
    const cleanup = attachScrollProgress(el, spy);

    el.dispatchEvent(new Event("scroll"));
    expect(spy).toHaveBeenCalledWith(0);
    cleanup();
  });

  it("calls onProgress with ratio when element is scrollable", () => {
    const el = document.createElement("div");
    Object.defineProperty(el, "scrollHeight", { value: 200 });
    Object.defineProperty(el, "clientHeight", { value: 100 });
    Object.defineProperty(el, "scrollTop", { value: 50 });

    const spy = vi.fn();
    const cleanup = attachScrollProgress(el, spy);

    el.dispatchEvent(new Event("scroll"));
    expect(spy).toHaveBeenCalledWith(0.5);
    cleanup();
  });

  it("clamps ratio to [0, 1]", () => {
    const el = document.createElement("div");
    Object.defineProperty(el, "scrollHeight", { value: 200 });
    Object.defineProperty(el, "clientHeight", { value: 100 });
    Object.defineProperty(el, "scrollTop", { value: 150 }); // beyond max

    const spy = vi.fn();
    const cleanup = attachScrollProgress(el, spy);

    el.dispatchEvent(new Event("scroll"));
    expect(spy).toHaveBeenCalledWith(1);
    cleanup();
  });
});

describe("attachScrollProgress — native path", () => {
  let rafCallbacks: (() => void)[];

  beforeEach(() => {
    rafCallbacks = [];
    // Stub ScrollTimeline
    (globalThis as Record<string, unknown>)["ScrollTimeline"] = class {
      constructor() {
        return {};
      }
    };
    // Stub requestAnimationFrame
    vi.spyOn(globalThis, "requestAnimationFrame").mockImplementation((cb) => {
      rafCallbacks.push(cb as () => void);
      return rafCallbacks.length;
    });
  });

  afterEach(() => {
    delete (globalThis as Record<string, unknown>)["ScrollTimeline"];
    vi.restoreAllMocks();
  });

  function makeEl(mockAnim: Record<string, unknown>): HTMLElement {
    const el = document.createElement("div");
    (el as unknown as Record<string, unknown>).animate = vi.fn().mockReturnValue(mockAnim);
    return el;
  }

  it("uses native ScrollTimeline when supported", () => {
    const mockAnim = {
      currentTime: 0.5,
      playState: "finished" as const,
      cancel: vi.fn(),
    };
    const el = makeEl(mockAnim);

    const spy = vi.fn();
    const cleanup = attachScrollProgress(el, spy);

    // Execute the rAF callback
    expect(rafCallbacks).toHaveLength(1);
    rafCallbacks[0]!();

    expect(spy).toHaveBeenCalledWith(0.5);
    cleanup();
    expect(mockAnim.cancel).toHaveBeenCalled();
  });

  it("requests another frame when animation is running", () => {
    const mockAnim = {
      currentTime: 0.3,
      playState: "running" as const,
      cancel: vi.fn(),
    };
    const el = makeEl(mockAnim);

    const spy = vi.fn();
    attachScrollProgress(el, spy);

    // First rAF
    rafCallbacks[0]!();
    expect(spy).toHaveBeenCalledWith(0.3);
    // Should have requested another frame since playState is "running"
    expect(rafCallbacks).toHaveLength(2);
  });

  it("handles null currentTime gracefully", () => {
    const mockAnim = {
      currentTime: null,
      playState: "finished" as const,
      cancel: vi.fn(),
    };
    const el = makeEl(mockAnim);

    const spy = vi.fn();
    attachScrollProgress(el, spy);

    // Execute rAF — should not call onProgress since currentTime is null
    rafCallbacks[0]!();
    expect(spy).not.toHaveBeenCalled();
  });

  it("handles non-number currentTime (CSSNumericValue)", () => {
    const mockAnim = {
      currentTime: { value: 0.7 }, // non-number
      playState: "finished" as const,
      cancel: vi.fn(),
    };
    const el = makeEl(mockAnim);

    const spy = vi.fn();
    attachScrollProgress(el, spy);

    rafCallbacks[0]!();
    // non-number currentTime → progress = 0
    expect(spy).toHaveBeenCalledWith(0);
  });

  it("clamps progress to [0, 1] in native path", () => {
    const mockAnim = {
      currentTime: 1.5,
      playState: "finished" as const,
      cancel: vi.fn(),
    };
    const el = makeEl(mockAnim);

    const spy = vi.fn();
    attachScrollProgress(el, spy);

    rafCallbacks[0]!();
    expect(spy).toHaveBeenCalledWith(1);
  });
});

describe("createViewTimeline — dispose", () => {
  afterEach(() => {
    delete (globalThis as Record<string, unknown>)["ViewTimeline"];
  });

  it("dispose is a no-op function", () => {
    (globalThis as Record<string, unknown>)["ViewTimeline"] = class {};
    const el = document.createElement("div");
    const handle = createViewTimeline(el)!;
    expect(() => handle.dispose()).not.toThrow();
  });
});
