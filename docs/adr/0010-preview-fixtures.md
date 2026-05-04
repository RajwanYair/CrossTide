# ADR-0010: Preview Environments Serve Fixture Data

## Status

Accepted

## Context

Cloudflare Pages preview deployments (branch deploys) don't have API keys configured. They also need deterministic data for QA screenshot comparisons.

## Decision

When `ENVIRONMENT !== "production"`, the Worker serves deterministic fixture data from `worker/fixtures.ts` instead of calling Yahoo Finance. The fixture module generates reproducible OHLCV candles using a seeded PRNG per symbol.

## Consequences

- **Pro**: Preview URLs work without any secrets configuration
- **Pro**: Deterministic data enables visual regression testing
- **Pro**: Instant responses (no network round-trip)
- **Con**: Preview doesn't test real API integration (covered by staging)
- **Con**: Fixture data is static — won't catch parsing issues with real API

## Related

- P12: Implementation in `worker/fixtures.ts`, wired in `worker/index.ts`
