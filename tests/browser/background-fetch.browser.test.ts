/**
 * Browser-mode tests for the Background Fetch feature detection.  (G17 / H7)
 *
 * Verifies backgroundFetchSupported() in a real Chromium context where
 * navigator.serviceWorker is a proper ServiceWorkerContainer (not undefined
 * as it is in happy-dom) and BackgroundFetchManager may be globally defined.
 */
import { describe, it, expect } from "vitest";
import { backgroundFetchSupported } from "../../src/core/background-fetch";

describe("backgroundFetchSupported (real browser)", () => {
  it("returns a boolean without throwing", () => {
    const result = backgroundFetchSupported();
    expect(typeof result).toBe("boolean");
  });

  it("navigator.serviceWorker is accessible in a secure Chromium context", () => {
    // In @vitest/browser the page is served over localhost (secure context)
    // so navigator.serviceWorker should exist
    expect(typeof navigator.serviceWorker).toBe("object");
    expect("serviceWorker" in navigator).toBe(true);
  });
});
