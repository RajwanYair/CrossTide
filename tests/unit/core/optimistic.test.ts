import { describe, it, expect, vi } from "vitest";
import {
  optimisticMutation,
  withPayload,
  type MutationStore,
} from "../../../src/core/optimistic";

function makeStore<S>(initial: S): MutationStore<S> & { snapshots: S[] } {
  let s = initial;
  const snapshots: S[] = [initial];
  return {
    snapshots,
    get(): S {
      return s;
    },
    set(next: S): void {
      s = next;
      snapshots.push(next);
    },
  };
}

describe("optimistic", () => {
  it("applies optimistically and commits on success", async () => {
    const store = makeStore<number>(0);
    const result = await optimisticMutation(store, {
      apply: (n) => n + 1,
      commit: () => Promise.resolve("ok"),
    });
    expect(result).toEqual({ ok: true, value: "ok" });
    expect(store.get()).toBe(1);
  });

  it("rolls back on failure", async () => {
    const store = makeStore<number>(0);
    const result = await optimisticMutation(store, {
      apply: (n) => n + 1,
      commit: () => Promise.reject(new Error("boom")),
    });
    expect(result.ok).toBe(false);
    expect(store.get()).toBe(0);
  });

  it("applies optimistic state synchronously before commit resolves", async () => {
    const store = makeStore<number>(0);
    let valueDuring = -1;
    const promise = optimisticMutation(store, {
      apply: (n) => n + 5,
      commit: async () => {
        valueDuring = store.get();
        return null;
      },
    });
    await promise;
    expect(valueDuring).toBe(5);
  });

  it("calls onSuccess on commit success", async () => {
    const onSuccess = vi.fn();
    await optimisticMutation(makeStore(0), {
      apply: (n) => n + 1,
      commit: () => Promise.resolve("v"),
      onSuccess,
    });
    expect(onSuccess).toHaveBeenCalledWith("v");
  });

  it("calls onError on commit failure", async () => {
    const onError = vi.fn();
    await optimisticMutation(makeStore(0), {
      apply: (n) => n + 1,
      commit: () => Promise.reject(new Error("nope")),
      onError,
    });
    expect(onError).toHaveBeenCalled();
  });

  it("snapshot history shows apply→rollback for failures", async () => {
    const store = makeStore<number>(0);
    await optimisticMutation(store, {
      apply: (n) => n + 1,
      commit: () => Promise.reject(new Error("nope")),
    });
    expect(store.snapshots).toEqual([0, 1, 0]);
  });

  it("withPayload curries an apply function", () => {
    const factory = withPayload<{ items: string[] }, string>((s, item) => ({
      items: [...s.items, item],
    }));
    const apply = factory("hello");
    expect(apply({ items: [] })).toEqual({ items: ["hello"] });
  });
});
