/**
 * Unit tests for src/ui/error-boundary.ts
 *
 * P9: Verifies that withErrorBoundary and mountWithBoundary wrap all card
 * mount() / update() calls so that a single card crash never kills the app.
 */
import { describe, it, expect, vi } from "vitest";
import { withErrorBoundary, mountWithBoundary } from "../../../src/ui/error-boundary";
import type { CardModule, CardContext } from "../../../src/cards/registry";

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeContainer(): HTMLElement {
  return document.createElement("div");
}

function makeCtx(route = "chart"): CardContext {
  return { route: route as CardContext["route"], params: {} };
}

function goodModule(): CardModule {
  return {
    mount: (container, _ctx) => {
      container.innerHTML = "<p>ok</p>";
      return {
        update(): void {
          container.innerHTML = "<p>updated</p>";
        },
        dispose(): void {
          container.innerHTML = "";
        },
      };
    },
  };
}

function crashingModule(): CardModule {
  return {
    mount: () => {
      throw new Error("mount crashed");
    },
  };
}

function crashingUpdateModule(): CardModule {
  let first = true;
  return {
    mount: (container, _ctx) => {
      container.innerHTML = "<p>ok</p>";
      return {
        update(): void {
          if (first) {
            first = false;
            throw new Error("update crashed");
          }
        },
      };
    },
  };
}

// ── withErrorBoundary ─────────────────────────────────────────────────────────

describe("withErrorBoundary", () => {
  it("renders the card normally when no error", () => {
    const container = makeContainer();
    const wrapped = withErrorBoundary(goodModule());
    const handle = wrapped.mount(container, makeCtx());
    expect(container.innerHTML).toContain("ok");
    expect(handle).toBeDefined();
  });

  it("renders a fallback UI when mount throws", () => {
    const container = makeContainer();
    const wrapped = withErrorBoundary(crashingModule(), { maxRetries: 0 });
    wrapped.mount(container, makeCtx());
    // Should show error-boundary element
    expect(container.querySelector(".error-boundary")).not.toBeNull();
    expect(container.querySelector(".error-boundary__retry")).not.toBeNull();
  });

  it("calls onError callback when mount throws", () => {
    const onError = vi.fn();
    const container = makeContainer();
    const wrapped = withErrorBoundary(crashingModule(), { maxRetries: 0, onError });
    wrapped.mount(container, makeCtx());
    expect(onError).toHaveBeenCalledOnce();
    expect(onError.mock.calls[0]![0]).toBeInstanceOf(Error);
  });

  it("renders fallback when update throws", () => {
    const container = makeContainer();
    const wrapped = withErrorBoundary(crashingUpdateModule(), { maxRetries: 0 });
    const handle = wrapped.mount(container, makeCtx());
    handle.update?.(makeCtx());
    expect(container.querySelector(".error-boundary")).not.toBeNull();
  });

  it("update is safe after mount success", () => {
    const container = makeContainer();
    const wrapped = withErrorBoundary(goodModule());
    const handle = wrapped.mount(container, makeCtx());
    expect(() => handle.update?.(makeCtx())).not.toThrow();
    expect(container.innerHTML).toContain("updated");
  });

  it("auto-retries mount up to maxRetries", () => {
    let calls = 0;
    const flakyModule: CardModule = {
      mount: (container) => {
        calls++;
        if (calls < 3) throw new Error("flaky");
        container.innerHTML = "<p>ok</p>";
        return { update(): void {} };
      },
    };
    const container = makeContainer();
    const wrapped = withErrorBoundary(flakyModule, { maxRetries: 2 });
    wrapped.mount(container, makeCtx());
    expect(calls).toBe(3);
    expect(container.innerHTML).toContain("ok");
  });
});

// ── mountWithBoundary ─────────────────────────────────────────────────────────

describe("mountWithBoundary", () => {
  it("mounts a good card and returns a handle", async () => {
    const container = makeContainer();
    const handle = await mountWithBoundary(container, makeCtx(), async () => goodModule());
    expect(container.innerHTML).toContain("ok");
    expect(handle).toBeDefined();
  });

  it("renders a load-failure fallback when the dynamic import throws", async () => {
    const container = makeContainer();
    const onError = vi.fn();
    await mountWithBoundary(
      container,
      makeCtx(),
      async () => {
        throw new Error("chunk load failed");
      },
      { maxRetries: 0, onError },
    );
    expect(container.querySelector(".error-boundary")).not.toBeNull();
    expect(onError).toHaveBeenCalledOnce();
  });

  it("retries a failing loader up to maxRetries", async () => {
    let attempts = 0;
    const container = makeContainer();
    await mountWithBoundary(
      container,
      makeCtx(),
      async () => {
        attempts++;
        if (attempts < 2) throw new Error("first attempt failed");
        return goodModule();
      },
      { maxRetries: 1 },
    );
    expect(attempts).toBe(2);
    expect(container.innerHTML).toContain("ok");
  });
});
