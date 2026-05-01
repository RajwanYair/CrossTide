# Architecture

> **Last updated:** v7.5.0 (June 2026)

CrossTide Web is a browser-based stock monitoring dashboard built with vanilla TypeScript and Vite.
It follows a strict layered architecture, keeps the production bundle small, and ships as a
self-contained offline-first PWA with real-time streaming, multi-provider data, and Web Worker
compute offload.

## Layered architecture

```mermaid
flowchart TD
  Cards[Cards / src/cards] --> UI[UI / src/ui]
  UI --> Core[Core / src/core]
  UI --> Domain[Domain / src/domain]
  Cards --> Domain
  Cards --> Core
  Core --> Providers[Providers / src/providers]
  Core --> Types[Types / src/types]
  Domain --> Types
  Providers --> Types
  Main[src/main.ts] --> UI
  Main --> Cards
  Worker[Web Workers] --> Domain
  Worker --> Core
```

**Dependency rule:** each layer may only import from layers below it. The domain layer is pure
(zero side effects, no DOM access). Web Workers share the domain and core layers.

## Runtime data flow

```mermaid
sequenceDiagram
  participant User
  participant UI as src/ui
  participant Core as src/core
  participant Provider as src/providers
  participant Domain as src/domain
  participant SW as Service Worker
  participant WS as WebSocket (Finnhub)
  participant Worker as Compute Worker

  User->>UI: interact (add ticker, change view)
  UI->>Core: dispatch signal / navigate route
  Core->>Provider: fetch quote / candles (tiered cache → network)
  Provider-->>Core: Valibot-validated response
  Core->>Domain: compute consensus / indicators
  Domain-->>Core: pure result
  Core-->>UI: signal update → reactive render
  UI-->>User: render card

  WS-->>Core: real-time tick (Finnhub WSS)
  Core-->>UI: signal push
  UI-->>User: live price update

  User->>UI: run backtest / screener scan
  UI->>Worker: postMessage (worker-rpc)
  Worker->>Domain: compute (off main thread)
  Worker-->>UI: result message
  UI-->>User: render results

  SW->>Core: Background Sync / cache response
```

## URL sharing flow (D5)

```mermaid
sequenceDiagram
  participant User
  participant UI as Watchlist toolbar
  participant Core as share-state.ts
  participant Clipboard
  participant Recipient

  User->>UI: click "Share"
  UI->>Core: encodeWatchlistUrl(tickers)
  Core-->>UI: ?s=base64url...
  UI->>Clipboard: navigator.clipboard.writeText(url)
  UI-->>User: toast — "Link copied!"

  Recipient->>UI: open ?s=base64url...
  UI->>Core: decodeWatchlistUrl(search)
  Core-->>UI: string[] tickers
  UI-->>Recipient: auto-import tickers + toast confirmation
```

## Key product features (v7.5)

| Feature                    | Implementation                                                              |
| -------------------------- | --------------------------------------------------------------------------- |
| 30+ technical indicators   | `src/domain/*` — pure TS, exhaustive tests                                  |
| 12-method consensus engine | `src/domain/consensus-engine.ts`                                            |
| Interactive charting       | `lightweight-charts@^5` via `src/cards/lw-chart.ts`                         |
| Multi-chart layout         | `src/cards/multi-chart-layout.ts` — 2×2 / 1+3 synced crosshair              |
| Drawing tools              | Trendline + Fibonacci retracement canvas overlay                            |
| Real-time streaming        | Finnhub WebSocket via `src/core/reconnecting-ws.ts`                         |
| Screener (preset + custom) | `src/cards/screener-card.ts` + off-thread compute                           |
| Sector heatmap             | Canvas treemap `src/cards/heatmap-card.ts`                                  |
| Portfolio + risk metrics   | Sharpe, Sortino, max DD, CAGR, equity curve                                 |
| Backtest engine            | `src/domain/backtest-engine.ts` + Web Worker + equity curve UI              |
| Alert state machine        | `src/domain/alert-state-machine.ts` + in-browser notifications              |
| Offline-first PWA          | Workbox: precache + NetworkFirst/SWR + Background Sync                      |
| Command palette (`⌘K`)     | `src/ui/command-palette.ts` + fuzzy match                                   |
| Keyboard-first             | `src/core/keyboard.ts` — `j/k`, `/`, `g+h`, Vim-style nav                   |
| i18n (EN + HE RTL)         | `src/core/messages.ts` — `t()` helper, ~80 keys, EN + HE catalogs           |
| Color-blind palettes       | deuteranopia/protanopia/tritanopia/high-contrast; C2 runtime switch         |
| View Transitions API       | Named containers + watchlist column container queries (C5)                  |
| Drag-reorder watchlist     | Mouse/touch drag-and-drop sort; `persistSort`/`loadSort` localStorage (A11) |
| Cross-tab sync             | BroadcastChannel `src/core/broadcast-channel.ts`                            |
| Security headers           | Cloudflare Worker middleware `worker/security.ts` — CSP, HSTS, COOP, CORP   |
| Storage pressure guard     | `src/core/storage-manager.ts` — polls quota, LRU-evicts TieredCache at ≥80% |
| Indicator docs             | 13 MDX reference pages in `docs/indicators/` — formula + usage              |
| URL state sharing          | `src/core/share-state.ts` — base64-URL encoded watchlist snapshot           |

