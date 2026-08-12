/**
 * URL State Activation (B10) — wires `share-state.ts` to the browser
 * `location` / `history` API for deep-linking and shareable URLs.
 *
 * Usage:
 *   const state = readCurrentUrlState();          // read on startup
 *   updateCurrentUrlState({ symbol: "AAPL" });    // reflect state in URL
 *   const url = buildCurrentShareUrl({ symbol: "AAPL" }); // shareable URL
 *   const listener = onUrlStateChange((s) => ...); // back/forward nav
 *   listener.remove();                             // cleanup
 */

import { readShareUrl, buildShareUrl, encodeShareState, type ShareState } from "./share-state";

// ── Read ──────────────────────────────────────────────────────────────────────

/**
 * Read the share-state encoded in the current page URL (`?s=` param).
 * Returns `null` if no state is encoded in the current URL.
 *
 * Safe to call in non-browser environments (returns `null`).
 */
export function readCurrentUrlState(): ShareState | null {
  if (typeof location === "undefined") return null;
  return readShareUrl(location.href);
}

// ── Write ─────────────────────────────────────────────────────────────────────

/**
 * Reflect the given share-state in the browser URL using
 * `history.replaceState` (no navigation, no history entry added).
 *
 * Safe to call in non-browser environments (no-op).
 */
export function updateCurrentUrlState(state: ShareState): void {
  if (typeof history === "undefined" || typeof location === "undefined") return;
  const token = encodeShareState(state);
  const url = new URL(location.href);
  url.searchParams.set("s", token);
  history.replaceState(null, "", url.toString());
}

/**
 * Push the given share-state into the browser history as a new entry
 * (`history.pushState`). Use when the user explicitly navigates.
 *
 * Safe to call in non-browser environments (no-op).
 */
export function pushUrlState(state: ShareState): void {
  if (typeof history === "undefined" || typeof location === "undefined") return;
  const token = encodeShareState(state);
  const url = new URL(location.href);
  url.searchParams.set("s", token);
  history.pushState(null, "", url.toString());
}

/**
 * Remove the share-state `?s=` param from the current URL, keeping
 * any other query params intact.
 *
 * Safe to call in non-browser environments (no-op).
 */
export function clearUrlState(): void {
  if (typeof history === "undefined" || typeof location === "undefined") return;
  const url = new URL(location.href);
  url.searchParams.delete("s");
  history.replaceState(null, "", url.toString());
}

// ── Share URL ─────────────────────────────────────────────────────────────────

/**
 * Build a shareable URL from the current page URL + the given state.
 * This does NOT modify the browser URL.
 *
 * Safe to call in non-browser environments (uses `"http://localhost/"` as base).
 */
export function buildCurrentShareUrl(state: ShareState): string {
  const base = typeof location !== "undefined" ? location.href : "http://localhost/";
  return buildShareUrl(base, state);
}

// ── Listen ────────────────────────────────────────────────────────────────────

export interface UrlStateListener {
  /** Remove the popstate event listener. */
  remove(): void;
}

/**
 * Register a callback that fires whenever the user navigates back/forward
 * (popstate event) and there is a share-state `?s=` in the new URL.
 *
 * Returns a handle to remove the listener.
 *
 * Safe to call in non-browser environments (no-op, returns a no-op remover).
 */
export function onUrlStateChange(handler: (state: ShareState | null) => void): UrlStateListener {
  if (typeof window === "undefined") {
    return { remove: () => undefined };
  }

  function listener(): void {
    const state = readCurrentUrlState();
    handler(state);
  }

  window.addEventListener("popstate", listener);
  return {
    remove(): void {
      window.removeEventListener("popstate", listener);
    },
  };
}
