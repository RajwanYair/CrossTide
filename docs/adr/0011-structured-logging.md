# ADR-0011: Structured JSON Logging in Worker

## Status

Accepted

## Context

Console.log with string interpolation is hard to parse in log aggregators. Need structured logs for observability dashboards (Logflare, Datadog, Grafana).

## Decision

Create a `Logger` interface with `createLogger()` factory that:

- Emits JSON-stringified log lines
- Includes: timestamp, level, message, requestId, route, method, latencyMs
- Supports child loggers for scoped fields (e.g., provider name)
- Routes to console.error/warn/log/debug by level

## Consequences

- **Pro**: Machine-parseable logs for alerting and dashboards
- **Pro**: Request correlation via requestId field
- **Pro**: Latency tracking built in via `withTiming()` helper
- **Con**: Slightly more verbose than plain console.log
- **Con**: JSON serialization cost (~0.1ms per log line)

## Related

- P13: Implementation in `worker/logger.ts`
