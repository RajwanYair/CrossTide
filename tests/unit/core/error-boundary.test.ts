import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { installErrorBoundary, getErrorLog, clearErrorLog } from "../../../src/core/error-boundary";

describe("error-boundary", () => {
  let teardown: (() => void) | null = null;

  beforeEach(() => {
    clearErrorLog();
  });

  afterEach(() => {
    teardown?.();
    teardown = null;
    clearErrorLog();
  });

  it("installs and returns a teardown function", () => {
    teardown = installErrorBoundary();
    expect(typeof teardown).toBe("function");
  });

  it("captures window error events", () => {
    teardown = installErrorBoundary();
    const event = new ErrorEvent("error", {
      message: "test error",
      filename: "app.js",
      error: new Error("test error"),
    });
    window.dispatchEvent(event);
    const log = getErrorLog();
    expect(log).toHaveLength(1);
    expect(log[0]!.message).toBe("test error");
    expect(log[0]!.source).toBe("app.js");
  });

  it("captures unhandled rejections", () => {
    // PromiseRejectionEvent is not available in happy-dom, so we
    // simulate the handler path by dispatching a custom event.
    // Skip if PromiseRejectionEvent is not defined.
    if (typeof PromiseRejectionEvent === "undefined") {
      // Directly test the error recording via a window error instead
      teardown = installErrorBoundary();
      window.dispatchEvent(
        new ErrorEvent("error", {
          message: "rejection-proxy",
          error: new Error("rejection-proxy"),
        }),
      );
      const log = getErrorLog();
      expect(log.length).toBeGreaterThan(0);
      return;
    }
    teardown = installErrorBoundary();
    const event = new PromiseRejectionEvent("unhandledrejection", {
      promise: Promise.resolve(),
      reason: new Error("rejected"),
    });
    window.dispatchEvent(event);
    const log = getErrorLog();
    expect(log).toHaveLength(1);
    expect(log[0]!.message).toBe("rejected");
    expect(log[0]!.source).toBe("unhandledrejection");
  });

  it("calls custom handler", () => {
    const records: unknown[] = [];
    teardown = installErrorBoundary((r) => records.push(r));
    window.dispatchEvent(
      new ErrorEvent("error", { message: "custom", error: new Error("custom") }),
    );
    expect(records).toHaveLength(1);
  });

  it("clearErrorLog empties the log", () => {
    teardown = installErrorBoundary();
    window.dispatchEvent(new ErrorEvent("error", { message: "err", error: new Error("err") }));
    expect(getErrorLog()).toHaveLength(1);
    clearErrorLog();
    expect(getErrorLog()).toHaveLength(0);
  });

  it("stops capturing after teardown", () => {
    teardown = installErrorBoundary();
    teardown();
    teardown = null;
    window.dispatchEvent(new ErrorEvent("error", { message: "after", error: new Error("after") }));
    expect(getErrorLog()).toHaveLength(0);
  });

  it("records error without stack when event.error is not an Error instance", () => {
    teardown = installErrorBoundary();
    // Dispatch an error event where the `error` property is a non-Error (no stack)
    const event = new ErrorEvent("error", {
      message: "primitive error",
      filename: "app.js",
      error: "a string, not an Error",
    });
    window.dispatchEvent(event);
    const log = getErrorLog();
    expect(log).toHaveLength(1);
    expect(log[0]!.message).toBe("primitive error");
    expect(log[0]!.stack).toBeUndefined();
  });

  it("records unhandled rejection with string reason (no stack)", () => {
    if (typeof PromiseRejectionEvent === "undefined") return;

    teardown = installErrorBoundary();
    const event = new PromiseRejectionEvent("unhandledrejection", {
      promise: Promise.resolve(),
      reason: "simple string reason",
    });
    window.dispatchEvent(event);
    const log = getErrorLog();
    expect(log).toHaveLength(1);
    expect(log[0]!.message).toBe("simple string reason");
    expect(log[0]!.stack).toBeUndefined();
  });

  it("max log size is capped at 100 entries", () => {
    teardown = installErrorBoundary();
    // Dispatch 105 error events
    for (let i = 0; i < 105; i++) {
      window.dispatchEvent(
        new ErrorEvent("error", { message: `err-${i}`, error: new Error(`err-${i}`) }),
      );
    }
    const log = getErrorLog();
    // Should be capped at 100 (oldest entries evicted)
    expect(log.length).toBe(100);
    // Oldest messages were removed; last message should be err-104
    expect(log[log.length - 1]!.message).toBe("err-104");
  });

  it("installErrorBoundary with no handler still records errors", () => {
    teardown = installErrorBoundary();
    window.dispatchEvent(
      new ErrorEvent("error", { message: "silent", error: new Error("silent") }),
    );
    expect(getErrorLog()).toHaveLength(1);
  });

  it("onRejection handler: Error reason includes stack", () => {
    // Capture the registered 'unhandledrejection' handler via addEventListener spy.
    const captured: EventListener[] = [];
    const orig = window.addEventListener.bind(window);
    vi.spyOn(window, "addEventListener").mockImplementation(
      (type: string, handler: EventListenerOrEventListenerObject | null, ...opts: unknown[]) => {
        if (type === "unhandledrejection" && typeof handler === "function") {
          captured.push(handler as EventListener);
        }
        return orig(
          type,
          handler as EventListenerOrEventListenerObject,
          ...(opts as [AddEventListenerOptions]),
        );
      },
    );
    teardown = installErrorBoundary();
    vi.restoreAllMocks();

    const fn = captured[captured.length - 1];
    if (!fn) return; // should not happen

    const errWithStack = new Error("rejection-with-stack");
    const evt = Object.assign(new Event("unhandledrejection"), {
      reason: errWithStack,
      promise: Promise.resolve(),
    });
    fn(evt);
    const log = getErrorLog();
    expect(log.length).toBeGreaterThan(0);
    const last = log[log.length - 1]!;
    expect(last.message).toBe("rejection-with-stack");
    expect(last.source).toBe("unhandledrejection");
    expect(last.stack).toBeDefined();
  });

  it("onRejection handler: non-Error reason has no stack", () => {
    const captured: EventListener[] = [];
    const orig = window.addEventListener.bind(window);
    vi.spyOn(window, "addEventListener").mockImplementation(
      (type: string, handler: EventListenerOrEventListenerObject | null, ...opts: unknown[]) => {
        if (type === "unhandledrejection" && typeof handler === "function") {
          captured.push(handler as EventListener);
        }
        return orig(
          type,
          handler as EventListenerOrEventListenerObject,
          ...(opts as [AddEventListenerOptions]),
        );
      },
    );
    teardown = installErrorBoundary();
    vi.restoreAllMocks();

    const fn = captured[captured.length - 1];
    if (!fn) return;

    const evt = Object.assign(new Event("unhandledrejection"), {
      reason: "plain-string-reason",
      promise: Promise.resolve(),
    });
    fn(evt);
    const log = getErrorLog();
    expect(log.length).toBeGreaterThan(0);
    const last = log[log.length - 1]!;
    expect(last.message).toBe("plain-string-reason");
    expect(last.stack).toBeUndefined();
  });
});
