import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { debounce, throttle } from "../../../src/core/throttle-debounce";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("debounce", () => {
  it("calls only after quiet period", () => {
    const fn = vi.fn();
    const d = debounce(fn, 100);
    d(1 as never);
    d(2 as never);
    d(3 as never);
    vi.advanceTimersByTime(50);
    expect(fn).not.toHaveBeenCalled();
    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith(3);
  });

  it("cancel prevents pending call", () => {
    const fn = vi.fn();
    const d = debounce(fn, 100);
    d(1 as never);
    d.cancel();
    vi.advanceTimersByTime(200);
    expect(fn).not.toHaveBeenCalled();
  });

  it("flush invokes pending immediately", () => {
    const fn = vi.fn();
    const d = debounce(fn, 100);
    d("x" as never);
    d.flush();
    expect(fn).toHaveBeenCalledWith("x");
  });

  it("flush is a no-op when nothing pending", () => {
    const fn = vi.fn();
    const d = debounce(fn, 100);
    d.flush();
    expect(fn).not.toHaveBeenCalled();
  });
});

describe("throttle", () => {
  it("invokes immediately on first call", () => {
    const fn = vi.fn();
    const t = throttle(fn, 100);
    t("a" as never);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("trailing call fires after interval", () => {
    const fn = vi.fn();
    const t = throttle(fn, 100);
    t("a" as never);
    t("b" as never);
    t("c" as never);
    expect(fn).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(150);
    expect(fn).toHaveBeenCalledTimes(2);
    expect(fn).toHaveBeenLastCalledWith("c");
  });

  it("respects interval between distinct invocations", () => {
    const fn = vi.fn();
    const t = throttle(fn, 100);
    t("a" as never);
    vi.advanceTimersByTime(120);
    t("b" as never);
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("cancel clears pending", () => {
    const fn = vi.fn();
    const t = throttle(fn, 100);
    t("a" as never);
    t("b" as never);
    t.cancel();
    vi.advanceTimersByTime(200);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("flush forces pending invocation", () => {
    const fn = vi.fn();
    const t = throttle(fn, 100);
    t("a" as never);
    t("b" as never);
    t.flush();
    expect(fn).toHaveBeenCalledTimes(2);
    expect(fn).toHaveBeenLastCalledWith("b");
  });
});
