# 🔒 Security Policy

## 🚨 Reporting a Vulnerability

If you discover a security vulnerability, please report it responsibly:

1. **Do NOT** open a public GitHub issue
2. Use [GitHub's private vulnerability reporting](https://github.com/RajwanYair/CrossTide/security/advisories/new)
3. Include a description of the vulnerability and steps to reproduce
4. Allow reasonable time for a fix before public disclosure

You will receive a response within 7 days.

## 📅 Supported Versions

| Version        | Supported      |
| -------------- | -------------- |
| 11.x (current) | ✅ Active      |
| 10.x           | ❌ End of life |
| < 10.x         | ❌ End of life |

### Release Cadence And Support Horizon

- CrossTide ships releases on a **rolling basis** rather than a fixed calendar
  schedule — a version is cut when the [`release`](../.github/skills/release/SKILL.md)
  checklist and pre-release gate pass, not on a fixed cadence like "every two weeks".
- **Only the current major version line receives fixes.** When a new major ships,
  the previous major moves to End of Life immediately — there is no overlapping
  support window today. Track this table (not a separate policy page) as the single
  source of truth for what is currently supported.
- Security fixes land as a patch release on the current major only. A vulnerability
  affecting an EOL major is not backported; upgrading to current is the remediation.
- Breaking changes to routes, packages, widgets, or config follow
  [`docs/DEPRECATION_POLICY.md`](../docs/DEPRECATION_POLICY.md) — deprecation notice
  and a removal horizon precede removal outside of a P0 security exception.

### Coordinated Disclosure Timeline

1. **Day 0:** Report received via private advisory. Acknowledged within 7 days (see
   above).
2. **Triage:** Maintainer confirms severity and affected versions, and proposes a
   fix timeline back to the reporter.
3. **Fix and patch release:** A patch ships on the current major. Advisory stays
   private until the fix is released.
4. **Public disclosure:** The advisory is published after the patch release, crediting
   the reporter unless they request otherwise. Typical total time from report to
   public disclosure is target 30 days for high/critical severity; there is no fixed
   embargo beyond that without reporter agreement, since a small maintainer team
   cannot commit to a longer guaranteed embargo.

## 🏗️ Security Design

### Architecture Boundaries

- **Frontend** (Cloudflare Pages / GitHub Pages): Static TypeScript bundle — no server-side execution, no secrets in client bundle
- **API Proxy** (Cloudflare Worker): Validates all inputs, allowlists upstream origins, no secrets stored client-side
- **D1 + KV**: Structured query parameters only; no raw SQL concatenation

### 📜 Content Security Policy

The app enforces a strict CSP via `public/_headers` and `scripts/gen-csp.mjs`:

```http
default-src 'self'
script-src 'self'
style-src 'self' 'unsafe-inline'
img-src 'self' https: data:
connect-src 'self' https:
font-src 'self'
base-uri 'self'
form-action 'none'
```

### ☁️ Cloudflare Worker Security Controls

- Input validation on all route parameters (ticker symbols, date ranges, pagination)
- CORS restricted to the Pages deployment origin
- Security headers on all responses: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`
- Rate limiting via KV token-bucket (see `worker/rate-limit.ts`)
- No secrets in source — environment bindings only (Cloudflare Secrets + `.env` locally)

## 🛡️ OWASP Top 10:2021 — CrossTide Threat Map

| Risk                          | CrossTide Surface                | Control                                                                 |
| ----------------------------- | -------------------------------- | ----------------------------------------------------------------------- |
| A01 Broken Access Control     | KV/D1 read paths                 | Worker validates per-request; no authenticated write endpoints exposed  |
| A02 Cryptographic Failures    | localStorage config              | No sensitive data in storage; API keys in Worker env only               |
| A03 Injection                 | Ticker symbol params, Signal DSL | Valibot schema validation at Worker boundary; DSL parser has no `eval`  |
| A04 Insecure Design           | Open API proxy                   | Upstream allowlist; rate limiting; no SSRF-able URL params              |
| A05 Security Misconfiguration | CSP, CORS, headers               | `_headers` enforced by Cloudflare Pages; reviewed in CI (`gen-csp.mjs`) |
| A06 Vulnerable Components     | npm dependencies                 | Weekly Dependabot + `npm audit --omit=dev --audit-level=high` in CI     |
| A07 Auth/Identity Failures    | N/A (no auth layer yet)          | No user accounts; all data is market data                               |
| A08 Software/Data Integrity   | Supply chain                     | Dependabot SHA pins; CycloneDX SBOM generated on every CI push to main  |
| A09 Logging/Monitoring        | Worker structured logs           | `worker/logger.ts` structured JSON; Cloudflare Logpush available        |
| A10 SSRF                      | Upstream API fetch               | Hard-coded base URLs only; no user-supplied fetch targets               |

## ✅ Security Best Practices (for contributors)

- Never commit API keys, tokens, or secrets — use `.env` (gitignored) or Cloudflare Secrets
- Use `textContent` instead of `innerHTML`; use `patchDOM()` from `src/ui/dom.ts` for card updates
- Sanitize all external input (API responses, imported JSON, URL params) at the Worker boundary
- Keep dependencies updated — Dependabot auto-merges minor/patch; majors require manual review
- Run `npm audit --omit=dev --audit-level=high` before shipping changes that touch `package.json`
