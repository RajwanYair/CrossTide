# Pull Request

## Description

Brief description of what this PR does.

## Type of Change

- [ ] Bug fix
- [ ] New feature
- [ ] Refactor
- [ ] Documentation
- [ ] CI/build

## Quality Gate Checklist

- [ ] `tsc --noEmit` — **zero type errors**
- [ ] `eslint . --max-warnings 0` — **zero warnings**
- [ ] `vitest run` — all tests pass, coverage thresholds met
- [ ] `vite build` succeeds
- [ ] Bundle size budget respected (`scripts/check-bundle-size.mjs`)
- [ ] Manual smoke test in dev server
- [ ] CHANGELOG updated under `[Unreleased]`
