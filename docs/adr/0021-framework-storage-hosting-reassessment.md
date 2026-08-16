# ADR-0021: Framework, Rendering, Storage, And Hosting Reassessment Criteria

- **Status:** Accepted
- **Date:** 2026-08-16
- **Owner:** Architecture maintainers
- **Related roadmap:** R04, A05, A07

## Context

CrossTide's current stack — vanilla TypeScript, morphdom-patched DOM plus Web
Components ([ADR-0009](0009-web-components.md), [ADR-0019](0019-rendering-strategy.md)),
Cloudflare KV/D1 storage ([ADR-0002](0002-kv-caching-market-ttl.md),
[ADR-0003](0003-d1-user-persistence.md)), and Cloudflare Pages/Workers hosting — was
chosen and validated with production evidence. R04 asks whether that baseline should
be revisited. Re-litigating an accepted decision without new evidence would waste
review time; refusing to ever revisit it would fossilize the architecture against real
change in load, team size, or user behavior.

## Decision

Framework, rendering, storage, and hosting choices are reassessed only when **one** of
the following triggers occurs, and the reassessment is scoped to the specific surface
the trigger names rather than the whole stack:

1. **Measured regression** — a shipped performance budget in `docs/ROADMAP.md` Phase 5
   (F01/F02) is missed for two consecutive releases on the same metric and surface.
2. **User evidence** — T06 usability findings identify a workflow that the current
   surface cannot deliver within its accessibility or interaction contract.
3. **Migration cost inversion** — a bundle, dependency, or maintenance cost documented
   in `docs/PACKAGE_CONTRACTS.md` or `package.json` grows faster than the product
   surface it supports, evidenced by `npm run check:bundle` trend data.
4. **Platform change** — Cloudflare, browser, or Node platform capabilities remove or
   replace a primitive the current choice depends on (e.g., a KV/D1 deprecation
   notice, or a Web Components spec change).

Each reassessment produces its own ADR that compares migration cost against the
measured benefit for the *specific* trigger, using the same evidence format as
[ADR-0019](0019-rendering-strategy.md) (context, evidence table, options, decision,
consequences). It supersedes only the narrow prior decision it addresses.

## Consequences

- R04 is satisfied by this criteria document, not by a preemptive framework rewrite;
  no migration is scheduled without a fired trigger.
- Reassessment work is bounded to the surface named by the trigger, preventing a
  single performance regression from justifying a full-stack rewrite.
- `docs/ROADMAP.md` Phase 5 budget checks and the T06 feedback loop are now the
  sensors this ADR depends on; both must stay wired into CI and real usability
  evidence for the trigger conditions to be observable.

## Related

- `docs/ROADMAP.md` Phase 2 (A05, A07), Phase 5 (F01, F02)
- [ADR-0019: Hybrid rendering strategy](0019-rendering-strategy.md)
- [ADR-0002: KV caching](0002-kv-caching-market-ttl.md), [ADR-0003: D1 persistence](0003-d1-user-persistence.md)
