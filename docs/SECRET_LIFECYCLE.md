# Secret Lifecycle And Fork Portability

> Owner: security and operations maintainers · Review trigger: secret, binding,
> proxy, provider, or deployment configuration change.

CrossTide must run without organization-specific infrastructure. A fork may use
Cloudflare, Docker, or a local Worker, and may provide its own upstream proxy through
environment configuration. No secret belongs in source, committed configuration, or
browser-delivered JavaScript.

## Storage Rules

| Secret or credential | Development | Deployment | Browser exposure |
|---|---|---|---|
| Provider API keys | `worker/.dev.vars` (ignored) | Wrangler encrypted secrets | Never |
| Cloudflare account credentials | Wrangler local login or CI secret | CI secret store | Never |
| D1/KV/R2 identifiers | `worker/wrangler.toml` environment config | Per-environment binding config | Never, except public endpoint names |
| Worker API base URL | `.env` or widget `api-base` attribute | Public configuration | Allowed; it is not a secret |
| HTTP/HTTPS proxy | Environment variable or local Worker config | Deployment environment variable | Never embed credentials in a URL |
| MCP endpoint | `CROSSTIDE_API_URL` | MCP host environment | Allowed only as endpoint metadata |

## Rotation

1. Create a replacement credential at the provider or platform.
2. Update the deployment secret or local ignored file; do not edit source.
3. Verify health, provider fallback, and rate-limit behavior.
4. Revoke the previous credential and record the date in the operational change log.
5. Run secret scanning and confirm no generated artifact contains the old value.

Provider keys are optional. Routes must return a bounded, explainable degraded state
when a key is absent or rejected. A fork without provider keys can use fixture mode or
configure its own provider chain.

## Fork Checklist

- Copy the documented example environment files; never copy a real `.dev.vars` file.
- Set `CROSSTIDE_API_URL` for a self-hosted Worker or use the local default.
- Set proxy variables through the process environment when network policy requires a
  proxy; leave them unset for direct access.
- Provision Cloudflare bindings only when deploying the Worker to Cloudflare.
- Replace public origin and CSP values through configuration generation, not literals
  in application code.
- Verify `npm run check:repo-contracts` and the deployment smoke checks before release.

## Audit Scope

Reviewers must inspect source, workflows, generated artifacts, environment examples,
and logs for hardcoded credentials, organization-specific hosts, proxy credentials,
and accidental browser exposure. Generic security terms such as corporate-action data
or cross-origin resource policy are not infrastructure dependencies.
