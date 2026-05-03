/**
 * Additional coverage tests for src/core/plugin-api.ts
 * Targets uncovered lines 180-198: loadIndicatorModule dynamic-import body.
 *
 * Strategy: vi.mock intercepts the dynamic import() inside loadIndicatorModule
 * so the shape-checking branches execute without real network I/O.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  loadIndicatorModule,
  getIndicator,
  _resetPluginsForTests,
  type IndicatorPlugin,
} from "../../../src/core/plugin-api";

// ── vi.mock declarations must be at module scope (Vitest hoists them) ──────

// URL A: valid IndicatorPlugin default export → should auto-register
vi.mock("https://cdn.test.invalid/valid-plugin.mjs", () => ({
  default: {
    id: "coverage-plugin-a",
    name: "Coverage Plugin A",
    compute: (): IndicatorPlugin["compute"] extends infer F ? F : never =>
      ({ values: [], overlay: false }) as ReturnType<IndicatorPlugin["compute"]>,
  } satisfies Pick<IndicatorPlugin, "id" | "name" | "compute">,
}));

// URL B: default export is a plain string (not an IndicatorPlugin) → returns null
vi.mock("https://cdn.test.invalid/string-default.mjs", () => ({
  default: "not-a-plugin",
}));

// URL C: default export is an object but missing "compute" → returns null
vi.mock("https://cdn.test.invalid/no-compute.mjs", () => ({
  default: { id: "x", name: "X" },
}));

// URL D: default export is null (falsy) → short-circuits module.default && ... → returns null
vi.mock("https://cdn.test.invalid/no-default.mjs", () => ({ default: null }));

// URL E: same valid plugin as A (for duplicate-registration test)
vi.mock("https://cdn.test.invalid/duplicate-plugin.mjs", () => ({
  default: {
    id: "coverage-plugin-dup",
    name: "Coverage Plugin Dup",
    compute: (): ReturnType<IndicatorPlugin["compute"]> => ({ values: [], overlay: false }),
  } satisfies Pick<IndicatorPlugin, "id" | "name" | "compute">,
}));

// ──────────────────────────────────────────────────────────────────────────

beforeEach(() => {
  _resetPluginsForTests();
});

describe("loadIndicatorModule — auto-registration (lines 180-198)", () => {
  it("returns the plugin and registers it when default export is a valid IndicatorPlugin", async () => {
    const result = await loadIndicatorModule("https://cdn.test.invalid/valid-plugin.mjs", [
      "https://cdn.test.invalid",
    ]);
    expect(result).not.toBeNull();
    expect(result?.id).toBe("coverage-plugin-a");
    // Plugin is now in the registry
    expect(getIndicator("coverage-plugin-a")).toBeDefined();
  });

  it("returns null when default export is a string (wrong shape)", async () => {
    const result = await loadIndicatorModule("https://cdn.test.invalid/string-default.mjs", [
      "https://cdn.test.invalid",
    ]);
    expect(result).toBeNull();
  });

  it("returns null when default export is an object but missing compute", async () => {
    const result = await loadIndicatorModule("https://cdn.test.invalid/no-compute.mjs", [
      "https://cdn.test.invalid",
    ]);
    expect(result).toBeNull();
  });

  it("returns null when default export is null (falsy)", async () => {
    const result = await loadIndicatorModule("https://cdn.test.invalid/no-default.mjs", [
      "https://cdn.test.invalid",
    ]);
    expect(result).toBeNull();
  });

  it("does not double-register when loadIndicatorModule is called twice for the same plugin id", async () => {
    await loadIndicatorModule("https://cdn.test.invalid/duplicate-plugin.mjs", [
      "https://cdn.test.invalid",
    ]);
    // Second call: plugin already in registry → skip registerIndicator silently
    const result = await loadIndicatorModule("https://cdn.test.invalid/duplicate-plugin.mjs", [
      "https://cdn.test.invalid",
    ]);
    expect(result?.id).toBe("coverage-plugin-dup");
    // Only one entry in registry
    expect(getIndicator("coverage-plugin-dup")).toBeDefined();
  });

  it("skips origin check and loads when allowedOrigins is omitted", async () => {
    const result = await loadIndicatorModule(
      "https://cdn.test.invalid/valid-plugin.mjs",
      // no allowedOrigins — skips URL origin validation
    );
    expect(result?.id).toBe("coverage-plugin-a");
  });
});
