import { describe, it, expect, vi } from "vitest";
import { withErrorBoundary } from "../../../src/cards/error-boundary";
import type { CardModule, CardContext } from "../../../src/cards/registry";

const ctx: CardContext = { route: "watchlist", params: {} };

describe("withErrorBoundary", () => {
  it("passes through a successful mount", () => {
    const card: CardModule = {
      mount: () => ({}),
    };
    const el = document.createElement("div");
    expect(() => withErrorBoundary(card).mount(el, ctx)).not.toThrow();
    expect(el.innerHTML).toBe("");
  });

  it("renders error fallback when mount throws", () => {
    const card: CardModule = {
      mount: () => {
        throw new Error("mount failed");
      },
    };
    const el = document.createElement("div");
    withErrorBoundary(card).mount(el, ctx);
    expect(el.innerHTML).toContain("mount failed");
    expect(el.innerHTML).toContain("card--error");
  });

  it("renders error fallback when update throws", () => {
    const card: CardModule = {
      mount: () => ({
        update: () => {
          throw new Error("update failed");
        },
      }),
    };
    const el = document.createElement("div");
    const handle = withErrorBoundary(card).mount(el, ctx);
    handle?.update?.(ctx);
    expect(el.innerHTML).toContain("update failed");
  });

  it("preserves dispose from wrapped handle", () => {
    const dispose = vi.fn();
    const card: CardModule = { mount: () => ({ dispose }) };
    const el = document.createElement("div");
    const handle = withErrorBoundary(card).mount(el, ctx);
    handle?.dispose?.();
    expect(dispose).toHaveBeenCalledOnce();
  });

  it("handles non-Error thrown values", () => {
    const card: CardModule = {
      mount: () => {
        throw "string error";
      },
    };
    const el = document.createElement("div");
    withErrorBoundary(card).mount(el, ctx);
    expect(el.innerHTML).toContain("string error");
  });

  it("does not wrap when card returns void", () => {
    const card: CardModule = { mount: () => {} };
    const el = document.createElement("div");
    const result = withErrorBoundary(card).mount(el, ctx);
    expect(result).toBeUndefined();
  });
});
