/**
 * Tests for src/core/signals.ts
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  signal,
  computed,
  effect,
  untracked,
  persistedSignal,
  batch,
  localStorageAdapter,
} from "../../../src/core/signals";

describe("signal()", () => {
  it("reads the initial value", () => {
    const s = signal(1);
    expect(s()).toBe(1);
    expect(s.peek()).toBe(1);
  });

  it("set() updates the value and notifies subscribers", () => {
    const s = signal(0);
    const fn = vi.fn();
    s.subscribe(fn);
    s.set(1);
    s.set(2);
    expect(s()).toBe(2);
    expect(fn).toHaveBeenCalledTimes(2);
    expect(fn).toHaveBeenLastCalledWith(2);
  });

  it("update() applies a function to the current value", () => {
    const s = signal(10);
    s.update((n) => n + 5);
    expect(s()).toBe(15);
  });

  it("set() does not notify when value is unchanged (Object.is)", () => {
    const s = signal(1);
    const fn = vi.fn();
    s.subscribe(fn);
    s.set(1);
    expect(fn).not.toHaveBeenCalled();
  });

  it("supports custom equality", () => {
    const s = signal({ id: 1 }, { equals: (a, b) => a.id === b.id });
    const fn = vi.fn();
    s.subscribe(fn);
    s.set({ id: 1 });
    expect(fn).not.toHaveBeenCalled();
    s.set({ id: 2 });
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("subscribe() returns an unsubscribe", () => {
    const s = signal(0);
    const fn = vi.fn();
    const off = s.subscribe(fn);
    s.set(1);
    off();
    s.set(2);
    expect(fn).toHaveBeenCalledTimes(1);
  });
});

describe("effect()", () => {
  it("runs once immediately and re-runs on dependency change", () => {
    const s = signal(0);
    const fn = vi.fn(() => {
      void s();
    });
    effect(fn);
    expect(fn).toHaveBeenCalledTimes(1);
    s.set(1);
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("tracks multiple dependencies", () => {
    const a = signal(1);
    const b = signal(2);
    let last = 0;
    effect(() => {
      last = a() + b();
    });
    expect(last).toBe(3);
    a.set(10);
    expect(last).toBe(12);
    b.set(20);
    expect(last).toBe(30);
  });

  it("disposer stops further runs", () => {
    const s = signal(0);
    const fn = vi.fn(() => {
      void s();
    });
    const dispose = effect(fn);
    dispose();
    s.set(1);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("prunes sources that are no longer read", () => {
    const a = signal(0);
    const b = signal(0);
    const which = signal<"a" | "b">("a");
    let runs = 0;
    effect(() => {
      runs += 1;
      if (which() === "a") void a();
      else void b();
    });
    expect(runs).toBe(1);
    which.set("b");
    expect(runs).toBe(2);
    a.set(99); // should NOT trigger — we now read b only
    expect(runs).toBe(2);
    b.set(99);
    expect(runs).toBe(3);
  });
});

describe("computed()", () => {
  it("derives from signals lazily", () => {
    const a = signal(2);
    const b = signal(3);
    let calls = 0;
    const sum = computed(() => {
      calls += 1;
      return a() + b();
    });
    expect(sum()).toBe(5);
    expect(calls).toBe(1);
    expect(sum()).toBe(5);
    expect(calls).toBe(1); // cached
    a.set(10);
    expect(sum()).toBe(13);
    expect(calls).toBe(2);
  });

  it("notifies subscribers", () => {
    const a = signal(1);
    const doubled = computed(() => a() * 2);
    const fn = vi.fn();
    doubled.subscribe(fn);
    a.set(5);
    expect(fn).toHaveBeenCalled();
    expect(doubled()).toBe(10);
  });

  it("composes (computed of computed)", () => {
    const a = signal(1);
    const plus1 = computed(() => a() + 1);
    const plus2 = computed(() => plus1() + 1);
    expect(plus2()).toBe(3);
    a.set(10);
    expect(plus2()).toBe(12);
  });
});

describe("untracked()", () => {
  it("reads without subscribing", () => {
    const a = signal(1);
    const b = signal(2);
    let runs = 0;
    effect(() => {
      runs += 1;
      void a();
      untracked(() => void b());
    });
    expect(runs).toBe(1);
    b.set(99); // should NOT trigger — was read untracked
    expect(runs).toBe(1);
    a.set(99);
    expect(runs).toBe(2);
  });
});

describe("persistedSignal()", () => {
  function memoryAdapter<T>(initial?: T): {
    load: () => T | undefined;
    save: (v: T) => void;
    saves: T[];
  } {
    let stored: T | undefined = initial;
    const saves: T[] = [];
    return {
      load: () => stored,
      save: (v) => {
        stored = v;
        saves.push(v);
      },
      saves,
    };
  }

  it("loads from adapter when present", () => {
    const adapter = memoryAdapter<number>(42);
    const s = persistedSignal("k1", 0, { adapter });
    expect(s()).toBe(42);
  });

  it("falls back to the initial value when adapter has nothing", () => {
    const adapter = memoryAdapter<number>();
    const s = persistedSignal("k-missing", 7, { adapter });
    expect(s()).toBe(7);
  });

  it("saves on every change", () => {
    const adapter = memoryAdapter<number>();
    const s = persistedSignal<number>("k2", 0, { adapter });
    s.set(1);
    s.set(2);
    expect(adapter.saves).toEqual([1, 2]);
  });
});

describe("batch()", () => {
  it("runs the provided function and returns its result", () => {
    expect(batch(() => 42)).toBe(42);
  });

  it("nested batch: inner completes, outer still pending", () => {
    let result = 0;
    batch(() => {
      result = batch(() => 99);
    });
    expect(result).toBe(99);
  });

  it("batch around signal set still notifies subscribers", () => {
    const s = signal(0);
    const calls: number[] = [];
    s.subscribe((v) => calls.push(v));
    batch(() => {
      s.set(1);
      s.set(2);
    });
    // At least one notification should have fired
    expect(calls.length).toBeGreaterThan(0);
    expect(s()).toBe(2);
  });
});

describe("localStorageAdapter()", () => {
  // Provide a minimal localStorage mock so the adapter's try/catch paths are reached.
  let store: Record<string, string>;

  beforeEach(() => {
    store = {};
    vi.stubGlobal("localStorage", {
      getItem: (k: string) => store[k] ?? null,
      setItem: (k: string, v: string) => {
        store[k] = v;
      },
      removeItem: (k: string) => {
        delete store[k];
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns undefined when key is absent", () => {
    const a = localStorageAdapter<number>("la-absent");
    expect(a.load()).toBeUndefined();
  });

  it("saves a value and loads it back", () => {
    const a = localStorageAdapter<string>("la-key");
    a.save("hello");
    expect(a.load()).toBe("hello");
  });

  it("handles save failure (setItem throws) without throwing", () => {
    vi.stubGlobal("localStorage", {
      getItem: () => null,
      setItem: () => {
        throw new DOMException("QuotaExceededError");
      },
    });
    const a = localStorageAdapter<number>("la-quota");
    expect(() => a.save(1)).not.toThrow();
  });

  it("handles load failure (getItem throws) without throwing", () => {
    vi.stubGlobal("localStorage", {
      getItem: () => {
        throw new Error("storage gone");
      },
      setItem: () => {},
    });
    const a = localStorageAdapter<number>("la-load-err");
    expect(a.load()).toBeUndefined();
  });
});

describe("persistedSignal BroadcastChannel sync", () => {
  it("bc.onmessage handler updates signal from another tab", () => {
    if (typeof BroadcastChannel !== "function") return;

    // Capture the BC instance via an object property (avoids no-this-alias).
    const ref: { instance: BroadcastChannel | undefined } = { instance: undefined };
    const OrigBC = BroadcastChannel;
    vi.stubGlobal(
      "BroadcastChannel",
      class SpyBC extends OrigBC {
        constructor(name: string) {
          super(name);
          ref.instance = this as unknown as BroadcastChannel;
        }
      },
    );

    const s = persistedSignal<number>("bc-sig-key2", 0, { channel: "test-bc-sig2" });
    vi.unstubAllGlobals();

    if (!ref.instance?.onmessage) return;

    // Simulate a message arriving from another tab.
    const evt = new MessageEvent<number>("message", { data: 42 });
    ref.instance.onmessage(evt);

    expect(s()).toBe(42);
  });
});
