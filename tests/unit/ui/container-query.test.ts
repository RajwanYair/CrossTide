import { describe, it, expect, vi } from "vitest";
import { classifyWidth, observeContainer } from "../../../src/ui/container-query";

describe("container-query", () => {
  it("classifyWidth picks the correct bucket", () => {
    expect(classifyWidth(100)).toBe("xs");
    expect(classifyWidth(320)).toBe("sm");
    expect(classifyWidth(480)).toBe("md");
    expect(classifyWidth(768)).toBe("lg");
    expect(classifyWidth(2000)).toBe("xl");
  });

  it("custom breakpoints respected", () => {
    expect(classifyWidth(50, { sm: 100, md: 200, lg: 300, xl: 400 })).toBe("xs");
    expect(classifyWidth(150, { sm: 100, md: 200, lg: 300, xl: 400 })).toBe("sm");
  });

  it("observeContainer reports initial size from getBoundingClientRect", () => {
    const el = document.createElement("div");
    Object.defineProperty(el, "getBoundingClientRect", {
      value: () => ({ width: 600, height: 0, top: 0, left: 0, right: 0, bottom: 0 }),
    });
    const h = observeContainer(el);
    expect(h.current).toBe("md");
    h.dispose();
  });

  it("observeContainer fires onChange when size class changes", () => {
    const el = document.createElement("div");
    Object.defineProperty(el, "getBoundingClientRect", {
      value: () => ({ width: 100, height: 0, top: 0, left: 0, right: 0, bottom: 0 }),
    });
    const onChange = vi.fn();

    let captured: ((entries: ResizeObserverEntry[]) => void) | null = null;
    class FakeRO {
      constructor(cb: (entries: ResizeObserverEntry[]) => void) {
        captured = cb;
      }
      observe(): void {}
      unobserve(): void {}
      disconnect(): void {}
    }
    const original = (globalThis as { ResizeObserver?: typeof ResizeObserver }).ResizeObserver;
    (globalThis as { ResizeObserver?: unknown }).ResizeObserver = FakeRO;

    const h = observeContainer(el, { onChange });
    expect(h.current).toBe("xs");
    captured?.([{ contentRect: { width: 800 } } as unknown as ResizeObserverEntry]);
    expect(onChange).toHaveBeenCalledWith("lg", 800);
    expect(h.current).toBe("lg");
    h.dispose();
    (globalThis as { ResizeObserver?: unknown }).ResizeObserver = original;
  });

  it("observeContainer handles missing ResizeObserver", () => {
    const el = document.createElement("div");
    Object.defineProperty(el, "getBoundingClientRect", {
      value: () => ({ width: 100, height: 0, top: 0, left: 0, right: 0, bottom: 0 }),
    });
    const original = (globalThis as { ResizeObserver?: typeof ResizeObserver }).ResizeObserver;
    (globalThis as { ResizeObserver?: unknown }).ResizeObserver = undefined;
    const h = observeContainer(el);
    expect(h.current).toBe("xs");
    h.dispose();
    (globalThis as { ResizeObserver?: unknown }).ResizeObserver = original;
  });
});
