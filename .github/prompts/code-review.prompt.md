---
mode: "agent"
model: "Claude Sonnet 4.5 (copilot)"
description: "Perform a structured code review on a PR or feature branch: layer direction, purity, types, tests, security, and bundle impact."
tools: ["read_file", "grep_search", "semantic_search", "get_errors", "run_in_terminal", "memory"]
---

# Code Review — CrossTide

Review the specified PR / branch / file set against CrossTide's project rules.

## Scope

Specify the review target on invocation:

- `all` — full diff vs `main`
- `src/cards/<name>/` — a card module
- `src/domain/<area>/` — a domain module
- `worker/routes/<route>.ts` — a worker route
- A pull request: `gh pr diff <num>`

## Review Dimensions (mandatory)

### 1. Layer Direction

- Imports respect: `types ← domain ← core ← providers ← cards ← ui`
- No `src/cards/` import from `src/ui/` (router types only)
- No `src/domain/` import touching DOM, fetch, `Date.now()`, `Math.random()`
- Run: `node scripts/arch-check.mjs --strict`

### 2. Type Safety

- `npm run typecheck` exits 0
- No `any` — `unknown` + narrowing or explicit interfaces
- All exported functions have explicit return types
- `import type { … }` for type-only imports

### 3. Tests & Coverage

- Every new domain function has a corresponding test in `tests/unit/domain/`
- Every new worker route has a test in `tests/unit/worker/` mocking `globalThis.fetch`
- No `.only` / `.skip` (CI gate via `scripts/check-test-focus-skip.mjs`)
- Coverage thresholds: ≥90% stmt/line/fn, ≥80% branch

### 4. Security

- No raw `innerHTML` with unsanitized data
- No `eval`, `new Function`, `document.write`
- All worker inputs validated via Valibot
- No new external runtime dep (no ADR? reject)
- No hardcoded secrets — grep for `api[_-]?key`, `Bearer`, `password`

### 5. Performance & Bundle

- New heavy dep behind dynamic `import()` boundary
- `npm run check:bundle` — < 200 KB gzip
- No `manualChunks` added to `vite.config.ts`
- Card cleanup: timers and listeners removed in `unmount()`

### 6. Commit Hygiene

- Conventional commits: `type(scope): subject` lowercase, ≤72 chars, no period
- Scopes: `domain` `worker` `cards` `core` `ui` `ci` `docs` etc.
- Branch protection: PR contains no `eslint-disable`/`@ts-ignore`/`--force`

### 7. Docs

- Public API change → `CHANGELOG.md` `[Unreleased]` updated
- New worker route → `worker/openapi.yaml` updated
- New ADR scenario → `docs/adr/` entry

## Output

Produce a structured report — `PASS` / `WARNING` / `FAIL` per section, with file paths and one-line rationale.

Hand off:

- Failing tests / data flow → `@api-integrator`
- UI / a11y / contrast → `@card-designer`
- Cross-cutting CI / coverage / security → `@quality-reviewer`
