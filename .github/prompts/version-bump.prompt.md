---
mode: "agent"
model: "Claude Sonnet 4.5 (copilot)"
description: "Bump the project version consistently across all files: package.json, CHANGELOG.md, README.md, .github/AGENTS.md, copilot-instructions.md, docs/ARCHITECTURE.md, docs/ROADMAP.md, worker/openapi.yaml."
tools: ["read_file", "replace_string_in_file", "grep_search", "run_in_terminal"]
---

# Version Bump — CrossTide

Bump the version from the current value to a new semver target.

> **Canonical file list**: load `.github/skills/release/SKILL.md` — it is the single source for every file that needs updating. Do not duplicate that list here.

## Quick Steps

1. Confirm the current version:

   ```powershell
   Get-Content package.json | Select-String '"version"'
   ```

2. Load `.github/skills/release/SKILL.md` for the complete file table.
3. For each file in the SKILL table, replace **every** occurrence of the old version with the new one.
4. Add a CHANGELOG entry at the top: `## [X.Y.Z] — YYYY-MM-DD` with a bulleted summary of feat/fix/perf items.
5. Regenerate the OpenAPI types if `worker/openapi.yaml` changed:

   ```powershell
   npm run gen:api-types
   ```

6. Run the consistency gates — all must exit 0:

   ```powershell
   npm run typecheck
   npm run lint
   npm run format:check
   ```

## Versioning Scheme

| Change                            | Bump  | Example           |
| --------------------------------- | ----- | ----------------- |
| New card / new worker route / API | Minor | 11.35.0 → 11.36.0 |
| Bug fix / polish / docs           | Patch | 11.35.0 → 11.35.1 |
| Breaking schema or layer redesign | Major | 11.x → 12.0.0     |

## Output

- List every file changed and the old → new version string for each
- Paste the new CHANGELOG entry
- Confirm `npm run ci` exits 0 before committing
