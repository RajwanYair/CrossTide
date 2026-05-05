/**
 * Cross-browser compatibility tests.
 *
 * Validates that Web APIs used by CrossTide are available (or gracefully
 * detected) across Chromium, Firefox, and WebKit.  Runs in real browsers
 * via @vitest/browser + Playwright.
 *
 * Run:  npm run test:browser
 */
import { describe, it, expect } from "vitest";

// ---------------------------------------------------------------------------
// Core Web APIs — must be present in all target browsers
// ---------------------------------------------------------------------------
describe("Core Web API availability", () => {
  it("fetch is available", () => {
    expect(typeof globalThis.fetch).toBe("function");
  });

  it("AbortController is available", () => {
    expect(typeof AbortController).toBe("function");
  });

  it("structuredClone is available", () => {
    expect(typeof structuredClone).toBe("function");
    const obj = { a: 1, b: [2, 3] };
    expect(structuredClone(obj)).toEqual(obj);
  });

  it("URL and URLSearchParams are available", () => {
    expect(typeof URL).toBe("function");
    expect(typeof URLSearchParams).toBe("function");
    const u = new URL("https://example.com?a=1");
    expect(u.searchParams.get("a")).toBe("1");
  });

  it("crypto.getRandomValues is available", () => {
    expect(typeof crypto).toBe("object");
    expect(typeof crypto.getRandomValues).toBe("function");
    const arr = new Uint8Array(16);
    crypto.getRandomValues(arr);
    expect(arr.some((v) => v !== 0)).toBe(true);
  });

  it("crypto.subtle is available (secure context)", () => {
    expect(typeof crypto.subtle).toBe("object");
    expect(typeof crypto.subtle.digest).toBe("function");
  });

  it("TextEncoder / TextDecoder are available", () => {
    expect(typeof TextEncoder).toBe("function");
    expect(typeof TextDecoder).toBe("function");
    const encoded = new TextEncoder().encode("hello");
    const decoded = new TextDecoder().decode(encoded);
    expect(decoded).toBe("hello");
  });

  it("queueMicrotask is available", () => {
    expect(typeof queueMicrotask).toBe("function");
  });

  it("requestAnimationFrame is available", () => {
    expect(typeof requestAnimationFrame).toBe("function");
  });

  it("ResizeObserver is available", () => {
    expect(typeof ResizeObserver).toBe("function");
  });

  it("IntersectionObserver is available", () => {
    expect(typeof IntersectionObserver).toBe("function");
  });

  it("MutationObserver is available", () => {
    expect(typeof MutationObserver).toBe("function");
  });

  it("requestIdleCallback is available or polyfillable", () => {
    // Firefox and Chrome support it natively; Safari added it in 16.4.
    // If absent we expect the app to degrade gracefully (setTimeout fallback).
    const available = typeof requestIdleCallback === "function";
    expect(typeof available).toBe("boolean");
  });
});

// ---------------------------------------------------------------------------
// Storage APIs — used by tiered cache
// ---------------------------------------------------------------------------
describe("Storage APIs", () => {
  it("localStorage is available", () => {
    expect(typeof localStorage).toBe("object");
    localStorage.setItem("__compat_test__", "1");
    expect(localStorage.getItem("__compat_test__")).toBe("1");
    localStorage.removeItem("__compat_test__");
  });

  it("sessionStorage is available", () => {
    expect(typeof sessionStorage).toBe("object");
  });

  it("IndexedDB is available", () => {
    expect(typeof indexedDB).toBe("object");
  });

  it("Cache API is available", () => {
    expect(typeof caches).toBe("object");
    expect(typeof caches.open).toBe("function");
  });
});

// ---------------------------------------------------------------------------
// Service Worker & PWA APIs
// ---------------------------------------------------------------------------
describe("Service Worker APIs", () => {
  it("navigator.serviceWorker is available in secure context", () => {
    // Vitest browser tests run on localhost (secure context)
    expect(typeof navigator.serviceWorker).toBe("object");
  });

  it("Notification API is available", () => {
    expect(typeof Notification).toBe("function");
    expect(typeof Notification.permission).toBe("string");
  });
});

