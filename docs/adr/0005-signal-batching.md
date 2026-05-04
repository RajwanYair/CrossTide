# ADR-0005: Signal Batching

## Status

Accepted

## Context

Multiple signal writes in sequence (e.g., loading state + data + error reset) trigger N separate re-renders. This causes layout thrashing and wasted DOM work.

## Decision

Add `batch(fn)` to signals.ts that defers subscriber notifications until the outermost batch completes, then flushes all unique pending subscribers once.

## Consequences

- **Pro**: N writes → 1 re-render cycle
- **Pro**: Composable (nested batch calls are no-ops)
- **Pro**: Zero-cost when not batching (no overhead in hot path)
- **Con**: Subscribers see intermediate states if they peek during batch

## Related

- P5: Implementation in `src/core/signals.ts`
