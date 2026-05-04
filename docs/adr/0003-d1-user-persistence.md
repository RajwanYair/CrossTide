# ADR-0003: D1 for User Data Persistence

## Status

Accepted

## Context

User data (watchlists, portfolios, alert rules, settings) needs server-side persistence for cross-device sync. Options:

- **D1** (Cloudflare's SQLite-at-edge): Zero-config, co-located with Worker
- **Turso** (LibSQL): More features, external dependency
- **Supabase/Postgres**: Full SQL, but adds latency and separate infra

## Decision

Use Cloudflare D1 with SQL migrations tracked in `worker/migrations/`.

## Consequences

- **Pro**: Zero latency between Worker and DB (same datacenter)
- **Pro**: SQLite semantics — simple, reliable, well-understood
- **Pro**: No external service to manage or pay for
- **Con**: 10MB database size limit on free tier
- **Con**: No real-time subscriptions (poll or use DO for sync)

## Related

- P3: Schema in `worker/migrations/0001_initial_schema.sql`
