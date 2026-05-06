import { describe, it, expect, vi, afterEach } from "vitest";
import {
  isTemporalNative,
  ensureTemporal,
  getTemporalRuntime,
} from "../../../src/core/temporal-init";

describe("isTemporalNative", () => {
  it("returns a boolean", () => {
    expect(typeof isTemporalNative()).toBe("boolean");
  });

  it("returns true when globalThis.Temporal is set", () => {
    const saved = (globalThis as { Temporal?: unknown }).Temporal;
    (globalThis as { Temporal?: unknown }).Temporal = {};
    expect(isTemporalNative()).toBe(true);
    (globalThis as { Temporal?: unknown }).Temporal = saved;
  });

  it("returns false when globalThis.Temporal is absent", () => {
    const saved = (globalThis as { Temporal?: unknown }).Temporal;
    delete (globalThis as { Temporal?: unknown }).Temporal;
    expect(isTemporalNative()).toBe(false);
    (globalThis as { Temporal?: unknown }).Temporal = saved;
  });
});

describe("ensureTemporal", () => {
  afterEach(() => {
    // Reset module-level cache between tests by importing fresh
    vi.resetModules();
  });

  it("returns a Promise", () => {
    const result = ensureTemporal();
    expect(result).toBeInstanceOf(Promise);
  });

  it("resolves without throwing", async () => {
    await expect(ensureTemporal()).resolves.toBeUndefined();
  });

  it("sets globalThis.Temporal after resolving", async () => {
    await ensureTemporal();
    expect((globalThis as { Temporal?: unknown }).Temporal).toBeDefined();
  });

  it("multiple calls return the same promise (cached)", () => {
    const p1 = ensureTemporal();
    const p2 = ensureTemporal();
    expect(p1).toBe(p2);
  });
});

describe("getTemporalRuntime", () => {
  it("returns Temporal after ensureTemporal resolves", async () => {
    await ensureTemporal();
    const T = getTemporalRuntime();
    expect(T).toBeDefined();
    expect(typeof T.PlainDate).toBe("function");
  });

  it("throws when globalThis.Temporal is undefined", () => {
    const saved = (globalThis as { Temporal?: unknown }).Temporal;
    delete (globalThis as { Temporal?: unknown }).Temporal;
    expect(() => getTemporalRuntime()).toThrow("Temporal runtime not available");
    (globalThis as { Temporal?: unknown }).Temporal = saved;
  });
});

// ── Q16: Skip-if-present branch — explicit polyfill-free path ─────────────────

describe("ensureTemporal — skip polyfill when native Temporal is present (Q16)", () => {
  it("does not overwrite a pre-existing globalThis.Temporal (native path)", async () => {
    // Simulate a browser that already has native Temporal
    const nativeStub = { __isNativeStub: true };
    const g = globalThis as { Temporal?: unknown };
    const saved = g.Temporal;
    g.Temporal = nativeStub;

    try {
      vi.resetModules();
      const { ensureTemporal: ensureFresh, isTemporalNative: isFresh } =
        await import("../../../src/core/temporal-init");

      // Native detection must return true
      expect(isFresh()).toBe(true);

      // ensureTemporal must resolve quickly and must NOT replace our stub
      await ensureFresh();
      expect(g.Temporal).toBe(nativeStub);
    } finally {
      g.Temporal = saved;
    }
  });

  it("loads polyfill when Temporal is absent (polyfill path sets globalThis.Temporal)", async () => {
    const g = globalThis as { Temporal?: unknown };
    const saved = g.Temporal;
    delete g.Temporal;

    try {
      vi.resetModules();
      const { ensureTemporal: ensureFresh } = await import("../../../src/core/temporal-init");
      await ensureFresh();
      expect(g.Temporal).toBeDefined();
    } finally {
      g.Temporal = saved;
    }
  });
});
