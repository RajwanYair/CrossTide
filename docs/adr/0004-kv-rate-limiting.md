# ADR-0004: KV-Backed Rate Limiting

## Status

Accepted

## Context

In-memory rate limiting resets per isolate (Workers are stateless). A user could bypass limits by hitting different edge locations. We need global rate limiting that persists across isolates.

## Decision

Three-tier cascade:

1. **Cloudflare Rate Limiting API** (if binding exists) — native, global
2. **KV-backed fixed-window counter** — global, ~60s eventual consistency
3. **In-memory token bucket** — fallback for local dev

## Consequences

- **Pro**: Global rate limiting without external service
- **Pro**: Graceful degradation through cascade
- **Con**: KV eventual consistency means brief windows where limit is soft
- **Con**: KV writes on every request (minimal cost at current scale)

## Related

- P4: Implementation in `worker/rate-limit.ts`
