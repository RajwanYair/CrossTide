---
mode: "agent"
model: "Claude Sonnet 4.5 (copilot)"
description: "Fix accessibility, performance, RTL/i18n, and non-lint quality issues in CrossTide. For lint/type errors use /fix-ci instead."
tools: ["read_file", "grep_search", "replace_string_in_file", "run_in_terminal", "get_errors"]
---

# Fix Quality Issues — CrossTide

Scan and fix quality issues that are **not** covered by ESLint or `tsc`. For lint/type errors, run `/fix-ci` first.

## Accessibility Fixes

- Add `alt` text to all `<img>` and meaningful icon SVGs
- Ensure WCAG AA contrast — `npm run check:contrast` must exit 0
- Add `aria-label` to interactive elements lacking visible text
- Verify `role="region"` + `aria-labelledby` on every card shell
- Verify keyboard navigation: every interactive element reachable with `Tab`
- `<dialog>` modals: must use `.showModal()` / `.close()` — not `<div>` visibility toggling
- Reduced motion: respect `prefers-reduced-motion: reduce` in animations

## Performance Fixes

- Add `loading="lazy"` to images/iframes below the fold
- Use `DocumentFragment` or `morphdom` (`patchDOM`) for batched DOM writes
- Confirm chart and table cards use dynamic `import()` for heavy deps
- `setInterval` refs stored and cleared in card `unmount()` — no leaked timers
- `will-change` only on actively animated elements
- Verify `npm run lhci` Web Vitals: LCP < 2.5 s, TBT < 200 ms, CLS < 0.1

## Internationalization / Locale

- Number formatting via `Intl.NumberFormat` with the active locale
- Dates via `Intl.DateTimeFormat` — never hand-rolled formatters
- Currency display via `Intl.NumberFormat(locale, { style: "currency", currency })`
- All user-visible strings in `src/locales/<lang>.ts` — no hardcoded English

## Bundle / Code-Split

- New heavy dependency? Verify it's behind a dynamic `import()` boundary
- Run `npm run check:bundle` after the fix — must stay < 200 KB gzip
- Confirm no `manualChunks` added to `vite.config.ts`

## Constraints

- NO feature additions
- NO layout changes beyond a11y or perf needs
- NO lint suppression — fix the root cause
- Run `/fix-ci` after this to catch any regressions