## Directory layout

```text
CrossTide/
├── src/
│   ├── domain/         pure calculators (30+ indicators, consensus, backtest, risk, …)
│   ├── core/           signals, cache, config, fetch, idb, worker-rpc, storage-manager, …
│   ├── providers/      market-data adapters (Yahoo, Finnhub, CoinGecko, Polygon, chain)
│   ├── cards/          composable UI cards — 13 route cards, lazy-loaded via registry
│   ├── ui/             DOM helpers, router, toast, modal, command palette, a11y
│   ├── types/          shared interfaces + Valibot schemas for all provider boundaries
│   ├── styles/         design tokens, base, responsive, components, palettes
│   └── main.ts         bootstrap: router, signals, keyboard, palette, cards, telemetry
├── worker/             Cloudflare Worker ES module (API proxy + security headers)
│   ├── index.ts        route dispatch: /api/quote, /api/candles, /api/search, /og-image
│   └── security.ts     withSecurityHeaders() middleware — CSP, HSTS, COOP, CORP, COEP
├── docs/               Markdown/MDX reference — 13 indicator pages + user guide + roadmap
├── tests/unit/         Vitest unit tests (≥2658 tests across ≥262 files)
└── public/             Static assets, PWA manifest, 404.html
```

## Runtime dependencies

| Package                | Purpose                     | Size (gz) |
| ---------------------- | --------------------------- | --------- |
| `lightweight-charts`   | Candlestick / line charting | ~45 KB    |
| `valibot`              | Runtime schema validation   | ~3 KB     |
| `@preact/signals-core` | Reactive state primitives   | ~1.4 KB   |

All other functionality is hand-written TypeScript — no framework runtime.

## Tooling — single source of truth

| Concern        | File                            | Notes                                                              |
| -------------- | ------------------------------- | ------------------------------------------------------------------ |
| TypeScript     | `tsconfig.json`                 | strict + `exactOptionalPropertyTypes` + `noUncheckedIndexedAccess` |
| Bundler        | `vite.config.ts`                | Vite 8, oxc minifier, ES2022                                       |
| Tests (unit)   | `vitest.config.ts`              | happy-dom, v8 coverage, 90% thresholds                             |
| Tests (E2E)    | `playwright.config.ts`          | Chromium, 15 critical flows + axe-core                             |
| Linting (TS)   | `eslint.config.mjs`             | ESLint 10 flat + typescript-eslint 8, `--max-warnings 0`           |
| Linting (CSS)  | `.stylelintrc.json`             | inline rule set                                                    |
| Linting (HTML) | `.htmlhintrc`                   | inline rule set                                                    |
| Linting (MD)   | `.markdownlint.json`            | `default: true`, allow common HTML elements                        |
| Format         | `.prettierrc`                   | repo-local; `npm run format:check` is the gate                     |
| Bundle budget  | `scripts/check-bundle-size.mjs` | 200 KB gzipped JS                                                  |
| Lighthouse     | `lighthouserc.json`             | Perf ≥ 85, A11y ≥ 90, Best ≥ 90                                    |
| Changesets     | `.changeset/config.json`        | Auto version + release PR                                          |

The repo is fully self-contained: `git clone` → `npm ci` → `npm run ci` works on any machine.

Git hooks are configured via `simple-git-hooks`:

