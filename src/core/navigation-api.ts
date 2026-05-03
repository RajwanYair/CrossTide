/**
 * Navigation API progressive enhancement (G8).
 *
 * The Navigation API (Chrome 102+, Firefox 127+) provides a cleaner SPA
 * navigation model than History API + popstate:
 *
 *   - `navigateEvent.intercept({ handler })` ties the navigation to a promise,
 *     enabling automatic loading-state management.
 *   - `navigateEvent.signal` is an AbortSignal that cancels in-flight fetches
 *     when the user navigates away mid-flight.
 *   - `navigation.currentEntry.url` replaces `location.pathname` for the
 *     current URL — always up to date even during transitions.
 *
 * This module exports a thin progressive-enhancement layer:
 *   - `supportsNavigationApi()` — feature-detect without throwing.
 *   - `interceptNavigation(handler)` — wire the Navigation API when available;
 *     falls back to a no-op (History API is already in router.ts).
 *   - `navigateWithApi(url)` — prefer `navigation.navigate(url)` if available;
 *     falls back to `history.pushState + dispatchEvent(popstate)`.
 *   - `currentNavigationUrl()` — reads from Navigation API when available,
 *     falls back to `location.href`.
 *   - `onNavigationStart(cb)` — subscribe to `navigate` events (fires before
 *     handler); safe to call even without API support.
 *
 * @see https://developer.chrome.com/docs/web-platform/navigation-api/
 */

/** Minimal subset of the Navigation API needed for the PE layer. */
export interface NavigationApiLike {
  currentEntry: { url: string } | null;
  navigate(
    url: string,
    options?: { info?: unknown },
  ): { committed: Promise<unknown>; finished: Promise<unknown> };
  addEventListener(type: "navigate", handler: (e: NavigateEventLike) => void): void;
  removeEventListener(type: "navigate", handler: (e: NavigateEventLike) => void): void;
}

/** Minimal NavigateEvent surface used in this module. */
export interface NavigateEventLike {
  readonly destination: { readonly url: string };
  readonly canIntercept: boolean;
  readonly signal: AbortSignal;
  readonly hashChange: boolean;
  readonly downloadRequest: string | null;
  intercept(options: { handler: () => Promise<void> }): void;
  preventDefault(): void;
}

interface WindowWithNav {
  navigation?: NavigationApiLike | undefined;
}

// ─── feature detection ────────────────────────────────────────────────────────

/**
 * Returns `true` when the Navigation API is available in this environment.
 * Guards all Navigation API usage — never throws.
 */
export function supportsNavigationApi(): boolean {
  return (
    typeof (window as WindowWithNav).navigation === "object" &&
    (window as WindowWithNav).navigation !== null
  );
}

/**
 * Return the `navigation` object or `null` when the API is unavailable.
 */
export function getNavigationApi(): NavigationApiLike | null {
  if (!supportsNavigationApi()) return null;
  return (window as WindowWithNav).navigation ?? null;
}

// ─── interception ────────────────────────────────────────────────────────────

export type InterceptHandler = (url: string, signal: AbortSignal) => Promise<void>;

let _interceptHandler: InterceptHandler | null = null;

function _onNavigate(e: NavigateEventLike): void {
  if (!e.canIntercept) return;
  if (e.hashChange) return;
  if (e.downloadRequest !== null) return;
  if (!_interceptHandler) return;

  const handler = _interceptHandler;
  const url = e.destination.url;
  const signal = e.signal;

  e.intercept({
    handler: () => handler(url, signal),
  });
}

/**
 * Wire an intercept handler on the Navigation API's `navigate` event.
 *
 * @param handler  Called for every same-origin, non-hash, non-download
 *                 navigation. Receives the destination URL and an
 *                 `AbortSignal` that fires when the navigation is superseded.
 * @returns        Disposer function — call to remove the listener.
 */
export function interceptNavigation(handler: InterceptHandler): () => void {
  const nav = getNavigationApi();
  if (!nav)
    return () => {
      /* no-op: API not available */
    };

  _interceptHandler = handler;
  nav.addEventListener("navigate", _onNavigate);

  return () => {
    nav.removeEventListener("navigate", _onNavigate);
    _interceptHandler = null;
  };
}

// ─── navigation helpers ───────────────────────────────────────────────────────

/**
 * Navigate to a URL preferring the Navigation API; falls back to
 * `history.pushState` + synthetic `popstate` for History API routers.
 */
export function navigateWithApi(url: string): void {
  const nav = getNavigationApi();
  if (nav) {
    nav.navigate(url);
    return;
  }
  history.pushState(null, "", url);
  window.dispatchEvent(new PopStateEvent("popstate", { state: null }));
}

/**
 * Return the current page URL from Navigation API if available,
 * otherwise `location.href`.
 */
export function currentNavigationUrl(): string {
  const nav = getNavigationApi();
  if (nav?.currentEntry) return nav.currentEntry.url;
  return window.location.href;
}

/**
 * Subscribe to Navigation API `navigate` events for logging / analytics
 * (does NOT intercept — use `interceptNavigation` for that).
 *
 * @returns Disposer function.
 */
export function onNavigationStart(cb: (url: string) => void): () => void {
  const nav = getNavigationApi();
  if (!nav)
    return () => {
      /* no-op */
    };

  const handler = (e: NavigateEventLike): void => {
    cb(e.destination.url);
  };
  nav.addEventListener("navigate", handler);
  return () => nav.removeEventListener("navigate", handler);
}

/**
 * Returns `true` when `url` is same-origin as the current page.
 * Used to guard against intercepting cross-origin navigations.
 */
export function isSameOrigin(url: string): boolean {
  try {
    const parsed = new URL(url, window.location.href);
    return parsed.origin === window.location.origin;
  } catch {
    return false;
  }
}
