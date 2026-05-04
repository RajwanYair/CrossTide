# Pull Request

## Description

Brief description of what this PR does and why.

## Type of Change

- [ ] Bug fix
- [ ] New feature
- [ ] Refactor
- [ ] Performance improvement
- [ ] Documentation
- [ ] CI/build/tooling
- [ ] Dependencies update

## Quality Gate Checklist

- [ ] `tsc --noEmit` — **zero type errors**
- [ ] `eslint . --max-warnings 0` — **zero warnings** (no `eslint-disable` added)
- [ ] `vitest run` — all tests pass, coverage thresholds met
- [ ] `vite build` succeeds
- [ ] Bundle size budget respected (`scripts/check-bundle-size.mjs`)
- [ ] Manual smoke test in dev server

## Architecture Checklist (if code changed)

- [ ] Domain functions are pure (no DOM, no fetch, no `Date.now()`)
- [ ] No upward layer imports (domain never imports core/cards/ui)
- [ ] Worker routes use `Response.json()` and mock `globalThis.fetch` in tests
- [ ] New cards use `patchDOM()` not `innerHTML`; async mount uses `void`
- [ ] No floating promises

## Documentation

- [ ] CHANGELOG updated under `[Unreleased]`
- [ ] New public functions have explicit return types
- [ ] New routes wired in `worker/index.ts` and added to worker API table
