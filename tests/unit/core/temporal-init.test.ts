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
