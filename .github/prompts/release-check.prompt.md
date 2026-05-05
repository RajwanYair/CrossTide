---
mode: "agent"
model: "Claude Sonnet 4.5 (copilot)"
description: "Run the full CrossTide pre-release checklist before tagging a version. All gates must be green."
tools: ["read_file", "grep_search", "replace_string_in_file", "run_in_terminal", "get_errors", "memory"]
---

# Release Check — CrossTide

Run this checklist in order before tagging any release. All items must be ✅ green. Zero tolerance.

> **Full checklist**: load `.github/instructions/pre-release.instructions.md` — that is the canonical source. This prompt is a quick driver.

## 1. Version Consistency

Confirm `vX.Y.Z` appears consistently in all of:

- `package.json` → `"version"`
- `CHANGELOG.md` → top entry heading
- `README.md` → version badge
- `.github/copilot-instructions.md` → header
- `.github/AGENTS.md` → header
- `docs/ARCHITECTURE.md` → title
- `docs/ROADMAP.md` → "Shipped baseline" line
- `worker/openapi.yaml` → `info.version`

## 2. Quality Gates (PowerShell)

```powershell
npm run typecheck       # tsc + sw + worker — 0 errors
npm run lint            # ESLint 0 warnings
npm run lint:css        # Stylelint 0 warnings
npm run lint:html       # HTMLHint pass
npm run lint:md         # markdownlint 0 errors
npm run format:check    # Prettier exit 0
npm run test:coverage   # ≥90/80 thresholds
npm run build           # Vite + Workbox build
npm run check:bundle    # < 200 KB gzip
npm run check:contrast  # 0 violations
node scripts/arch-check.mjs --strict
```

Or in a single shot: `npm run ci`.

## 3. Security & Supply Chain

```powershell
npm audit --omit=dev --audit-level=high
npm audit signatures
```

Run `/security-audit` for the full OWASP smoke check.

## 4. Worker Health

```powershell
cd worker
npx wrangler deploy --dry-run
npx vitest run tests/unit/worker/
cd ..
```

Confirm `worker/wrangler.toml` has no `PLACEHOLDER` IDs.

## 5. Tag & Release

```powershell
git add -A
git commit -m "chore(release): vX.Y.Z"
git tag vX.Y.Z
git push origin main --tags
gh release create vX.Y.Z --generate-notes
```

## Output

Report PASS / FAIL per section. For any FAIL, run the targeted fix prompt:

- Lint/types failing → `/fix-ci`
- A11y/perf issues → `/fix-quality`
- Worker route broken → `/worker-debug`
- Security issue → `/security-audit`
