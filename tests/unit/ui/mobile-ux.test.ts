import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  onSwipe,
  pullToRefresh,
  getOrientation,
  onOrientationChange,
  type SwipeEvent,
} from "../../../src/ui/mobile-ux.js";

// Helper: simulate a touch sequence on an element
function simulateSwipe(
  el: HTMLElement,
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  durationMs = 100,
): void {
  const startTouch = { clientX: startX, clientY: startY } as Touch;
  const endTouch = { clientX: endX, clientY: endY } as Touch;

  const now = Date.now();
  vi.spyOn(Date, "now")
    .mockReturnValueOnce(now) // touchstart
    .mockReturnValueOnce(now + durationMs); // touchend

  el.dispatchEvent(
    new TouchEvent("touchstart", {
      touches: [startTouch],
      changedTouches: [startTouch],
    }),
  );
  el.dispatchEvent(
    new TouchEvent("touchend", {
      touches: [],
      changedTouches: [endTouch],
    }),
  );
}

describe("mobile-ux", () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
    vi.restoreAllMocks();
  });

  describe("onSwipe", () => {
    it("detects right swipe", () => {
      const events: SwipeEvent[] = [];
      const dispose = onSwipe(container, (e) => events.push(e), { threshold: 30 });

      simulateSwipe(container, 0, 100, 200, 100);

      expect(events).toHaveLength(1);
      expect(events[0]!.direction).toBe("right");
      expect(events[0]!.distance).toBe(200);
      dispose();
    });

    it("detects left swipe", () => {
      const events: SwipeEvent[] = [];
      const dispose = onSwipe(container, (e) => events.push(e), { threshold: 30 });

      simulateSwipe(container, 200, 100, 0, 100);

      expect(events).toHaveLength(1);
      expect(events[0]!.direction).toBe("left");
      dispose();
    });

    it("detects down swipe", () => {
      const events: SwipeEvent[] = [];
      const dispose = onSwipe(container, (e) => events.push(e), { threshold: 30 });

      simulateSwipe(container, 100, 0, 100, 200);

      expect(events).toHaveLength(1);
      expect(events[0]!.direction).toBe("down");
      dispose();
    });

    it("detects up swipe", () => {
      const events: SwipeEvent[] = [];
      const dispose = onSwipe(container, (e) => events.push(e), { threshold: 30 });

      simulateSwipe(container, 100, 200, 100, 0);

      expect(events).toHaveLength(1);
      expect(events[0]!.direction).toBe("up");
      dispose();
    });

    it("ignores swipes below threshold", () => {
      const events: SwipeEvent[] = [];
      const dispose = onSwipe(container, (e) => events.push(e), { threshold: 100 });

      simulateSwipe(container, 0, 100, 50, 100); // only 50px

      expect(events).toHaveLength(0);
      dispose();
    });

    it("ignores slow swipes", () => {
      const events: SwipeEvent[] = [];
      const dispose = onSwipe(container, (e) => events.push(e), {
        threshold: 30,
        minVelocity: 1,
      });

      simulateSwipe(container, 0, 100, 200, 100, 5000); // very slow

      expect(events).toHaveLength(0);
      dispose();
    });

    it("ignores diagonal swipes with axis lock", () => {
      const events: SwipeEvent[] = [];
      const dispose = onSwipe(container, (e) => events.push(e), {
        threshold: 30,
        axisLock: true,
      });

      // 45-degree diagonal: dx=100, dy=100; ratio = 1.0 < 1.5
      simulateSwipe(container, 0, 0, 100, 100);

      expect(events).toHaveLength(0);
      dispose();
    });

    it("stops listening after dispose", () => {
      const events: SwipeEvent[] = [];
      const dispose = onSwipe(container, (e) => events.push(e), { threshold: 30 });
      dispose();

      simulateSwipe(container, 0, 100, 200, 100);
      expect(events).toHaveLength(0);
    });
  });

  describe("pullToRefresh", () => {
    it("triggers refresh on sufficient pull-down", () => {
      const onRefresh = vi.fn();
      const dispose = pullToRefresh(container, onRefresh, { pullDistance: 50 });

      // Simulate: scrollTop is 0, pull down 100px
      Object.defineProperty(container, "scrollTop", { value: 0, configurable: true });

      const startTouch = { clientX: 100, clientY: 0 } as Touch;
      const endTouch = { clientX: 100, clientY: 100 } as Touch;

      container.dispatchEvent(
        new TouchEvent("touchstart", {
          touches: [startTouch],
          changedTouches: [startTouch],
        }),
      );
      container.dispatchEvent(
        new TouchEvent("touchend", {
          touches: [],
          changedTouches: [endTouch],
        }),
      );

      expect(onRefresh).toHaveBeenCalledOnce();
      dispose();
    });

    it("does not trigger when scrolled down", () => {
      const onRefresh = vi.fn();
      const dispose = pullToRefresh(container, onRefresh, { pullDistance: 50 });

      Object.defineProperty(container, "scrollTop", { value: 100, configurable: true });

      const touch = { clientX: 100, clientY: 0 } as Touch;
      container.dispatchEvent(
        new TouchEvent("touchstart", {
          touches: [touch],
          changedTouches: [touch],
        }),
      );
      const endTouch = { clientX: 100, clientY: 200 } as Touch;
      container.dispatchEvent(
        new TouchEvent("touchend", {
          touches: [],
          changedTouches: [endTouch],
        }),
      );

      expect(onRefresh).not.toHaveBeenCalled();
      dispose();
    });
  });

  describe("viewport helpers", () => {
    it("returns portrait or landscape", () => {
      const result = getOrientation();
      expect(["portrait", "landscape"]).toContain(result);
    });

    it("onOrientationChange returns dispose function", () => {
      const handler = vi.fn();
      const dispose = onOrientationChange(handler);
      expect(typeof dispose).toBe("function");
      dispose();
    });
  });
});
