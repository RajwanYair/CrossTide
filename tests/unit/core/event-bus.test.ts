import { describe, it, expect, vi } from "vitest";
import { createEventBus } from "../../../src/core/event-bus";

interface Map {
  click: { x: number; y: number };
  ready: void;
  error: Error;
}

describe("event-bus", () => {
  it("emits payloads to all subscribers in order", () => {
    const bus = createEventBus<Map>();
    const calls: number[] = [];
    bus.on("click", (p) => calls.push(p.x));
    bus.on("click", (p) => calls.push(p.x * 10));
    bus.emit("click", { x: 1, y: 2 });
    expect(calls).toEqual([1, 10]);
  });

  it("on returns unsubscribe fn", () => {
    const bus = createEventBus<Map>();
    const spy = vi.fn();
    const off = bus.on("ready", spy);
    bus.emit("ready", undefined);
    off();
    bus.emit("ready", undefined);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("once fires only once", () => {
    const bus = createEventBus<Map>();
    const spy = vi.fn();
    bus.once("ready", spy);
    bus.emit("ready", undefined);
    bus.emit("ready", undefined);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("off removes a specific handler", () => {
    const bus = createEventBus<Map>();
    const a = vi.fn();
    const b = vi.fn();
    bus.on("ready", a);
    bus.on("ready", b);
    bus.off("ready", a);
    bus.emit("ready", undefined);
    expect(a).not.toHaveBeenCalled();
    expect(b).toHaveBeenCalledOnce();
  });

  it("listenerCount and removeAllListeners", () => {
    const bus = createEventBus<Map>();
    bus.on("ready", () => {});
    bus.on("ready", () => {});
    bus.on("click", () => {});
    expect(bus.listenerCount("ready")).toBe(2);
    bus.removeAllListeners("ready");
    expect(bus.listenerCount("ready")).toBe(0);
    expect(bus.listenerCount("click")).toBe(1);
    bus.removeAllListeners();
    expect(bus.listenerCount("click")).toBe(0);
  });

  it("isolates handler errors via onError", () => {
    const onError = vi.fn();
    const bus = createEventBus<Map>({ onError });
    const ok = vi.fn();
    bus.on("ready", () => {
      throw new Error("boom");
    });
    bus.on("ready", ok);
    bus.emit("ready", undefined);
    expect(ok).toHaveBeenCalledOnce();
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError.mock.calls[0]![1]).toBe("ready");
  });

  it("safe to add/remove during emit (snapshot)", () => {
    const bus = createEventBus<Map>();
    const calls: string[] = [];
    bus.on("ready", () => {
      calls.push("first");
      bus.on("ready", () => calls.push("late")); // should not run this emit
    });
    bus.on("ready", () => calls.push("second"));
    bus.emit("ready", undefined);
    expect(calls).toEqual(["first", "second"]);
    bus.emit("ready", undefined);
    expect(calls).toEqual(["first", "second", "first", "second", "late"]);
  });

  it("emit with no subscribers is a noop", () => {
    const bus = createEventBus<Map>();
    expect(() => bus.emit("ready", undefined)).not.toThrow();
  });
});
