/**
 * Reactive State Store tests.
 */
import { describe, it, expect, vi } from "vitest";
import { createStore } from "../../../src/core/state";

describe("createStore", () => {
  it("returns initial values via get()", () => {
    const store = createStore({ count: 0, name: "test" });
    expect(store.get("count")).toBe(0);
    expect(store.get("name")).toBe("test");
  });

  it("updates values via set()", () => {
    const store = createStore({ count: 0 });
    store.set("count", 42);
    expect(store.get("count")).toBe(42);
  });

  it("notifies listeners on set()", () => {
    const store = createStore({ count: 0 });
    const listener = vi.fn();
    store.on("count", listener);
    store.set("count", 5);
    expect(listener).toHaveBeenCalledWith(5);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("returns unsubscribe function from on()", () => {
    const store = createStore({ count: 0 });
    const listener = vi.fn();
    const unsub = store.on("count", listener);
    store.set("count", 1);
    expect(listener).toHaveBeenCalledTimes(1);

    unsub();
    store.set("count", 2);
    expect(listener).toHaveBeenCalledTimes(1); // not called again
  });

  it("snapshot() returns a copy of state", () => {
    const store = createStore({ x: 1, y: "hello" });
    const snap = store.snapshot();
    expect(snap).toEqual({ x: 1, y: "hello" });
    // Mutating snapshot does not affect store
    store.set("x", 99);
    expect(snap.x).toBe(1);
  });

  it("supports multiple listeners on same key", () => {
    const store = createStore({ val: "" });
    const a = vi.fn();
    const b = vi.fn();
    store.on("val", a);
    store.on("val", b);
    store.set("val", "updated");
    expect(a).toHaveBeenCalledWith("updated");
    expect(b).toHaveBeenCalledWith("updated");
  });

  it("does not notify listeners for other keys", () => {
    const store = createStore({ a: 0, b: 0 });
    const listener = vi.fn();
    store.on("a", listener);
    store.set("b", 99);
    expect(listener).not.toHaveBeenCalled();
  });
});
