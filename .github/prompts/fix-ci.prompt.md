---
description: "Fix a failing CI check (lint, typecheck, test, build, or bundle)"
mode: "agent"
tools: ["read_file", "replace_string_in_file", "run_in_terminal", "runTests", "get_errors", "grep_search"]
---

# Fix CI Failure

Diagnose and fix the failing CI gate.

## Approach

1. Identify which gate is failing (typecheck, lint, test, build, bundle)
2. Reproduce locally with the appropriate command
3. Fix the **root cause** — never suppress with `eslint-disable`, `@ts-ignore`, or `--force`
4. Verify the fix passes locally
5. Ensure no other gates regressed

## Non-Negotiable

- No `eslint-disable` comments
- No `@ts-ignore` or `@ts-expect-error` (unless genuinely needed for external type bugs)
- No `--force` flags
- No reducing coverage thresholds
- No increasing bundle size budget

## Quality Gates

See full table in `.github/copilot-instructions.md` → **Quality Gates** section.

Run all: `npm run ci`

## User Request

{{input}}
