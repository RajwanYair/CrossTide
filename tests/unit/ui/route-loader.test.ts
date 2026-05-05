/**
 * Unit tests for route-loader.ts (defineRoute).
 *
 * P8: Verifies reactive loading state, AbortController cancellation on
 * re-navigation, deduplication, and error capture.
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { defineRoute, registerRouteLoader, onRouteNavigated } from "../../../src/ui/route-loader";
import type { LoaderContext } from "../../../src/ui/route-loader";

// ── Helpers ──────────────────────────────────────────────────────────────────

function tick(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

// ── defineRoute ───────────────────────────────────────────────────────────────

describe("defineRoute", () => {
  it("starts with null data, not loading, no error", () => {
    const route = defineRoute({ name: "test-init", loader: async () => 42 });
    expect(route.data()).toBeNull();
    expect(route.loading()).toBe(false);
    expect(route.error()).toBeNull();
  });

  it("sets loading=true while loader is pending", async () => {
    let resolve: ((v: number) => void) | undefined;
    const promise = new Promise<number>((r) => {
      resolve = r;
    });
    const route = defineRoute({ name: "test-loading", loader: () => promise });

    void route.load({});
    expect(route.loading()).toBe(true);

    resolve!(99);
    await tick();
    expect(route.loading()).toBe(false);
    expect(route.data()).toBe(99);
  });

  it("stores resolved data", async () => {
    const route = defineRoute({
      name: "test-data",
      loader: async () => ({ value: 42 }),
    });
    await route.load({});
    expect(route.data()).toEqual({ value: 42 });
    expect(route.loading()).toBe(false);
    expect(route.error()).toBeNull();
  });

  it("captures errors and sets error signal", async () => {
    const route = defineRoute<number>({
      name: "test-error",
      loader: async () => {
        throw new Error("fetch failed");
      },
    });
    await route.load({});
    expect(route.error()?.message).toBe("fetch failed");
    expect(route.loading()).toBe(false);
    expect(route.data()).toBeNull();
  });

  it("wraps non-Error throws in an Error", async () => {
    const route = defineRoute<number>({
      name: "test-string-throw",
      loader: async () => {
        throw "string error";
      },
    });
    await route.load({});
    expect(route.error()).toBeInstanceOf(Error);
    expect(route.error()?.message).toBe("string error");
  });

  it("passes params and signal to the loader", async () => {
    const loader = vi.fn(async ({ params, signal }: LoaderContext) => ({
      ticker: params["symbol"],
      aborted: signal.aborted,
    }));
    const route = defineRoute({ name: "test-params", loader });
    await route.load({ symbol: "AAPL" });
    expect(loader).toHaveBeenCalledOnce();
    expect(loader.mock.calls[0]![0].params).toEqual({ symbol: "AAPL" });
    expect(route.data()?.ticker).toBe("AAPL");
  });

  describe("deduplication", () => {
    it("skips re-running loader for the same params when data exists", async () => {
      const loader = vi.fn(async () => 1);
      const route = defineRoute({ name: "test-dedupe", loader, dedupe: true });
      await route.load({ a: "1" });
      await route.load({ a: "1" }); // same params
      expect(loader).toHaveBeenCalledTimes(1);
    });

    it("re-runs loader when params change", async () => {
      const loader = vi.fn(async ({ params }: LoaderContext) => params["id"]);
      const route = defineRoute({ name: "test-dedupe-diff", loader, dedupe: true });
      await route.load({ id: "1" });
      await route.load({ id: "2" });
      expect(loader).toHaveBeenCalledTimes(2);
    });

    it("always re-runs when dedupe=false", async () => {
      const loader = vi.fn(async () => 1);
      const route = defineRoute({ name: "test-no-dedupe", loader, dedupe: false });
      await route.load({ a: "1" });
      await route.load({ a: "1" });
      expect(loader).toHaveBeenCalledTimes(2);
    });
  });

  describe("abort()", () => {
    it("aborts a pending load without setting error", async () => {
      let capturedSignal: AbortSignal | undefined;
      const loader = vi.fn(async ({ signal }: LoaderContext) => {
        capturedSignal = signal;
        // Simulate long async work
        await new Promise<void>((_, reject) =>
          signal.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError"))),
        );
        return 1;
      });
      const route = defineRoute<number>({ name: "test-abort", loader });
      const loadPromise = route.load({});
      route.abort();
      await loadPromise;
      expect(capturedSignal?.aborted).toBe(true);
      // AbortError should NOT be stored as a user-facing error
      expect(route.error()).toBeNull();
    });
  });
});

// ── onRouteNavigated ─────────────────────────────────────────────────────────

describe("onRouteNavigated", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("triggers the loader for the active route", async () => {
    const loader = vi.fn(async () => "hello");
    const route = defineRoute({ name: "nav-active", loader });
    registerRouteLoader(route as never);

    onRouteNavigated("nav-active", { ticker: "MSFT" });
    await tick();
    expect(loader).toHaveBeenCalledOnce();
  });
});
