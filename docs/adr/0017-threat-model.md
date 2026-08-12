# ADR-0017: CrossTide Threat Model Baseline

- **Status:** Accepted
- **Date:** 2026-08-11
- **Owner:** Security maintainers
- **Related roadmap:** S02, S03, S05, P07

## Assets

- Provider credentials and Cloudflare deployment credentials.
- User watchlists, portfolios, alert rules, settings, and exported files.
- Market data integrity, freshness metadata, and derived financial calculations.
- Worker availability, KV/D1/R2 data, Durable Object connections, and MCP access.
- Browser integrity, service-worker update behavior, and widget host-page isolation.

## Trust Boundaries

| Boundary | Threats | Required controls |
|---|---|---|
| Browser to Worker | Injection, unauthorized access, CORS abuse, replay | Boundary validation, CSP, CORS allowlist, rate limits, bounded payloads |
| Worker to providers | Credential theft, SSRF, quota exhaustion, malformed data | Fixed provider URLs, secret isolation, timeouts, schema validation, cache limits |
| Worker to D1/KV/R2 | Tenant crossing, injection, destructive requests | Parameterized queries, authorization, least-privilege bindings, retention policy |
| Worker to Durable Objects | Connection exhaustion, ticker fan-out abuse | Authentication policy, quotas, idle cleanup, bounded subscriptions |
| MCP client to server | Tool abuse, prompt injection, data exfiltration | Explicit tool schemas, endpoint authorization, rate limits, output bounds |
| Widget to host page | Supply-chain tampering, data leakage, DOM collisions | Versioned bundles, CSP/SRI guidance, scoped DOM, explicit `api-base` |
| Fork or self-host deployment | Secret leakage, unsafe proxy, origin confusion | Environment-only secrets, generated CSP, documented proxy configuration |

## Abuse Scenarios

1. An attacker submits oversized screener or DSL input to consume Worker CPU.
2. An attacker opens many WebSocket subscriptions for one ticker to exhaust fan-out.
3. A forged provider response causes a misleading signal or stale value to appear fresh.
4. A malicious widget host or dependency attempts to exfiltrate user configuration.
5. A leaked provider key is reused against the upstream service.
6. A service-worker update serves stale or compromised application code.

## Baseline Mitigations

- Validate external input at Worker and provider boundaries.
- Keep secrets in encrypted deployment bindings or ignored local environment files.
- Attach source, timestamp, freshness, and stale markers to market-data envelopes.
- Apply rate, timeout, payload, and cache limits before expensive calculations.
- Emit structured security-relevant logs without credentials or private user data.
- Test CSP, CORS, security headers, service-worker updates, and degraded provider states.
- Maintain a private vulnerability-reporting path and a documented response process.

## Open Decisions

The following scope decisions are resolved for the current release and must be
reopened when the corresponding capability changes:

| Decision | Current boundary | Owner | Review date |
|---|---|---|---|
| Authenticated accounts and WebAuthn | Experimental and outside the supported product boundary; no account data is required for the SPA workflow | Security maintainers | 2026-11-12 |
| Third-party plugins | Package-level experiment only; plugins are not loaded by the SPA or Worker | Architecture maintainers | 2026-11-12 |
| D1 and telemetry retention | No default retention policy is promised until D1-backed persistence is deployed; deployment must define deletion, export, and telemetry limits before support claims | Privacy and operations maintainers | 2026-11-12 |

These boundaries block public support claims for the corresponding dormant modules.
