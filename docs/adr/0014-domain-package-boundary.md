# ADR-0014: Keep the Domain Layer Publishable

## Status

Accepted

## Context

Technical indicators, analytics, risk calculations, and signal logic are useful to the SPA, Worker, MCP server, and external consumers. The domain layer must remain portable and independently testable while the application continues to use its layered source tree.

## Decision

`src/domain/` remains pure TypeScript and exposes its public API through `src/domain/index.ts`. The package build in `packages/domain/` is the boundary check. Domain modules may depend on shared types but not on DOM, fetch, application state, or UI layers.

Modules that are not reachable from the SPA entry points are not deleted: domain modules are classified as `PUBLISH` by the reachability inventory unless they have a separate application disposition.

## Consequences

- Domain behavior can be reused by Workers and package consumers.
- Packaging catches imports that would violate domain purity.
- Reachability metrics distinguish published library surface from shipped SPA behavior.
- Application wiring belongs in core, cards, or UI rather than domain modules.

## Related

- `packages/domain/`
- `scripts/reachability-inventory.mjs`
- `docs/ROADMAP.md` section 3
