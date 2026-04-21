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
- [ ] `eslint . --max-warnings 0` — **zero lint issues**
- [ ] `stylelint "src/**/*.css" --max-warnings 0` — **zero CSS issues**
- [ ] `prettier --check .` — **exit 0**
- [ ] All tests pass: `vitest run --coverage`
- [ ] Coverage **≥ 90%** statements
- [ ] Bundle size within budget (`node scripts/check-bundle-size.mjs`)
- [ ] No API keys or secrets committed
- [ ] README/docs updated if public behavior changed
