---
name: release
description: "Create a versioned release of CrossTide. Use when: bumping the version number, publishing a new release, updating CHANGELOG, tagging a git commit, or preparing a GitHub release. Covers the full release checklist from version bump to git tag."
argument-hint: "New version number, e.g. 11.36.0"
---

# Release — CrossTide

Use this skill only when you are doing an actual versioned release or preparing the repository for one.
For general cleanup, use `.github/instructions/pre-release.instructions.md` without tagging.

## Version Bump Locations

Update ALL of these (search the current version string, e.g. `11.35.0`):

| #   | File                              | Field / location                           | Notes                                           |
| --- | --------------------------------- | ------------------------------------------ | ----------------------------------------------- |
| 1   | `package.json`                    | `"version"` field                          | Single source of truth                          |
| 2   | `src/sw.ts`                       | `SW_VERSION` constant or `__APP_VERSION__` | Build-time injected when possible               |
| 3   | `CHANGELOG.md`                    | New `## [X.Y.Z]` section at top            | Move `[Unreleased]` → versioned section         |
| 4   | `README.md`                       | Version badge + Vitest badge               | Top of file                                     |
| 5   | `.github/copilot-instructions.md` | Header version (line 1)                    | If present                                      |
| 6   | `.github/AGENTS.md`               | Header `> Version: vX.Y.Z` line            | Top of file                                     |
| 7   | `docs/ARCHITECTURE.md`            | Title `(vX.Y.Z)`                           | Line 1                                          |
| 8   | `docs/ROADMAP.md`                 | `Shipped baseline: vX.Y.Z`                 | Refresh-date header + version-history table row |
| 9   | `worker/openapi.yaml`             | `info.version`                             | Must equal `package.json` version               |
| 10  | `docs-site/` content              | Any version references in Astro Starlight  | Only if displayed in published docs             |

## CHANGELOG Format

```markdown
## [X.Y.Z] — YYYY-MM-DD

> **N tests / M suites / 0 failures** (commit `<hash>`)

### Added

- **Feature name**: brief description

### Fixed

- **Fix name**: what was broken → what was fixed

### Changed / Performance / Security

- (sections only if non-empty)
```

One line per item. Move from `[Unreleased]` block. Skip empty sections.

## Versioning Scheme

| Change                                | Bump  | Example           |
| ------------------------------------- | ----- | ----------------- |
| New card / new worker route / new API | Minor | 11.35.0 → 11.36.0 |
| Bug fix / polish / docs               | Patch | 11.35.0 → 11.35.1 |
| Breaking schema or layer redesign     | Major | 11.x → 12.0.0     |

## Pre-release Gate

> **Full checklist lives in `.github/instructions/pre-release.instructions.md`** — load it and run every item in order.

Quick summary (PowerShell):

```powershell
npm run typecheck
npm run lint
npm run lint:css
npm run lint:html
npm run lint:md
npm run format:check
npm run test:coverage
npm run build
npm run check:bundle
npm run check:contrast
node scripts/arch-check.mjs --strict
```

All must exit 0. Or: `npm run ci`.

## Commit & Tag

```powershell
git add -A
git commit -m "chore(release): vX.Y.Z"
git tag vX.Y.Z
git push origin main --tags
gh release create vX.Y.Z --generate-notes
```

`release.yml` auto-builds and attaches `dist.zip` + SBOM + provenance attestation on `v*.*.*` tags.

## Verification

Every command below must exit 0:

```powershell
npm run ci
npm audit --omit=dev --audit-level=high
npm audit signatures
```

Zero tolerance: 0 type errors · 0 lint errors/warnings · 0 markdownlint errors · 0 test failures · JS gzip < 200 KB · OpenAPI version matches `package.json`.
