---
mode: "agent"
model: "Claude Sonnet 4.5 (copilot)"
description: "Run a targeted OWASP Top 10 security audit against the CrossTide codebase (PWA + Cloudflare Worker)."
tools: ["read_file", "grep_search", "run_in_terminal", "get_errors", "semantic_search"]
---

# Security Audit — CrossTide

Perform a security review of CrossTide against the OWASP Top 10:2021.

> CrossTide is a **client-side PWA** with a thin **Cloudflare Worker** proxying public market data.
> No login today. Threat surface: XSS, supply-chain, SSRF on worker upstreams, accidental secret leaks.

> **Canonical mapping**: load `.github/instructions/security-audit.instructions.md` — full A01–A10 mitigations table lives there.

## Automated Checks

Run these first — all must exit 0 before proceeding:

```powershell
npm run lint                              # ESLint security rules
npm run typecheck                         # type safety
npm audit --omit=dev --audit-level=high   # CVE scan
npm audit signatures                      # registry signature check
node scripts/arch-check.mjs --strict      # layer-direction check
```

CI also runs CodeQL, Trivy, TruffleHog, and OWASP ZAP — review their latest run if any are red.

## Manual Review Checklist

### A03 — Injection (XSS / DOM / Fetch)

- [ ] No raw `innerHTML` with unsanitized data anywhere in `src/` or `worker/` — use `patchDOM()` (morphdom) or `textContent`
- [ ] No `eval()`, `new Function()`, or `document.write()` calls
- [ ] All worker route inputs validated via Valibot before use
- [ ] All upstream URLs use `URL` constructor, never string concat with user input
- [ ] Trusted Types policy required by CSP (`require-trusted-types-for 'script'`)

### A05 — Security Misconfiguration

- [ ] CSP in `index.html` and `public/_headers` agree (regenerate via `npm run gen:csp`)
- [ ] `connect-src` has no unreviewed wildcards
- [ ] CORS allowlist on worker matches deployed origins only
- [ ] Service Worker only caches allowlisted origins
- [ ] No debug endpoints in production worker

### A06 — Vulnerable Components

- [ ] `npm audit --audit-level=high` exits 0
- [ ] Trivy weekly scan: 0 HIGH/CRITICAL unpatched CVEs
- [ ] Dependabot has no stale auto-merge PRs
- [ ] All GitHub Actions pinned to commit SHAs (Renovate enforces)

### A08 — Software & Data Integrity

- [ ] SBOM (CycloneDX) generated and attached to last release
- [ ] SLSA provenance attestation present on release artifacts
- [ ] All CI installs use `--ignore-scripts`
- [ ] Subresource Integrity on any `<script src>` external asset

### A10 — SSRF

- [ ] Every worker route uses Valibot schema validation
- [ ] No worker route accepts a client-controlled hostname
- [ ] Provider URLs are constants in `worker/providers/*.ts`
- [ ] Per-route rate limit enabled (KV-backed when env binding present)

## Output

Produce a structured report:

- **PASS** — list automated checks that exited 0
- **FAIL** — list any failing item; open a fix PR or issue with title `security: <description>`
- **WARNING** — list anything that needs a follow-up issue (e.g. wildcard older than 120 days)

If a FAIL is in worker code, hand off to `@api-integrator`. If it's a CSP/HTML/CSS issue, hand off to `@card-designer`. Otherwise apply the fix here.
