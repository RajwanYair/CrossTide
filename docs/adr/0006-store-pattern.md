# ADR-0006: Store Pattern with createStore()

## Status

Accepted

## Context

Ad-hoc signal usage across cards leads to duplicated patterns: localStorage sync, cross-tab broadcast, reset logic, action encapsulation. Need a standard pattern.

## Decision

Provide `createStore()` and `createPersistedStore()` factories that wrap signals with:

- Typed actions (mutators)
- Selectors (derived reads)
- `reset()` to initial state
- `subscribe()` for external consumers
- Automatic localStorage + BroadcastChannel sync (persisted variant)

## Consequences

- **Pro**: Consistent state management across all domain stores
- **Pro**: Cross-tab sync is automatic (no per-store wiring)
- **Pro**: Easy testing (reset + peek)
- **Con**: Slightly more boilerplate than raw signals for trivial state

## Related

- P6: Implementation in `src/core/store.ts`, `watchlist-store.ts`, `settings-store.ts`