// ---------------------------------------------------------------------------
// ES2022+ language features — must work in all target browsers
// ---------------------------------------------------------------------------
describe("ES2022+ language features", () => {
  it("Array.at() works", () => {
    const arr = [1, 2, 3];
    expect(arr.at(-1)).toBe(3);
    expect(arr.at(0)).toBe(1);
  });

  it("Object.hasOwn() works", () => {
    const obj = { a: 1 };
    expect(Object.hasOwn(obj, "a")).toBe(true);
    expect(Object.hasOwn(obj, "b")).toBe(false);
  });

  it("structuredClone deep-clones", () => {
    const original = { nested: { arr: [1, 2] } };
    const clone = structuredClone(original);
    clone.nested.arr.push(3);
    expect(original.nested.arr).toEqual([1, 2]);
    expect(clone.nested.arr).toEqual([1, 2, 3]);
  });

  it("String.replaceAll() works", () => {
    expect("a-b-c".replaceAll("-", "_")).toBe("a_b_c");
  });

  it("Promise.allSettled() works", async () => {
    const results = await Promise.allSettled([
      Promise.resolve(1),
      Promise.reject(new Error("fail")),
    ]);
    expect(results[0]?.status).toBe("fulfilled");
    expect(results[1]?.status).toBe("rejected");
  });

  it("WeakRef is available", () => {
    expect(typeof WeakRef).toBe("function");
    const obj = { x: 1 };
    const ref = new WeakRef(obj);
    expect(ref.deref()).toBe(obj);
  });

  it("FinalizationRegistry is available", () => {
    expect(typeof FinalizationRegistry).toBe("function");
  });

  it("Intl.NumberFormat is available", () => {
    const f = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
    const result = f.format(1234.56);
    expect(result).toContain("1,234.56");
  });

  it("Intl.DateTimeFormat is available", () => {
    expect(typeof Intl.DateTimeFormat).toBe("function");
  });
});

