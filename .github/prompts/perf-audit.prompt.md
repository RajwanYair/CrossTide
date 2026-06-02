---
description: "Investigate and fix performance regressions in CrossTide"
---

# Performance Audit

## Bundle size

```bash
npm run build && npm run check:bundle
```

If over budget (250 KB gzip), analyze chunks:

```bash
npx vite build --mode analyze
```

## Core Web Vitals

Target budgets:

- LCP < 1.8s (4G mid-Android)
- INP < 200ms (p75)
- CLS < 0.05

## Common fixes

1. **Large chunk**: Split via dynamic `import()` in card loader
2. **Slow INP**: Move computation to Web Worker (`src/core/worker-rpc.ts`)
3. **Bad LCP**: Preload critical font + above-fold CSS
4. **CLS shift**: Add explicit `width`/`height` or `aspect-ratio`

## Lighthouse

```bash
npm run lhci
```

Performance score must be ≥ 90.
