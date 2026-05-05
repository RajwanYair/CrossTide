---
description: "Add or fix a browser compatibility test — Vitest browser-mode or Playwright E2E"
mode: "agent"
tools: ["read_file", "grep_search", "create_file", "replace_string_in_file", "runTests", "get_errors"]
---

# Add Browser Compatibility Test

READ FIRST: `.github/instructions/browser.instructions.md`

## Choose the Right Test Type

| Test type         | Location                          | When to use                                                   |
| ----------------- | --------------------------------- | ------------------------------------------------------------- |
| Browser unit test | `tests/browser/*.browser.test.ts` | Feature detection, DOM API availability, CSS property support |
| Playwright E2E    | `tests/e2e/*.spec.ts`             | User flows, visual regression, multi-page navigation          |

## Before Writing Tests

1. Check existing tests for similar assertions: `grep_search` in `tests/browser/` and `tests/e2e/`
2. Read `playwright.config.ts` — understand which projects the E2E tests run on
3. Read `.browserslistrc` — know the target browser list

## Validation

Browser unit tests: `npm run test:browser`
Playwright E2E (all projects): `npm run test:e2e`
Playwright (specific): `npx playwright test --project=chromium tests/e2e/{file}.spec.ts`

## User Request

{{input}}
