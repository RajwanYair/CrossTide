# ADR-0007: Route Loaders with AbortController

## Status

Accepted

## Context

Cards fetch data after mount, creating a visible waterfall: the view activates,
shows a skeleton/spinner, then fetches. Navigating away before the fetch completes
leaves orphaned requests that may still update stale DOM.

The router already maintains a navigation `AbortController` (`_navController`) whose
signal is provided via `getNavigationSignal()`. Cards that thread this signal into
their `fetch()` calls get automatic cancellation on navigation. However, there is no
standard mechanism to **start** a fetch at navigation time (before the card mounts)
or to **share** pre-fetched data between a route change handler and the card.

## Decision

Add `defineRoute<TData>({ name, loader })` to the router module:

- **`loader`** — `async (ctx: RouteLoaderCtx) => TData`  
  Receives `{ params, signal }` and runs concurrently with view activation.
- **`fireLoaders(info, signal)`** — called inside `handleRoute()` and
  `onNavigateEvent` immediately after `abortNavigation()`.
- **`getRouteLoadResult<TData>(name)`** — returns the in-flight `Promise` so cards
  can `await` pre-fetched data on mount instead of issuing a new request.

Loaders are fire-and-forget from the router's perspective; the router does not
wait for them before activating the view. Cards opt in by awaiting the result.

## Consequences

- **Pro**: Cards can eliminate spinner flashes when data resolves before first paint
- **Pro**: Cancellation is automatic — `signal.aborted` prevents stale writes
- **Pro**: Pure additive change; existing cards are unaffected
- **Con**: If a loader throws, the error is swallowed unless the card awaits and
  handles it (by design — loader errors must not prevent navigation)
- **Con**: Loaders fire even when the card is lazy-loaded; card must still handle
  the case where the promise resolves before or after mount

## Alternatives Considered

1. **Await loader before activating view** — Would block navigation; rejected.
2. **Signal-based data store** — More complex for one-shot route data; deferred.
3. **TanStack Router / React Router** — Third-party dependency; not aligned with
   the zero-dep architecture principle.

## Related

- P7: Implementation in `src/ui/router.ts` (`defineRoute`, `getRouteLoadResult`)
- ADR-0001: Yahoo Finance provider (example loader target)
- ADR-0002: KV caching (loaders use cached data via Worker API)
