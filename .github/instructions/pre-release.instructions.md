---
applyTo: "CHANGELOG.md,package.json,README.md,docs/ROADMAP.md"
description: "Pre-release production cleanup checklist. Run every item before tagging a release. Zero tolerance: 0 errors, 0 warnings, 0 suppressions."
---

# Pre-Release Checklist — CrossTide

Run every step below in order. **All gates must be green before `git tag vX.Y.Z`.**

Harvested from FamilyDashBoard sibling project — adapted to CrossTide's Vite + Hono + Cloudflare stack.

---

## 1 · Quality Gates (zero tolerance)

```powershell
npm run typecheck       # 0 errors (tsc + sw + worker)
npm run lint            # 0 errors, 0 warnings, 0 suppressions
npm run lint:css        # Stylelint 0 warnings
npm run lint:html       # HTMLHint pass
npm run lint:md         # markdownlint 0 errors
npm run format:check    # Prettier exit 0
npm run test:coverage   # ≥90% stmt/line/fn, ≥80% branch
npm run build           # Successful Vite + Workbox build
npm run check:bundle    # <200 KB gzip
npm run check:contrast  # 0 contrast violations
```

Or run all in one shot:

```powershell
npm run ci
```

**Hard rules (enforced by CI and ESLint):**

- No `// eslint-disable` or `/* eslint-disable */` anywhere in `src/`, `worker/`, or `tests/`
- No `@ts-ignore` or `@ts-expect-error` in `src/` or `worker/`
- No `it.only` / `test.only` / `describe.only` or the `.skip` variants in `tests/` (`scripts/check-test-focus-skip.mjs` enforces in CI)
- No `console.log` in `src/` (use `worker/logger.ts` or `console.warn`/`console.error`)
- No floating promises — `void asyncFn()` or `await`
- No `manualChunks` in `vite.config.ts` — rely on Vite's automatic code-splitting
- No new external runtime dependency unless an ADR is added

---

## 2 · Dead Code / Dead Config / Dead Files

- [ ] `npm run typecheck` — no "unused variable" or "unused import" warnings
- [ ] No orphaned tests (every `tests/unit/X.test.ts` has a matching `src/X.ts` or `worker/X.ts`)
- [ ] No unreferenced CSS selectors in `src/styles/` — cross-check against `index.html` and card markup
- [ ] No `src/assets/` files that aren't imported anywhere
- [ ] No disabled or superseded `.github/workflows/` — keep `ci.yml` as the single quality gate
- [ ] `dependabot.yml` — version up-to-date, no deprecated `package-ecosystem` values
- [ ] `.vscode/extensions.json` — all recommendations exist and are still published

Run the architecture layer check to catch cross-layer leakage:

```powershell
node scripts/arch-check.mjs --strict
```

---

## 3 · Documentation Audit

Update ALL of these on every version bump. Search the old version string (e.g. `11.35.0`) to find occurrences.

| #   | File                              | What to update                                        |
| --- | --------------------------------- | ----------------------------------------------------- |
| 1   | `package.json`                    | `"version"` — canonical single source                 |
| 2   | `src/sw.ts`                       | `SW_VERSION` constant or build-time `__APP_VERSION__` |
| 3   | `CHANGELOG.md`                    | New `## [X.Y.Z]` section; move `[Unreleased]` block   |
| 4   | `README.md`                       | Version badge + test/coverage badges                  |
| 5   | `.github/copilot-instructions.md` | Header version (line 1)                               |
| 6   | `.github/AGENTS.md`               | Header `> Version: vX.Y.Z` line                       |
| 7   | `docs/ARCHITECTURE.md`            | Title `(vX.Y.Z)` and stack table                      |
| 8   | `docs/ROADMAP.md`                 | `Shipped baseline: vX.Y.Z` and version-history table  |
| 9   | `docs-site/` content              | Any version references in Astro Starlight pages       |
| 10  | `worker/openapi.yaml`             | `info.version` — must equal `package.json` version    |

- [ ] All files above updated with the new version
- [ ] `CHANGELOG.md` — unreleased items moved to new version section; old sprints collapsed to one line each
- [ ] `docs/ARCHITECTURE.md` — reflects current card list, layer map, and worker route count
- [ ] OpenAPI spec regenerated: `npm run gen:api-types`

**Deduplication rule:** If a fact appears in more than one file, keep it only in `copilot-instructions.md` (single source of truth) and replace duplicates with a reference.

---

## 4 · Bundle / Performance Budget

| Budget         | Target   | Check command          |
| -------------- | -------- | ---------------------- |
| JS gzip total  | < 200 KB | `npm run check:bundle` |
| First card LCP | < 2.5 s  | `npm run lhci`         |
| TBT            | < 200 ms | `npm run lhci`         |
| CLS            | < 0.1    | `npm run lhci`         |
| Worker p95     | < 300 ms | Cloudflare dashboard   |

CI rejects any push that exceeds the JS gzip budget. Lighthouse runs on every PR via `lighthouse.yml`.

---

## 5 · Security & Supply Chain

- [ ] `npm audit --omit=dev --audit-level=high` — exits 0
- [ ] `npm audit signatures` — all packages have valid registry signatures
- [ ] No new wildcard CSP domains added without an ADR (`docs/adr/`)
- [ ] No new external runtime dep — confirm zero browser-runtime deps
- [ ] Trusted Types policy still required by CSP (`require-trusted-types-for 'script'`)
- [ ] `_headers` file matches CSP meta tag in `index.html`
- [ ] Run security audit prompt: `/security-audit`

---

## 6 · Worker Health

- [ ] `cd worker && npx wrangler deploy --dry-run` — schema validates
- [ ] D1 migrations applied to production: `wrangler d1 migrations apply crosstide-db`
- [ ] KV namespaces present and not placeholder: check `worker/wrangler.toml`
- [ ] OpenAPI spec served at `/openapi.json` matches `worker/openapi.yaml`
- [ ] `worker/openapi.yaml` × `package.json` version string match (CI guard)
- [ ] Rate-limit middleware enabled in `worker/index.ts`

---

## 7 · Commit & Tag

```powershell
git add -A
git commit -m "chore(release): vX.Y.Z"
git tag vX.Y.Z
git push origin main --tags
```

`release.yml` builds and attaches `dist.zip` + SBOM + provenance attestation on `v*.*.*` tags.

`gh release create vX.Y.Z --generate-notes` if release is not auto-created.

---

## 8 · Reject Conditions (auto-block)

- Any quality gate above is non-zero
- New `eslint-disable` / `@ts-ignore` introduced
- New runtime dependency without an accompanying ADR
- Bundle gzip exceeds 200 KB
- Coverage drops below threshold (90 / 80)
- New worker route lacks Valibot/Zod schema validation
- CSP wildcard added without quarterly-narrow follow-up issue
