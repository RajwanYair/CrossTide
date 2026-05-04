/**
 * Disposable helpers (G12) — explicit resource management primitives.
 */
import { describe, it, expect, vi } from "vitest";
import {
  toDisposable,
  abortOnDispose,
  onRouteChangeDisposable,
} from "../../../src/core/disposable";

describe("toDisposable", () => {
  it("calls teardown on dispose", () => {
    const fn = vi.fn();
    const d = toDisposable(fn);
    d[Symbol.dispose]();
    expect(fn).toHaveBeenCalledOnce();
  });

  it("is usable with the using keyword", () => {
    const fn = vi.fn();
    {
      using _d = toDisposable(fn);
      expect(fn).not.toHaveBeenCalled();
    }
    expect(fn).toHaveBeenCalledOnce();
  });
});

describe("abortOnDispose", () => {
  it("exposes the controller signal", () => {
    const ctl = new AbortController();
    const d = abortOnDispose(ctl);
    expect(d.signal).toBe(ctl.signal);
  });

  it("aborts via abort() method", () => {
    const ctl = new AbortController();
    const d = abortOnDispose(ctl);
    expect(d.signal.aborted).toBe(false);
    d.abort();
    expect(d.signal.aborted).toBe(true);
  });

  it("aborts on Symbol.dispose", () => {
    const ctl = new AbortController();
    const d = abortOnDispose(ctl);
    expect(ctl.signal.aborted).toBe(false);
    d[Symbol.dispose]();
    expect(ctl.signal.aborted).toBe(true);
  });

  it("aborts via using keyword", () => {
    const ctl = new AbortController();
    {
      using _d = abortOnDispose(ctl);
      expect(ctl.signal.aborted).toBe(false);
    }
    expect(ctl.signal.aborted).toBe(true);
  });
});

describe("onRouteChangeDisposable", () => {
  it("registers handler with the provided register fn", () => {
    const registerFn = vi.fn().mockReturnValue(vi.fn());
    const handler = vi.fn();
    onRouteChangeDisposable(handler, registerFn);
    expect(registerFn).toHaveBeenCalledWith(handler);
  });

  it("unregisters on dispose", () => {
    const unsubscribe = vi.fn();
    const registerFn = vi.fn().mockReturnValue(unsubscribe);
    const d = onRouteChangeDisposable(vi.fn(), registerFn);
    expect(unsubscribe).not.toHaveBeenCalled();
    d[Symbol.dispose]();
    expect(unsubscribe).toHaveBeenCalledOnce();
  });
});
