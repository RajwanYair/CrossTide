# Architecture

CrossTide Web is a browser-based stock monitoring dashboard built with vanilla TypeScript and Vite. It follows a layered architecture with strict dependency rules.

## Layers

```
┌──────────────────────────┐
│     UI  (src/ui/)        │  Views, router, theme toggle
├──────────────────────────┤
│   Core  (src/core/)      │  State, cache, config, fetch
├──────────────────────────┤
│  Domain (src/domain/)    │  Pure calculators, no side effects
├──────────────────────────┤
│  Types  (src/types/)     │  Shared interfaces & type aliases
└──────────────────────────┘
```

**Dependency rule:** Each layer may only import from layers below it. Domain has zero dependencies on Core or UI.

## Directory Structure

```
src/
├── domain/           # Pure functions: SMA, EMA, RSI, MACD, consensus engine
│   ├── sma-calculator.ts
│   ├── ema-calculator.ts
│   ├── rsi-calculator.ts
│   ├── macd-calculator.ts
│   ├── consensus-engine.ts
│   ├── cross-up-detector.ts
│   ├── technical-defaults.ts
│   └── index.ts
├── core/             # Side-effectful utilities
│   ├── state.ts      # EventTarget-based reactive store
│   ├── cache.ts      # TTL-based in-memory cache
│   ├── config.ts     # localStorage persistence
│   ├── fetch.ts      # Timeout + retry fetch wrapper
│   └── index.ts
├── ui/               # DOM rendering
│   ├── router.ts     # Hash-based view router
│   ├── theme.ts      # Dark/light toggle
│   ├── watchlist.ts  # Watchlist table renderer
│   └── index.ts
├── types/
│   ├── domain.ts     # DailyCandle, MethodSignal, ConsensusResult, etc.
│   └── index.ts
├── styles/
│   ├── tokens.css    # Design tokens (colors, spacing, radii)
│   ├── base.css      # Reset, typography
│   ├── layout.css    # App shell layout
│   └── components.css # Cards, badges, tables
└── main.ts           # Bootstrap entry point
```

## Key Design Decisions

| Decision | Rationale |
|---|---|
| Vanilla TS (no framework) | Minimal bundle, fast load, no framework churn |
| Vite | Fast dev server, optimized production builds |
| CSS custom properties | Theming without JS runtime cost |
| `as const` defaults | Type-safe indicator thresholds |
| EventTarget store | Native browser API, no state library needed |
| Hash-based routing | Works on static hosts without server config |

## Testing

- **Framework:** Vitest with happy-dom
- **Coverage:** v8 provider, 90% threshold
- **Pattern:** `tests/unit/<layer>/<module>.test.ts`
- Domain tests are pure functions — no mocks needed
- Core tests mock `localStorage` and `Date` via `vi.stubGlobal`

## CI/CD

- **CI:** GitHub Actions — typecheck, lint, test, build, bundle check
- **Release:** Tag push triggers build + zip + GitHub Release
- **Pages:** Auto-deploy `dist/` to GitHub Pages on main push
