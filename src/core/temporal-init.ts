/**
 * Temporal initializer — conditional polyfill loading.
 *
 * P15: Detects native Temporal support (Chrome 131+, Firefox 139+) and
 * only loads the polyfill (~40 KB gzip) when native support is absent.
 * Vite splits the dynamic import into a separate lazy chunk so modern
 * browsers skip the download entirely.
 *
 * Usage in app entry point:
 *   void ensureTemporal();  // fires before app mounts
 */

// Narrow cast that doesn't inherit the DOM's strict Temporal type constraint.
type GlobalWithTemporal = { Temporal?: unknown };

let _initPromise: Promise<void> | undefined;

/**
 * Returns true if the browser exposes a native Temporal global
 * (Chrome 131+, Firefox 139+, Safari 18.4+).
 */
export function isTemporalNative(): boolean {
  return typeof (globalThis as GlobalWithTemporal).Temporal !== "undefined";
}

/**
 * Ensures Temporal is available globally.
 * - If native Temporal exists, returns immediately (no bundle download).
 * - Otherwise, dynamically imports the polyfill (separate Vite chunk).
 * Multiple calls are safe — the promise is cached.
 */
export function ensureTemporal(): Promise<void> {
  if (_initPromise) return _initPromise;

  if (isTemporalNative()) {
    _initPromise = Promise.resolve();
    return _initPromise;
  }

  // Dynamic import — Vite/Rollup splits this into a separate lazy chunk.
  // Modern browsers (Chrome 131+) never execute this branch.
  _initPromise = import("@js-temporal/polyfill").then(({ Temporal }) => {
    (globalThis as GlobalWithTemporal).Temporal = Temporal;
  });

  return _initPromise;
}

/**
 * Synchronously returns the Temporal runtime object (native or polyfill).
 * Must be called after `ensureTemporal()` has resolved.
 *
 * Callers that need precise types should cast via `import type { Temporal }
 * from "@js-temporal/polyfill"`.
 *
 * @throws {Error} if neither native Temporal nor the polyfill is installed.
 */
export function getTemporalRuntime(): unknown {
  const t = (globalThis as GlobalWithTemporal).Temporal;
  if (t === undefined) {
    throw new Error(
      "Temporal runtime not available. Call ensureTemporal() and await it before using Temporal APIs.",
    );
  }
  return t;
}
