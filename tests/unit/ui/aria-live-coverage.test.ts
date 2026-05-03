/**
 * Additional coverage tests for src/ui/aria-live.ts
 *
 * Targets uncovered branches:
 *  - Line 19: typeof document === "undefined" → return null
 *  - Lines 47-48: ensureRegion returns null → announce returns false
 *  - Line 57: clearAnnouncements in non-DOM (document undefined)
 *  - Line 60: clearAnnouncements when element doesn't exist (el is null)
 *
 * Uses @vitest-environment node to simulate a non-DOM environment.
 */
// @vitest-environment node
import { describe, it, expect } from "vitest";

describe("aria-live — non-DOM environment (lines 19, 47-48, 57)", () => {
  it("announce returns false when document is undefined", async () => {
    // In Node environment, document is not defined
    const { announce } = await import("../../../src/ui/aria-live");
    expect(typeof document).toBe("undefined");
    const result = announce("hello");
    expect(result).toBe(false);
  });

  it("announce returns false for assertive when document is undefined", async () => {
    const { announce } = await import("../../../src/ui/aria-live");
    expect(announce("urgent", "assertive")).toBe(false);
  });

  it("clearAnnouncements is a no-op when document is undefined", async () => {
    const { clearAnnouncements } = await import("../../../src/ui/aria-live");
    // Should not throw
    expect(() => clearAnnouncements()).not.toThrow();
  });
});
