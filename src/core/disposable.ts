/**
 * Explicit resource management helpers (G12 — TC39 stage 4 / TS 5.2+).
 *
 * Provides lightweight wrappers that implement `Symbol.dispose` so the
 * `using` keyword can be used for automatic teardown of subscriptions,
 * event listeners, timers, and abort controllers.
 *
 * Usage:
 *   using sub = toDisposable(() => unsubscribe());
 *   using handle = abortOnDispose(controller);
 *
 * Both `using` (sync) and `await using` (async) patterns are supported.
 */

/** Minimal sync Disposable interface (TC39 Explicit Resource Management). */
export interface SyncDisposable {
  [Symbol.dispose](): void;
}

/**
 * Wrap a teardown callback in a SyncDisposable so it can be used with `using`.
 *
 * @example
 *   using cleanup = toDisposable(() => subscription.unsubscribe());
 */
export function toDisposable(teardown: () => void): SyncDisposable {
  return {
    [Symbol.dispose](): void {
      teardown();
    },
  };
}

/**
 * Wrap an AbortController so `dispose` calls `.abort()`.
 * Use with `using` to cancel in-flight requests when leaving a scope.
 *
 * @example
 *   using ctl = abortOnDispose(new AbortController());
 *   await fetchWithTimeout(url, {}, 10_000, ctl.signal);
 */
export interface DisposableAbortController extends SyncDisposable {
  readonly signal: AbortSignal;
  abort(): void;
}

export function abortOnDispose(controller: AbortController): DisposableAbortController {
  return {
    get signal(): AbortSignal {
      return controller.signal;
    },
    abort(): void {
      controller.abort();
    },
    [Symbol.dispose](): void {
      controller.abort();
    },
  };
}

/**
 * Create a route-change listener and return a Disposable that unregisters it.
 *
 * @example
 *   using _ = onRouteChangeDisposable((route) => { ... });
 */
export function onRouteChangeDisposable(
  handler: (route: string) => void,
  register: (h: (route: string) => void) => () => void,
): SyncDisposable {
  const unsubscribe = register(handler);
  return toDisposable(unsubscribe);
}