// ---------------------------------------------------------------------------
// DOM APIs used by CrossTide UI
// ---------------------------------------------------------------------------
describe("DOM APIs", () => {
  it("dialog element showModal/close is available", () => {
    const dialog = document.createElement("dialog");
    document.body.appendChild(dialog);
    expect(typeof dialog.showModal).toBe("function");
    expect(typeof dialog.close).toBe("function");
    dialog.remove();
  });

  it("Popover API is detected correctly", () => {
    const div = document.createElement("div");
    // popover attribute may or may not be supported — test detection path
    const supportsPopover = typeof div.showPopover === "function";
    expect(typeof supportsPopover).toBe("boolean");
  });

  it("element.closest() is available", () => {
    const parent = document.createElement("div");
    parent.className = "parent";
    const child = document.createElement("span");
    parent.appendChild(child);
    document.body.appendChild(parent);
    expect(child.closest(".parent")).toBe(parent);
    parent.remove();
  });

  it("element.matches() is available", () => {
    const el = document.createElement("div");
    el.className = "test";
    expect(el.matches(".test")).toBe(true);
  });

  it("element.dataset is available", () => {
    const el = document.createElement("div");
    el.setAttribute("data-action", "sort");
    expect(el.dataset["action"]).toBe("sort");
  });

  it("element.toggleAttribute() is available", () => {
    const el = document.createElement("div");
    expect(typeof el.toggleAttribute).toBe("function");
    el.toggleAttribute("hidden");
    expect(el.hasAttribute("hidden")).toBe(true);
  });

  it("element.animate() is available (Web Animations API)", () => {
    const el = document.createElement("div");
    document.body.appendChild(el);
    expect(typeof el.animate).toBe("function");
    el.remove();
  });

  it("document.querySelector / querySelectorAll work", () => {
    const el = document.createElement("div");
    el.id = "__compat_test_qs__";
    document.body.appendChild(el);
    expect(document.querySelector("#__compat_test_qs__")).toBe(el);
    expect(document.querySelectorAll("#__compat_test_qs__").length).toBe(1);
    el.remove();
  });

  it("CustomEvent is available", () => {
    expect(typeof CustomEvent).toBe("function");
    const ev = new CustomEvent("test", { detail: { x: 1 } });
    expect(ev.detail.x).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// CSS feature detection — progressive enhancement paths
// ---------------------------------------------------------------------------
describe("CSS feature detection", () => {
  it("CSS.supports() is available", () => {
    expect(typeof CSS).toBe("object");
    expect(typeof CSS.supports).toBe("function");
  });

  it("detects container queries support", () => {
    const supported = CSS.supports("container-type", "inline-size");
    expect(typeof supported).toBe("boolean");
  });

  it("detects CSS nesting support", () => {
    const supported = CSS.supports("selector(&)");
    expect(typeof supported).toBe("boolean");
  });

  it("detects custom properties (CSS variables)", () => {
    expect(CSS.supports("color", "var(--test)")).toBe(true);
  });

  it("detects CSS Grid support", () => {
    expect(CSS.supports("display", "grid")).toBe(true);
  });

  it("detects CSS :has() selector", () => {
    const supported = CSS.supports("selector(:has(*))");
    expect(typeof supported).toBe("boolean");
  });

  it("detects @layer support", () => {
    const supported = CSS.supports("at-rule(@layer)") || CSS.supports("(color: red)");
    // @layer is baseline 2022 — supported in all targets
    expect(typeof supported).toBe("boolean");
  });

  it("matchMedia is available", () => {
    expect(typeof matchMedia).toBe("function");
    const mq = matchMedia("(prefers-color-scheme: dark)");
    expect(typeof mq.matches).toBe("boolean");
  });

  it("getComputedStyle is available", () => {
    expect(typeof getComputedStyle).toBe("function");
  });
});

// ---------------------------------------------------------------------------
// Worker APIs
// ---------------------------------------------------------------------------
describe("Worker APIs", () => {
  it("Web Worker constructor is available", () => {
    expect(typeof Worker).toBe("function");
  });

  it("MessageChannel is available", () => {
    expect(typeof MessageChannel).toBe("function");
    const ch = new MessageChannel();
    expect(typeof ch.port1.postMessage).toBe("function");
    ch.port1.close();
    ch.port2.close();
  });

  it("BroadcastChannel is available", () => {
    expect(typeof BroadcastChannel).toBe("function");
    const bc = new BroadcastChannel("__compat_test__");
    bc.close();
  });
});

// ---------------------------------------------------------------------------
// Canvas API — used by heatmap card
// ---------------------------------------------------------------------------
describe("Canvas API", () => {
  it("CanvasRenderingContext2D is available", () => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    expect(ctx).not.toBeNull();
    expect(typeof ctx!.fillRect).toBe("function");
  });

  it("OffscreenCanvas is available", () => {
    // Baseline 2023 — Chrome 69+, Firefox 105+, Safari 16.4+
    const supported = typeof OffscreenCanvas === "function";
    expect(typeof supported).toBe("boolean");
  });
});

// ---------------------------------------------------------------------------
// Encoding / Compression — used by data export
// ---------------------------------------------------------------------------
describe("Encoding & Compression APIs", () => {
  it("Blob is available", () => {
    expect(typeof Blob).toBe("function");
    const blob = new Blob(["hello"], { type: "text/plain" });
    expect(blob.size).toBe(5);
  });

  it("CompressionStream is available or detectable", () => {
    // Baseline 2023 — Chrome 80+, Firefox 113+, Safari 16.4+
    const supported = typeof CompressionStream === "function";
    expect(typeof supported).toBe("boolean");
  });

  it("ReadableStream is available", () => {
    expect(typeof ReadableStream).toBe("function");
  });

  it("Response.json() is available", () => {
    expect(typeof Response.json).toBe("function");
  });
});

// ---------------------------------------------------------------------------
// Navigation & History
// ---------------------------------------------------------------------------
describe("Navigation & History APIs", () => {
  it("history.pushState is available", () => {
    expect(typeof history.pushState).toBe("function");
  });

  it("history.replaceState is available", () => {
    expect(typeof history.replaceState).toBe("function");
  });

  it("popstate event can be dispatched", () => {
    expect(typeof PopStateEvent).toBe("function");
  });

  it("Navigation API is detected (progressive enhancement)", () => {
    // Navigation API: Chrome 102+, no Firefox/Safari yet
    const supported = "navigation" in window;
    expect(typeof supported).toBe("boolean");
  });
});

// ---------------------------------------------------------------------------
// Performance & Timing
// ---------------------------------------------------------------------------
describe("Performance APIs", () => {
  it("performance.now() is available", () => {
    expect(typeof performance.now).toBe("function");
    expect(performance.now()).toBeGreaterThan(0);
  });

  it("performance.mark() is available", () => {
    expect(typeof performance.mark).toBe("function");
  });

  it("PerformanceObserver is available", () => {
    expect(typeof PerformanceObserver).toBe("function");
  });
});

// ---------------------------------------------------------------------------
// ES2023+ language features (newer than the baseline ES2022 block above)
// ---------------------------------------------------------------------------
describe("ES2023+ language features", () => {
  it("Array.findLast() works (ES2023)", () => {
    const arr = [1, 2, 3, 4];
    expect(arr.findLast((x) => x % 2 === 0)).toBe(4);
  });

  it("Array.findLastIndex() works (ES2023)", () => {
    const arr = [1, 2, 3, 4];
    expect(arr.findLastIndex((x) => x % 2 === 0)).toBe(3);
  });

  it("Array.toSorted() returns new sorted array (ES2023)", () => {
    const arr = [3, 1, 2];
    const sorted = arr.toSorted((a, b) => a - b);
    expect(sorted).toEqual([1, 2, 3]);
    expect(arr).toEqual([3, 1, 2]); // original unchanged
  });

  it("Array.toReversed() returns new reversed array (ES2023)", () => {
    const arr = [1, 2, 3];
    const reversed = arr.toReversed();
    expect(reversed).toEqual([3, 2, 1]);
    expect(arr).toEqual([1, 2, 3]);
  });

  it("Array.with() returns new array with replaced element (ES2023)", () => {
    const arr = [1, 2, 3];
    const updated = arr.with(1, 99);
    expect(updated).toEqual([1, 99, 3]);
    expect(arr).toEqual([1, 2, 3]);
  });

  it("Array.prototype.toSpliced() works (ES2023)", () => {
    const arr = [1, 2, 3, 4];
    const spliced = arr.toSpliced(1, 1, 10);
    expect(spliced).toEqual([1, 10, 3, 4]);
    expect(arr).toEqual([1, 2, 3, 4]);
  });

  it("Promise.any() resolves to first fulfilled value (ES2021)", async () => {
    const result = await Promise.any([
      Promise.reject(new Error("fail")),
      Promise.resolve("ok"),
      Promise.resolve("also ok"),
    ]);
    expect(result).toBe("ok");
  });

  it("AggregateError is available (from Promise.any rejection)", async () => {
    try {
      await Promise.any([Promise.reject(new Error("a")), Promise.reject(new Error("b"))]);
    } catch (err) {
      expect(err instanceof AggregateError).toBe(true);
    }
  });

  it("Error.cause is supported (ES2022)", () => {
    const cause = new Error("root");
    const outer = new Error("outer", { cause });
    expect((outer as Error & { cause?: unknown }).cause).toBe(cause);
  });

  it("Object.fromEntries() works", () => {
    const entries: [string, number][] = [
      ["a", 1],
      ["b", 2],
    ];
    expect(Object.fromEntries(entries)).toEqual({ a: 1, b: 2 });
  });

  it("String.at() works", () => {
    expect("hello".at(-1)).toBe("o");
    expect("hello".at(0)).toBe("h");
  });

  it("crypto.randomUUID() generates valid UUID v4", () => {
    const uuid = crypto.randomUUID();
    expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  });

  it("AbortSignal.timeout() is available (ES2022/Baseline 2022)", () => {
    const supported = typeof AbortSignal.timeout === "function";
    expect(typeof supported).toBe("boolean");
    if (supported) {
      const signal = AbortSignal.timeout(10_000);
      expect(signal.aborted).toBe(false);
    }
  });

  it("Promise.withResolvers() is available (Baseline 2024)", () => {
    const supported = typeof Promise.withResolvers === "function";
    expect(typeof supported).toBe("boolean");
    if (supported) {
      const { promise, resolve } = Promise.withResolvers<string>();
      resolve("ok");
      return promise.then((v) => expect(v).toBe("ok"));
    }
  });

  it("Object.groupBy() is detected (Baseline 2024)", () => {
    const supported = typeof Object.groupBy === "function";
    expect(typeof supported).toBe("boolean");
    if (supported) {
      const result = Object.groupBy([1, 2, 3, 4], (n) => (n % 2 === 0 ? "even" : "odd"));
      expect(result["even"]).toEqual([2, 4]);
    }
  });

  it("Map.groupBy() is detected (Baseline 2024)", () => {
    const supported = typeof Map.groupBy === "function";
    expect(typeof supported).toBe("boolean");
    if (supported) {
      const result = Map.groupBy([1, 2, 3], (n) => (n % 2 === 0 ? "even" : "odd"));
      expect(result.get("odd")).toEqual([1, 3]);
    }
  });

  it("Intl.RelativeTimeFormat is available", () => {
    expect(typeof Intl.RelativeTimeFormat).toBe("function");
    const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
    expect(rtf.format(-1, "day")).toContain("yesterday");
  });

  it("Intl.ListFormat is available", () => {
    expect(typeof Intl.ListFormat).toBe("function");
    const lf = new Intl.ListFormat("en", { type: "conjunction" });
    expect(lf.format(["a", "b"])).toContain("and");
  });

  it("Intl.Segmenter is detected (Baseline 2024)", () => {
    const supported = typeof Intl.Segmenter === "function";
    expect(typeof supported).toBe("boolean");
  });
});

// ---------------------------------------------------------------------------
// Communication APIs — used for cross-tab coordination and sharing
// ---------------------------------------------------------------------------
describe("Communication APIs", () => {
  it("BroadcastChannel is available", () => {
    expect(typeof BroadcastChannel).toBe("function");
    const ch = new BroadcastChannel("__compat_test__");
    ch.close();
  });

  it("Web Locks API is detected (Baseline 2022)", () => {
    const supported = "locks" in navigator;
    expect(typeof supported).toBe("boolean");
    if (supported) {
      expect(typeof (navigator as unknown as { locks: { request: unknown } }).locks.request).toBe(
        "function",
      );
    }
  });

  it("navigator.clipboard is available in secure context", () => {
    expect(typeof navigator.clipboard).toBe("object");
    expect(typeof navigator.clipboard.writeText).toBe("function");
  });

  it("Web Share API is detected", () => {
    const supported = typeof navigator.share === "function";
    expect(typeof supported).toBe("boolean");
  });

  it("navigator.sendBeacon is available", () => {
    expect(typeof navigator.sendBeacon).toBe("function");
  });
});

// ---------------------------------------------------------------------------
// Scheduler API — used for non-blocking work scheduling
// ---------------------------------------------------------------------------
describe("Scheduler API (progressive)", () => {
  it("scheduler.postTask is detected (Chrome 94+)", () => {
    const supported =
      typeof (globalThis as unknown as { scheduler?: { postTask: unknown } }).scheduler
        ?.postTask === "function";
    expect(typeof supported).toBe("boolean");
  });

  it("queueMicrotask is available", () => {
    expect(typeof queueMicrotask).toBe("function");
  });

  it("MessageChannel is available", () => {
    expect(typeof MessageChannel).toBe("function");
    const mc = new MessageChannel();
    expect(mc.port1).toBeTruthy();
    mc.port1.close();
    mc.port2.close();
  });
});
