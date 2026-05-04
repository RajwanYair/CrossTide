# ADR-0001: Use Yahoo Finance as Primary Data Provider

## Status

Accepted

## Context

CrossTide needs real-time and historical market data. Options considered:

- **Yahoo Finance** (unofficial v8 API): Free, comprehensive, no API key needed for basic queries
- **Finnhub**: Freemium, requires API key, rate-limited at 60 req/min on free tier
- **Alpha Vantage**: Free tier extremely limited (5 req/min)
- **Polygon.io**: Paid only for real-time

## Decision

Use Yahoo Finance's undocumented v8/query1 and query2 endpoints as the primary provider, with a fallback architecture that allows swapping providers via the Worker routing layer.

## Consequences

- **Pro**: No API key required for basic chart/quote/search
- **Pro**: Comprehensive data (OHLCV, fundamentals, options, earnings)
- **Pro**: High rate limits (practical threshold ~2000 req/hour)
- **Con**: Unofficial API — could break without notice
- **Con**: No SLA; requires KV caching to reduce dependency
- **Mitigation**: Provider abstraction in Worker allows hot-swap; fixture mode for preview

## Related

- P1: Wire real Yahoo Finance data
- P2: KV caching as resilience layer
