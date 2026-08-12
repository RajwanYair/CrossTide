# ADR-0016: Layered Product Boundary

- **Status:** Accepted
- **Date:** 2026-08-11
- **Owner:** Product maintainers
- **Related roadmap:** T04, T05, A03, D02, E01

## Context

CrossTide contains a browser analysis application, a Cloudflare Worker API, an MCP
server, embeddable widgets, and a publishable domain package. Treating all of these
as one undifferentiated product creates inaccurate claims and makes support scope
unclear. Treating the application as the only product would discard valuable,
portable analytical contracts.

## Options

1. **Application only:** optimize solely for the PWA and keep other surfaces internal.
2. **Open data platform:** prioritize APIs, packages, MCP, and widgets over the PWA.
3. **Layered product:** make the PWA the primary user experience while supporting
   versioned analytical and data contracts as separate, explicitly classified surfaces.

## Decision

Propose the **layered product** boundary. The PWA is the primary customer journey.
The domain package, Worker API, MCP server, and widgets are secondary products with
their own contracts, support classifications, security boundaries, and release
evidence. No secondary surface is considered shipped merely because its source files
exist.

## Non-goals

- Becoming a broker, custodian, investment adviser, or source of executable trades.
- Guaranteeing real-time or complete coverage from providers that do not offer it.
- Supporting every dormant module as a public feature.
- Requiring Cloudflare, a particular provider, or an organization-specific proxy for
  a fork to run locally.

## Consequences

- README and docs-site claims must use `docs/CAPABILITY_MATRIX.md` classifications.
- Public APIs, packages, MCP tools, and widgets require independent contract tests.
- Product work prioritizes one coherent PWA journey before broadening secondary
  surfaces.
- A future ADR may supersede this decision if external-user evidence shows
  a different primary boundary is more valuable.
