# ADR-0008: Error Boundaries for Card Modules

## Status

Accepted

## Context

The application renders 20+ card modules inside a shared DOM tree. A runtime
error in any card's `mount()` or `update()` function propagates up uncaught,
potentially crashing the entire application. JavaScript does not have native
component-level error boundaries outside of framework-specific mechanisms (React
`componentDidCatch`, Solid `ErrorBoundary`, etc.).

CrossTide cards implement the `CardModule` interface:

```ts
interface CardModule {
  mount(container: HTMLElement, ctx: CardContext): CardHandle | void;
}
interface CardHandle {
  update?(ctx: CardContext): void;
  dispose?(): void;
}
```

There is no existing mechanism to catch errors thrown during `mount` or `update`.

## Decision

Provide `withErrorBoundary(card: CardModule): CardModule` in
`src/cards/error-boundary.ts`. The wrapper:

1. Wraps `mount()` in a try-catch — on error, clears the container and renders an
   inline `<div class="card card--error">` fallback with the escaped error message.
2. Wraps the returned `update()` in a try-catch — on error, shows the same
   fallback (replaces the card's own content).
3. Calls `console.error()` so the error appears in DevTools and GlitchTip.
4. Exposes `dispose()` from the inner handle to ensure cleanup still runs even
   after an error during update.

## Consequences

- **Pro**: A single card crash can no longer kill the entire application
- **Pro**: Users see a meaningful inline error instead of a blank/broken panel
- **Pro**: Zero framework dependency; works with any `CardModule`-compliant card
- **Con**: Errors during `mount` leave no partial render — the card container is
  fully replaced with the error fallback
- **Con**: Cards that write to external stores in `mount` may leave inconsistent
  state if the error occurs mid-execution; cards should avoid side effects before
  DOM writes

## Alternatives Considered

1. **Global `window.onerror` + overlay** — Would interrupt the whole app; rejected.
2. **Per-card try-catch in `main.ts`** — Duplicates logic across every call site;
   rejected in favour of the decorator pattern.
3. **`<error-boundary>` Web Component** — More indirection with no benefit for the
   imperative `CardModule` interface; deferred.

## Related

- P8: Implementation in `src/cards/error-boundary.ts`
- ADR-0006: Store pattern (cards using stores may need to handle partial state)
- `src/core/error-boundary.ts`: global `window.onerror` handler (separate concern)