- **pre-commit**: `lint-staged` runs ESLint + Prettier on staged TS/CSS/MD files
- **commit-msg**: `commitlint` enforces [Conventional Commits](https://www.conventionalcommits.org/)

## CI / CD

| Workflow         | Trigger   | Purpose                                                     |
| ---------------- | --------- | ----------------------------------------------------------- |
| `ci.yml`         | push + PR | typecheck → lint:all → test:coverage → build → bundle check |
| `release.yml`    | tag `v*`  | gates + zip dist + SHA-256 + GitHub Release                 |
| `pages.yml`      | push main | deploy to GitHub Pages (mirror)                             |
| `cf-pages.yml`   | push + PR | Cloudflare Pages deploy (production + PR previews)          |
| `changesets.yml` | push main | Version PR or tag via @changesets/action                    |
| `lighthouse.yml` | push + PR | `lhci autorun` performance/a11y budgets                     |
| `dependabot.yml` | weekly    | npm + github-actions grouped update PRs                     |

## Quality gates

Local and CI both enforce, with **zero waivers**:

- 0 TypeScript errors (`npm run typecheck`)
- 0 ESLint warnings (`npm run lint`)
- 0 Stylelint warnings (`npm run lint:css`)
- 0 HTMLHint findings (`npm run lint:html`)
- 0 markdownlint findings (`npm run lint:md`)
- Prettier clean (`npm run format:check`)
- 2658+ unit tests pass (`npm test`), v8 coverage thresholds met
- 15 Playwright E2E flows + axe a11y audit pass
- Lighthouse CI budgets met
- Production build under 200 KB gzipped JS (`npm run check:bundle`)

## Security

- **CSP + security headers** via Cloudflare Worker middleware (`worker/security.ts`) on all API responses:
  `Content-Security-Policy`, `Strict-Transport-Security`, `X-Frame-Options: DENY`,
  `X-Content-Type-Options: nosniff`, `Permissions-Policy`, `Cross-Origin-Opener-Policy`,
  `Cross-Origin-Resource-Policy`, `Referrer-Policy`
- **CSP** also enforced via Vite dev headers + `_headers` file (Cloudflare Pages)
- **SRI** hashes for preloaded scripts (`src/core/sri.ts`)
- **Valibot** validation at every external data boundary (Yahoo, Finnhub, CoinGecko, Polygon)
- **Token-bucket** rate limiter prevents API abuse
- **Circuit-breaker** per provider with automatic failover chain
- **No `innerHTML`** with user data — all DOM via `textContent` or sanitized templates
- **Dependabot** + dependency-review-action for supply chain

## Routing & card registry

Routes use the History API (`src/ui/router.ts`). Every route maps to a card module loaded via
lazy `import()`. The card registry (`cards/registry.ts`) returns `{ mount(el, ctx) }` for each
entry. Cards are never destroyed on route change — hidden/shown via CSS.

| Route                 | Card module                                           |
| --------------------- | ----------------------------------------------------- |
| `/watchlist`          | built-in (watchlist table in `main.ts`)               |
| `/consensus`          | `cards/consensus-card.ts`                             |
| `/chart`              | `cards/chart-card.ts`                                 |
| `/alerts`             | `cards/alerts-card.ts`                                |
| `/heatmap`            | `cards/heatmap.ts`                                    |
| `/screener`           | `cards/screener.ts`                                   |
| `/portfolio`          | `cards/portfolio.ts`                                  |
| `/risk`               | `cards/risk-card.ts` (Sortino, max DD, CAGR, Calmar)  |
| `/backtest`           | `cards/backtest-card.ts` (MA crossover, equity curve) |
| `/consensus-timeline` | `cards/consensus-timeline.ts`                         |
| `/provider-health`    | `cards/provider-health.ts`                            |
| `/settings`           | `cards/settings-card.ts`                              |

## Storage

CrossTide uses a four-tier storage model:

| Tier | Store                | TTL              | Notes                                  |
| ---- | -------------------- | ---------------- | -------------------------------------- |
| L1   | In-memory Map        | Process          | `TieredCache` L1 — hot quotes          |
| L2   | `localStorage`       | Configurable TTL | `TieredCache` L2 — ~5 MB, config/theme |
| L3   | IndexedDB            | No expiry        | Quote candles, watchlists, alerts      |
| L4   | Service Worker Cache | Per-strategy     | App shell (precache) + API SWR         |

`src/core/storage-manager.ts` polls `navigator.storage.estimate()` every 60 s.
When quota usage reaches **80%** it evicts the 20 oldest L1/L2 cache entries.
At **95%** it evicts 50 entries and calls `navigator.storage.persist()` to request
persistent storage from the browser.

## Performance budget

| Asset                | Budget      | Gate           |
| -------------------- | ----------- | -------------- |
| JS initial           | ≤ 200 KB gz | `check:bundle` |
| Lazy card chunk      | ≤ 50 KB gz  | build          |
| CSS                  | ≤ 30 KB gz  | build          |
| LCP (4G mid Android) | ≤ 1.8 s     | Lighthouse CI  |
| INP p75              | ≤ 200 ms    | Lighthouse CI  |
| CLS                  | ≤ 0.05      | Lighthouse CI  |
