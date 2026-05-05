---
applyTo: ".github/**,worker/**,src/core/**,src/main.ts,src/sw.ts,index.html,SECURITY.md"
description: "OWASP Top 10:2021 audit checklist mapped to CrossTide's PWA + Cloudflare Worker threat surface. Run before every major release; smoke-check per patch."
---

# Security Audit — OWASP Top 10:2021 (CrossTide)

> **Mandate**: Audit every item below in order before tagging any `vX.0.0` major release.
> Fill the **Verified** column with commit hashes, then commit the result.
>
> For minor and patch releases, audit only the items flagged in the
> "Patch-cycle smoke check" section.
> Quarterly: audit any 3 items at random plus all items where the verification
> commit is older than 6 months.

Harvested from FamilyDashBoard sibling project — adapted to CrossTide's worker-backed PWA threat surface.

## Last full audit

- **Release**: pending v12.0.0
- **Auditor**: self
- **Date**: TBD

## OWASP Top 10:2021 mapping to CrossTide

| #   | Risk                               | CrossTide exposure                                               | Mitigation in repo                                                                                                                                                                                                           | Verified (commit) |
| --- | ---------------------------------- | ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------- |
| A01 | Broken Access Control              | **Low** — no per-user resources today; portfolios are local-IDB  | No write endpoints reachable without rate-limited token. Worker exposes only public read-only data routes documented in `/openapi.json`. Future passkey flows must add ADR.                                                  | _pending_         |
| A02 | Cryptographic Failures             | **Low** — only optional config-share URL crypto                  | AES-GCM-256 + HMAC-SHA-256 for any client-side share payloads. No password storage. No PII at rest. Reject `crypto-js`/userland crypto — only `crypto.subtle`.                                                               | _pending_         |
| A03 | Injection                          | **Medium** — DOM patching, fetch URL injection, JSON parsing     | `patchDOM()` morphdom — never raw `innerHTML`. Trusted Types policy enforced via CSP. All worker route inputs validated via Valibot. URL params via `URL` constructor. CI scans for `eval(`/`new Function`/`document.write`. | _pending_         |
| A04 | Insecure Design                    | **Low** — single-tenant, client-only state, no session           | Threat model in `SECURITY.md`. ADR-001 (provider chain), ADR-008 (error boundaries). New ADR required for any user input/state surface.                                                                                      | _pending_         |
| A05 | Security Misconfiguration          | **Medium** — CSP, COOP/COEP/CORP, Permissions-Policy, HSTS       | `index.html` CSP meta + `public/_headers`. Generate via `npm run gen:csp`. Review `connect-src` per patch. CSP must include `require-trusted-types-for 'script'`.                                                            | _pending_         |
| A06 | Vulnerable & Outdated Components   | **Medium** — Vite, Hono, morphdom, Workbox + dev-deps            | Dependabot + Renovate (Actions SHA-pinned). `npm audit --audit-level=high` blocks CI. SBOM (CycloneDX) on every release; `pr-sbom-diff.yml` posts diff per PR. `--ignore-scripts` on installs (SLSA L3).                     | _pending_         |
| A07 | Identification & Auth Failures     | **Not applicable today** — no auth                               | No login. Future passkey/WebAuthn must include a fresh ADR superseding ADR-003.                                                                                                                                              | _pending_         |
| A08 | Software & Data Integrity Failures | **Medium** — supply chain, SW cache poisoning                    | Subresource Integrity on all external assets. SLSA L2 today, L3 target. `--ignore-scripts` on all CI installs. Renovate pins GitHub Actions to commit SHAs. SW only caches own origin + allowlisted upstream.                | _pending_         |
| A09 | Security Logging & Monitoring      | **Low** — no PII to log                                          | Structured logger in `worker/logger.ts` strips request bodies and IPs. KV diagnostic envelopes contain no UA-CH high-entropy data. D1 alert history rate-limited per IP.                                                     | _pending_         |
| A10 | Server-Side Request Forgery (SSRF) | **Medium** — worker proxies external APIs (Yahoo, Finnhub, etc.) | All upstream URLs hard-coded in `worker/providers/*.ts` (no client-controlled host). Per-route Valibot schemas reject unexpected query keys. CORS allowlist in `_headers`.                                                   | _pending_         |

## Patch-cycle smoke check

Run on every patch release (`vX.Y.Z` with `Z > 0`):

- [ ] `Select-String -Pattern 'innerHTML','outerHTML' -Path src,worker -Recurse` — only `patchDOM()` permitted; raw `innerHTML` only on trusted/sanitized sources
- [ ] `Select-String -Pattern 'eval\(','new Function\(' -Path src,worker -Recurse` — **0 hits**
- [ ] `Select-String -Pattern 'document\.write\(' -Path src,worker -Recurse` — **0 hits**
- [ ] `npm audit --omit=dev --audit-level=high` — exits 0
- [ ] `npm audit signatures` — registry integrity check, exits 0
- [ ] `npm run check:contrast` — exits 0 (WCAG AA)
- [ ] CSP `connect-src` allowlist reviewed: any wildcard tracked under a quarterly-narrow issue
- [ ] No `eslint-disable`, `@ts-ignore`, or `@ts-nocheck` newly introduced
- [ ] No `localStorage` write of secrets, OAuth tokens, JWTs, or session IDs
- [ ] No new external runtime dep (browser side)
- [ ] OpenAPI spec passes Valibot schema validation
- [ ] Worker tests pass: `npx vitest run tests/unit/worker/`

## Quarterly drill (any 3 random items)

```powershell
Get-Random -InputObject 1..10 -Count 3
```

Re-verify the picked items' mitigations and record the commit hash in the table above.

## Reject conditions (auto-block release)

- Any A-entry with **Verified** older than 12 months
- New code introduces a runtime client dependency without ADR
- New worker route lacks Valibot schema (violates A03 + A10)
- `connect-src` widens with a new wildcard without a follow-up `security:csp-narrow` issue
- Trusted Types policy regression (`require-trusted-types-for 'script'` removed)
- SLSA provenance attestation missing on a release artifact

## CSP wildcard quarterly-narrow policy

Wildcards in CSP directives must be reviewed once per quarter (Mar / Jun / Sep / Dec) and narrowed to the minimum subdomain set actually contacted by the deployed worker. Procedure:

1. Pull last 90 days of unique `connect-src` hostnames from the worker analytics or `Report-Only` violation logs
2. Replace `https://*.example.com` with the explicit list (e.g. `https://api.example.com https://cdn.example.com`)
3. Update both `index.html` meta CSP and `public/_headers` in the same commit
4. Open a follow-up issue tagged `security:csp-narrow` with the diff
5. Tick the `CSP wildcard review` row in the audit table with the commit hash and date

Reviewer rubric: any wildcard older than **120 days** without a narrow-or-renew commit auto-blocks the next minor release.
