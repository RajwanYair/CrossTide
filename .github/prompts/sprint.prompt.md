---
mode: agent
description: Plan and execute a development sprint — implement one feature from ROADMAP.md, commit with conventional commit, and optionally create a GitHub release.
tools:
  - read_file
  - grep_search
  - file_search
  - create_file
  - replace_string_in_file
  - run_in_terminal
  - runTests
  - get_errors
---

# Development Sprint

Implement a single roadmap feature, pass all quality gates, and commit.

## Sprint Workflow

### 1. Select Feature (if not specified)

Read `docs/ROADMAP.md` — pick the highest-priority item not yet marked complete.
Check current version: `grep '"version"' package.json`.

### 2. Plan (before writing any code)

- Identify which layer(s) are affected: `domain` / `worker` / `core` / `cards` / `ui`
- List files to create and files to modify
- Identify tests to write
- Confirm no layer rule violations (see copilot-instructions.md layer diagram)

### 3. Implement

- Follow the layer-specific instruction file for patterns:
  - Domain: `.github/instructions/domain.instructions.md`
  - Worker: `.github/instructions/worker.instructions.md`
  - Cards: `.github/instructions/cards.instructions.md`
- Write tests first for domain functions (TDD preferred)
- Keep changes focused — one feature per sprint, no side improvements

### 4. Quality Gates (run in order, fix before proceeding)

```bash
npm run typecheck        # zero errors required
npm run lint             # zero warnings required
npm run test:coverage    # ≥90% coverage required
npm run build            # must succeed
```

Run all: `npm run ci`

### 5. Commit

```
git add -A
git commit -m "feat(scope): lowercase description of the feature"
```

- Subject: **fully lowercase**, no period, ≤72 chars
- Scope: matches the primary layer (`domain`, `worker`, `cards`, `core`, `ui`)
- Breaking changes: add `BREAKING CHANGE:` in commit body

### 6. Update ROADMAP.md (if feature is complete)

Mark the item with `[x]` or move to completed section.

### 7. GitHub Release (only when instructed)

```bash
npm version patch  # or minor/major
git push --follow-tags
gh release create "v$(node -p "require('./package.json').version")" --generate-notes
```

## Rules

- **One sprint = one commit** — never batch multiple features in one commit
- **No TODOs** — if something can't be done now, open a GitHub Issue
- **No dead code** — every new file must be referenced; every new export must be used
- **Tests required** for all new domain functions and worker routes
- **Don't reduce coverage thresholds** — add tests to meet them

## Sprint Size Guide

| Effort | Examples                                          |
| ------ | ------------------------------------------------- |
| Small  | New indicator, barrel export, add worker endpoint |
| Medium | New card, new store, new worker route with tests  |
| Large  | New feature area (multiple files, routes, cards)  |

Large features should be split into multiple sprints.
