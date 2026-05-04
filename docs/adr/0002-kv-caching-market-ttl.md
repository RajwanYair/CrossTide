# ADR-0002: KV Caching with Market-Hours-Aware TTL

## Status

Accepted

## Context

Upstream Yahoo API has no SLA and adds ~200ms latency per call. We need caching that:

- Respects market hours (stale data is acceptable when markets are closed)
- Minimizes API calls during trading hours (short TTL for freshness)
- Provides instant responses for repeated queries

## Decision

Use Cloudflare KV as a cache layer with dynamic TTL:

- **Market open (intraday)**: 15-second TTL
- **Market closed (overnight/weekend)**: 24-hour TTL
- **Daily+ ranges**: 1-hour TTL during market hours, 24-hour overnight

## Consequences

- **Pro**: Sub-10ms cache hits globally (KV edge cache)
- **Pro**: Reduces Yahoo API calls by ~95% during off-hours
- **Pro**: Graceful degradation if Yahoo is temporarily unavailable
- **Con**: 15s staleness during market hours (acceptable for retail)
- **Con**: KV eventual consistency (~60s) across regions

## Related

- P1, P2: Implementation in `worker/kv-cache.ts`
