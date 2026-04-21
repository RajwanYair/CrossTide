# CrossTide Web — Strategic Roadmap

> **Last updated:** April 21, 2026
> **Current version:** v5.0.0
> **Target version:** v6.0.0 (full web migration)
> **Goal:** Build CrossTide as a **best-in-class web stock monitoring dashboard** — zero native
> platform code, zero local dependencies, zero framework overhead. Pure TypeScript + Vite
> on the shared MyScripts workspace toolchain.

---

## Table of Contents

1. [Product Vision](#1-product-vision)
2. [Competitive Analysis](#2-competitive-analysis)
3. [Architecture](#3-architecture)
4. [Web-Only Migration](#4-web-only-migration)
5. [Domain Port Strategy](#5-domain-port-strategy)
6. [Data Providers & Backend](#6-data-providers--backend)
7. [Feature Cards](#7-feature-cards)
8. [Database & Storage](#8-database--storage)
9. [Testing Strategy](#9-testing-strategy)
10. [PWA & Offline](#10-pwa--offline)
11. [Performance Budget](#11-performance-budget)
12. [Deployment & Infrastructure](#12-deployment--infrastructure)
13. [Implementation Phases](#13-implementation-phases)
14. [Technology Decisions Matrix](#14-technology-decisions-matrix)
15. [Scope Boundaries](#15-scope-boundaries)
16. [Appendix: Flutter Archive](#16-appendix-flutter-archive)

---

## 1. Product Vision

CrossTide Web is a **browser-based stock monitoring dashboard** providing:

- Real-time watchlist with live consensus BUY/SELL/NEUTRAL per ticker
- Interactive candlestick + indicator charts with signal overlays
- 12-method Consensus Engine (Micho, RSI, MACD, Bollinger, Stochastic, OBV, ADX, CCI, SAR,
  Williams %R, MFI, SuperTrend)
- Sector heatmap, screener, alert history, portfolio tracking
- Offline-first PWA with Service Worker caching
- Zero runtime framework dependencies — vanilla TypeScript

### Success Criteria

| Metric | Target |
|--------|--------|
| First meaningful paint | <1.5 s on 4G |
| JS bundle (gzipped) | <180 KB |
| Lighthouse Performance | >=90 |
| Lighthouse Accessibility | >=95 |
| Offline capability | Full watchlist + cached charts |
| Unit test count | >=500 (Vitest) |
| Test coverage | >=90% statements, >=80% branches |
| ESLint + TypeScript | 0 errors, 0 warnings |

---

## 2. Competitive Analysis

### 2.1 Competitor Comparison

| Feature | **CrossTide** | **TradingView** | **FinViz** | **StockAnalysis** | **thinkorswim** | **Webull** | **GhostFolio** |
|---------|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| **Cost** | Free/OSS | Freemium | Freemium | Freemium | Free (Schwab) | Free | Free/OSS |
| **Real-time data** | Planned | Yes | Paid | Yes | Yes | Yes | EOD only |
| **Candlestick charts** | Planned | Yes | Static | Yes | Yes | Yes | No |
| **Technical indicators** | 15 | 100+ | 50+ | 30+ | 400+ | 50+ | 0 |
| **Consensus engine** | 12-method | No | No | Analyst only | No | No | No |
| **Screener** | Planned | Yes | Best-in-class | Yes | Yes | Yes | No |
| **Heatmap** | Planned | Yes | Iconic | Yes | No | No | No |
| **Portfolio** | Planned | No | No | Yes | Brokerage | Brokerage | Best-in-class |
| **Backtesting** | Planned | Pine Script | No | No | thinkScript | No | No |
| **Offline/PWA** | Yes | No | No | No | Desktop | No | Yes |
| **Open source** | MIT | No | No | No | No | No | AGPL |
| **Self-hostable** | Yes | No | No | No | No | No | Docker |
| **Bundle size** | 4.2 KB | ~5 MB | Server | ~2 MB | Desktop | ~3 MB | ~500 KB |
| **No account** | Yes | Limited | Yes | Yes | No | No | No |
| **Data providers** | Yahoo+Twelve+Polygon | Proprietary | Proprietary | Proprietary | Schwab | Webull | Various |

### 2.2 Insights Harvested from Competitors

| Insight | Source | Action |
|---------|--------|--------|
| Treemap heatmap is killer UX | FinViz, TradingView | Canvas heatmap card (Phase 2) |
| Multi-indicator overlay with toggles | TradingView | Lightweight Charts plugin system |
| Analyst ratings + technical = stronger signal | StockAnalysis | Analyst consensus column (future) |
| Keyboard-first navigation (j/k, /, 1-9) | TradingView, thinkorswim | Keyboard shortcuts (Phase 1) |
| Sparklines in watchlist table | FinViz, TradingView | SVG sparkline column |
| 52-week range progress bar | StockAnalysis, Webull | Watchlist card column |
| Dark theme is table stakes | All competitors | Already implemented |
| Static site = instant load | GhostFolio | GitHub Pages deployment |
| WebSocket beats polling for real-time | TradingView, Webull | WebSocket integration (Phase 4) |
| Portfolio benchmark comparison | GhostFolio | Portfolio card (Phase 3) |
| Preset screener filters (oversold, breakout) | FinViz | Preset filter library |
| Multi-chart layout (2x2 grids) | TradingView, thinkorswim | Phase 4 enhancement |
| Provider redundancy is critical | Webull, thinkorswim | 3-provider fallback chain |

### 2.3 CrossTide's Competitive Advantages

1. **Open source + self-hostable** — no vendor lock-in, no subscription
2. **12-method consensus engine** — unique aggregated signal no competitor offers
3. **Zero-dependency vanilla TS** — <200 KB vs multi-MB frameworks
4. **Offline-first PWA** — works without internet
5. **Free tier viability** — Yahoo Finance + Cloudflare Workers = $0/month
6. **Privacy** — no tracking, no account, all data in browser

---

## 3. Architecture

### 3.1 Stack Decision Matrix

All tools sourced from the shared `MyScripts/` workspace — no local `node_modules/`.

| Area | Decision | Version | Shared Config |
|------|----------|---------|---------------|
| **Language** | TypeScript strict | 6.0+ | `../tooling/tsconfig/base-typescript.json` |
| **Build** | Vite | 8.0+ | `../tooling/vite.base.ts` |
| **Test** | Vitest + happy-dom | 4.1+ | `../tooling/vitest/happy-dom.mjs` |
| **E2E** | Playwright | 1.51+ | `../tooling/playwright.base.ts` |
| **Lint** | ESLint flat + typescript-eslint | 10.2+ | `../tooling/eslint/web-ts-app.mjs` |
| **CSS Lint** | Stylelint | 17.7+ | `../tooling/stylelint/base.json` |
| **HTML Lint** | HTMLHint | 1.9+ | — |
| **Markdown** | markdownlint-cli2 | 0.22+ | `../tooling/markdownlint.base.json` |
| **Format** | Prettier | workspace | `../tooling/prettier.base.json` |
| **CSS** | Vanilla + `@layer` + custom properties | — | — |
| **Charts** | Lightweight Charts (TradingView OSS) | 4.x | — |
| **State** | EventTarget pub/sub | — | — |
| **API proxy** | Cloudflare Workers | — | — |
| **Deploy** | GitHub Pages + CF Workers | — | — |
| **npm** | Shared `MyScripts/node_modules` | — | — |

### 3.2 Project Structure (Target)

```text
CrossTide/
├── index.html
├── package.json                      # Scripts only — no devDeps (shared)
├── tsconfig.json                     # Extends ../tooling/tsconfig/base-typescript.json
├── vite.config.ts                    # Extends ../tooling/vite.base.ts
├── vitest.config.ts                  # Uses ../tooling/vitest/happy-dom.mjs
├── eslint.config.mjs                 # Imports ../tooling/eslint/web-ts-app.mjs
├── .stylelintrc.json                 # Extends ../tooling/stylelint/base.json
├── .prettierrc                       # Extends ../tooling/prettier.base.json
├── .markdownlint.json                # Extends ../tooling/markdownlint.base.json
├── public/
│   ├── favicon.svg
│   ├── manifest.json
│   └── sw.js
├── src/
│   ├── main.ts
│   ├── types/
│   │   ├── domain.ts
│   │   ├── api.ts
│   │   └── config.ts
│   ├── core/
│   │   ├── cache.ts                  # L1 memory + L2 localStorage + L3 IndexedDB
│   │   ├── idb.ts                    # IndexedDB async tier
│   │   ├── fetch.ts                  # Timeout, retry, proxy chain
│   │   ├── state.ts                  # EventTarget reactive store
│   │   ├── config.ts                 # Settings persistence + migration
│   │   └── sw-register.ts
│   ├── domain/                       # Pure functions — NO DOM, NO fetch
│   │   ├── sma-calculator.ts         # + 14 more calculators
│   │   ├── micho-method.ts           # + 11 more detectors
│   │   ├── consensus-engine.ts
│   │   ├── alert-state-machine.ts
│   │   ├── cross-up-detector.ts
│   │   ├── backtest-engine.ts
│   │   └── technical-defaults.ts
│   ├── providers/
│   │   ├── types.ts                  # MarketDataProvider interface
│   │   ├── yahoo-provider.ts
│   │   ├── twelve-data-provider.ts
│   │   ├── polygon-provider.ts
│   │   ├── coingecko-provider.ts
│   │   └── provider-chain.ts
│   ├── cards/                        # Lazy-loaded feature modules
│   │   ├── watchlist/
│   │   ├── chart/
│   │   ├── consensus/
│   │   ├── heatmap/
│   │   ├── screener/
│   │   ├── alerts/
│   │   ├── portfolio/
│   │   ├── backtest/
│   │   └── settings/
│   ├── ui/
│   │   ├── router.ts
│   │   ├── theme.ts
│   │   ├── keyboard.ts
│   │   ├── toast.ts
│   │   └── modal.ts
│   └── styles/
│       ├── tokens.css
│       ├── base.css
│       ├── layout.css
│       ├── components.css
│       └── a11y.css
├── worker/                           # Cloudflare Worker (API proxy)
│   ├── src/
│   │   ├── index.ts
│   │   ├── routes/
│   │   └── middleware/
│   └── wrangler.toml
├── tests/
│   ├── unit/
│   │   ├── domain/
│   │   ├── core/
│   │   ├── providers/
│   │   ├── cards/
│   │   └── ui/
│   ├── e2e/
│   └── helpers/
├── scripts/
│   └── check-bundle-size.mjs
└── docs/
    ├── ARCHITECTURE.md
    ├── ROADMAP.md
    └── DATA_PROVIDERS.md
```

### 3.3 Layer Dependency Rules

```text
types/           <- Pure type definitions, no runtime code
domain/          <- Pure functions, no DOM, no fetch, no side effects
core/            <- State, cache, fetch, config — no UI
providers/       <- Data fetching — depends on core/ and types/
cards/           <- Feature modules — depends on everything above
ui/              <- Shared UI chrome — depends on core/
styles/          <- Pure CSS — no TypeScript imports
worker/          <- Cloudflare Worker — independent deployable
```

### 3.4 Runtime Architecture

```text
Browser
 +-- main.ts --- safeLoad(each card) --> Promise.allSettled
 |               +-- setInterval per card (TTL-based refresh)
 +-- sw.js ----- APP_SHELL precache --> offline HTML fallback
 |               +-- API cache (stale-while-revalidate)
 +-- card-registry -- dynamic import() per card --> lazy load

Data fetch chain:
  cGet(key, TTL) -> hit: return cached
                 -> miss: fetchViaWorker(Cloudflare)
                       -> fallback: fetchWithRetry(direct URL)
                           -> exponential backoff (3 retries)
                 -> cSet(key, data, ttl)
                 -> recordSuccess / recordFailure (provider health)

Cache tiers:
  L1: in-memory Map      process lifetime (instant)
  L2: localStorage        7-day eviction (sync, <5 MB)
  L3: IndexedDB           50 MB LRU cap (async, large datasets)
  L4: Service Worker      stale-while-revalidate (offline)
```

### 3.5 CSS Architecture

```css
/* Token-based @layer system */
@layer tokens, themes, base, layout, components, animations;
```

- Design tokens in `:root` custom properties
- Dark default, light via `[data-theme="light"]`
- Card CSS co-located with card modules
- `prefers-reduced-motion` and `prefers-contrast` support
- Container queries for responsive card sizing

---

## 4. Web-Only Migration

### 4.1 What Gets Removed (v6.0.0)

| Artifact | Status | Action |
|----------|--------|--------|
| `windows/` directory | On disk (ephemeral) | **Delete** |
| Legacy `.gitignore` entries | `.dart_tool/`, `.flutter-*`, `android/`, `windows/` | **Remove** |
| Local `node_modules/` | Duplicates shared | **Remove** |
| Local `package-lock.json` | Duplicates shared | **Remove** |
| Local `devDependencies` | Duplicates shared packages | **Remove from package.json** |
| `build/` stale artifacts | Flutter build output | **Clean** |

### 4.2 Shared Tooling Migration

| Config | Before (local, v5) | After (shared, v6) |
|--------|---------------------|---------------------|
| `tsconfig.json` | Self-contained, TS 5.8 | `extends ../tooling/tsconfig/base-typescript.json` |
| `eslint.config.mjs` | Self-contained, ESLint 9 | Imports `../tooling/eslint/web-ts-app.mjs` |
| `vitest.config.ts` | Self-contained, Vitest 3 | Uses `../tooling/vitest/happy-dom.mjs` |
| `vite.config.ts` | Self-contained, Vite 6 | Spreads `../tooling/vite.base.ts` |
| `.stylelintrc.json` | `stylelint-config-standard` | Extends `../tooling/stylelint/base.json` |
| `.prettierrc` | Self-contained | Extends `../tooling/prettier.base.json` |
| `.markdownlint.json` | Self-contained | Extends `../tooling/markdownlint.base.json` |
| `package.json` | 16 devDependencies | 0 devDeps (shared `node_modules`) |

### 4.3 Version Upgrades

| Tool | v5.0.0 | v6.0.0 | Source |
|------|:------:|:------:|--------|
| TypeScript | 5.8 | **6.0** | Shared |
| Vite | 6.3 | **8.0** | Shared |
| Vitest | 3.1 | **4.1** | Shared |
| ESLint | 9.25 | **10.2** | Shared |
| typescript-eslint | 8.32 | **8.58** | Shared |
| Stylelint | 16.18 | **17.7** | Shared |
| happy-dom | 17.5 | **20.9** | Shared |
| markdownlint-cli2 | 0.18 | **0.22** | Shared |
| HTMLHint | 1.5 | **1.9** | Shared |
| @vitest/coverage-v8 | 3.1 | **4.1** | Shared |

---

## 5. Domain Port Strategy

### 5.1 Current State (v5.0.0)

6 of 15 calculators ported, 0 of 12 method detectors:

| Module | Status |
|--------|:------:|
| sma-calculator | Done |
| ema-calculator | Done |
| rsi-calculator | Done |
| macd-calculator | Done |
| consensus-engine | Done |
| cross-up-detector | Done |
| technical-defaults | Done |
| bollinger-calculator | Not started |
| stochastic-calculator | Not started |
| obv-calculator | Not started |
| adx-calculator | Not started |
| cci-calculator | Not started |
| mfi-calculator | Not started |
| supertrend-calculator | Not started |
| williams-r-calculator | Not started |
| parabolic-sar-calculator | Not started |
| atr-calculator | Not started |
| vwap-calculator | Not started |
| 12 method detectors | Not started |
| alert-state-machine | Not started |
| backtest-engine | Not started |

### 5.2 Port Conventions

- Every Dart calculator maps 1:1 to a TypeScript module
- Same function signatures: `computeSeries(candles: DailyCandle[], period?: number): Result[]`
- Same test cases: port Flutter test to Vitest (same inputs, same expected outputs)
- Pure functions only — no class instances, no side effects

### 5.3 Priority Order

| Priority | Modules | Rationale |
|----------|---------|-----------|
| **P0** | 9 remaining calculators + 12 detectors + alert state machine | Full consensus engine |
| **P1** | Signal aggregator, provider chain | Live data |
| **P2** | Backtest engine | Advanced feature |
| **P3** | Analytics (Fibonacci, Sharpe, Sortino, Drawdown) | Portfolio features |

---

## 6. Data Providers & Backend

### 6.1 Provider Chain

```text
Primary:   Yahoo Finance v8 chart API (via Cloudflare Worker proxy)
Fallback1: Twelve Data REST API (800 req/day free tier)
Fallback2: Polygon.io (paid tier, optional)
Crypto:    CoinGecko (CORS-enabled, no proxy needed)
```

### 6.2 Cloudflare Worker Architecture

```text
Browser --fetch--> Cloudflare Worker --fetch--> Yahoo Finance v8
                   +-- Cache API (edge, 5-min TTL quotes)
                   +-- KV (24-hr TTL historical)
                   +-- Rate limiter (per-IP)
                   +-- Error logger

Routes:
  GET  /api/health                -> { status, uptime, providers }
  GET  /api/stocks/quote/:symbol  -> Yahoo v8 quote proxy
  GET  /api/stocks/history/:sym   -> Yahoo v8 historical OHLCV
  GET  /api/stocks/search?q=      -> Yahoo v8 autocomplete
  GET  /api/crypto/:id            -> CoinGecko proxy
  GET  /api/twelve/:symbol        -> Twelve Data proxy
  POST /api/errors                -> Client error ingestion
```

### 6.3 Data Refresh Strategy

| Data type | TTL | Trigger |
|-----------|-----|---------|
| Intraday quote (market open) | 60 s | Auto-interval |
| Intraday quote (market closed) | 5 min | Auto-interval |
| Daily OHLC history | 24 hr | Card mount / manual |
| Consensus result | Computed client-side | On each quote refresh |

### 6.4 API Keys & Secrets

| Provider | Key Required | Storage |
|----------|:---:|---------|
| Yahoo Finance | No | — |
| Twelve Data | Yes | Cloudflare Worker env var |
| Polygon.io | Yes | Cloudflare Worker env var |
| CoinGecko | No | — |

No API keys stored in browser or committed to repo.

---

## 7. Feature Cards

### 7.1 Watchlist Card (P0)

| Column | Content |
|--------|---------|
| Symbol | Ticker + sector badge |
| Price | Last close, locale-formatted |
| Change | $ + %, colored green/red |
| Consensus | BUY/SELL/NEUTRAL badge |
| Sparkline | 30-day inline SVG |
| Volume | Relative vs 20-day avg |
| 52W Range | Progress bar |
| Actions | Chart detail, Remove |

Features: inline add, drag-to-reorder, bulk import (S&P 500 / CSV), export (JSON/CSV),
sortable columns.

### 7.2 Chart Card (P0)

TradingView Lightweight Charts (OSS, ~40 KB):
OHLC candlestick + volume, SMA/Bollinger/SAR overlays, RSI/MACD/Stochastic/ADX sub-panels,
BUY/SELL signal markers, time range selector, crosshair tooltip.

### 7.3 Consensus Dashboard (P0)

Per-ticker 12-method breakdown with direction, reasoning, strength.
Historical consensus timeline.

### 7.4 Sector Heatmap (P1)

Canvas treemap by market cap, colored by % change. Click tile to chart.

### 7.5 Screener (P1)

Preset + custom filters: RSI oversold, price > SMA200, consensus BUY, volume spike, ADX > 25.

### 7.6 Alert History (P1)

IndexedDB-persisted timeline. Filter by ticker, type, date. Export CSV/JSON.

### 7.7 Portfolio (P2)

Holdings, real-time P/L, sector allocation, risk metrics, dividend projection.
Inspired by GhostFolio.

### 7.8 Backtest (P2)

Method(s) + ticker(s) + date range to equity curve + performance table.

### 7.9 Settings (P0)

Data providers, theme, alert config, watchlist import/export, cache, about.

---

## 8. Database & Storage

### 8.1 Storage Tiers

| Tier | Technology | Use Case | Capacity | Persistence |
|------|-----------|----------|----------|:---:|
| **L1** | In-memory Map | Hot data | RAM | Session |
| **L2** | localStorage | Config, watchlist | ~5 MB | Persistent |
| **L3** | IndexedDB | Candles, alerts, portfolio | ~50 MB | Persistent |
| **L4** | SW Cache | App shell, API responses | Browser | Persistent |
| **Edge** | Cloudflare KV | Worker response cache | 1 GB | TTL |

### 8.2 IndexedDB Schema

```text
crosstide-db (v1)
  +-- candles     { [ticker+date]: DailyCandle }
  +-- alerts      { id: AlertRecord }
  +-- portfolio   { id: PositionRecord }
  +-- metadata    { key: value }
```

### 8.3 Why Not a Traditional Database?

| Option | Verdict | Reason |
|--------|:---:|--------|
| SQLite WASM | No | +500 KB bundle, overkill |
| Supabase | Phase 4 | Optional cloud sync |
| PouchDB/RxDB | No | Large deps, simple model |
| Firebase | No | Vendor lock-in, account required |

**Decision:** Raw IndexedDB with thin TypeScript wrapper. Optional Supabase in Phase 4.

---

## 9. Testing Strategy

### 9.1 Test Layers

| Layer | Tool | Target |
|-------|------|:------:|
| Domain | Vitest | **100%** |
| Core | Vitest + happy-dom | **90%+** |
| Providers | Vitest + MSW | Response parsing, errors |
| Cards | Vitest + happy-dom | DOM contract |
| UI | Vitest + happy-dom | Theme, router, keyboard |
| Worker | Vitest + miniflare | Routes, caching |
| E2E | Playwright | Critical flows |

### 9.2 Quality Gates (CI)

```text
tsc --noEmit                              0 type errors
eslint . --max-warnings 0                 0 lint issues
stylelint "src/**/*.css" --max-warnings 0 0 CSS issues
htmlhint index.html                       Valid HTML
markdownlint-cli2 "*.md" "docs/**/*.md"   Valid Markdown
vitest run --coverage                     >=90% statements
vite build                                Successful
check-bundle-size.mjs                     <200 KB JS
```

### 9.3 Current State (v5.0.0)

103 unit tests, 14 files, 98.64% coverage, ~4s execution.

---

## 10. PWA & Offline

### 10.1 Service Worker

```text
sw.js
 +-- precache: index.html, CSS, JS, icons, manifest
 +-- runtime:
 |    +-- /api/*   -> stale-while-revalidate (5 min)
 |    +-- fonts/*  -> cache-first (30 day)
 +-- offline: serve cached app shell
```

### 10.2 Offline Behavior

| Feature | Offline |
|---------|---------|
| Watchlist | Last-cached prices (stale badge) |
| Chart | IndexedDB historical cache |
| Consensus | Recomputed from cached candles |
| Alerts | IndexedDB (full) |
| Settings | localStorage (full) |
| Screener | Cached data |

---

## 11. Performance Budget

| Asset | Budget | Enforcement |
|-------|--------|-------------|
| HTML | <10 KB | Lighthouse CI |
| CSS | <30 KB | Vite bundle report |
| JS (initial) | <150 KB gzip | `check:bundle` |
| JS (lazy cards) | <50 KB each | Per-card |
| Fonts | <100 KB woff2 | Self-hosted subset |
| Lightweight Charts | ~40 KB | Dynamic import |
| **Total initial** | **<200 KB gzip** | CI gate |

---

## 12. Deployment & Infrastructure

### 12.1 Pipeline

```text
Push -> GitHub Actions CI
  +-- lint (ESLint + Stylelint + HTMLHint + markdownlint)
  +-- typecheck (tsc --noEmit)
  +-- test (vitest run --coverage)
  +-- build (vite build)
  +-- bundle check
  +-- Lighthouse CI (Phase 2)
  +-- deploy
       +-- GitHub Pages (dist/)
       +-- Cloudflare Workers (Phase 1)
```

### 12.2 Environments

| Environment | URL | Trigger |
|-------------|-----|---------|
| Development | `localhost:5173` | `npm run dev` |
| Production | `rajwanyair.github.io/CrossTide/` | Push to main |
| Worker | `crosstide.rajwanyair.workers.dev` | Push to main |

### 12.3 Infrastructure Cost

| Service | Tier | Cost | Limit |
|---------|------|:---:|-------|
| GitHub Pages | Free | $0 | 100 GB/mo |
| GitHub Actions | Free | $0 | 2,000 min/mo |
| Cloudflare Workers | Free | $0 | 100K req/day |
| Cloudflare KV | Free | $0 | 100K reads/day |
| Domain | Optional | ~$12/yr | Custom domain |

**Total: $0/month.**

---

## 13. Implementation Phases

### Phase 1 — Web Migration + Core Dashboard (v6.0.0)

| # | Task | Priority |
|---|------|:---:|
| 1.1 | Remove `windows/`, legacy gitignore, stale build artifacts | P0 |
| 1.2 | Migrate to shared MyScripts toolchain | P0 |
| 1.3 | Remove local devDependencies and package-lock.json | P0 |
| 1.4 | Port remaining 9 calculators | P0 |
| 1.5 | Port all 12 method detectors | P0 |
| 1.6 | Port alert state machine + signal aggregator | P0 |
| 1.7 | Cloudflare Worker scaffold + Yahoo proxy | P0 |
| 1.8 | Yahoo Finance provider (browser) | P0 |
| 1.9 | Watchlist card (sparklines, volume, 52W range) | P0 |
| 1.10 | Chart card (Lightweight Charts + overlays) | P0 |
| 1.11 | Consensus dashboard card | P0 |
| 1.12 | Settings card | P0 |
| 1.13 | Keyboard shortcuts | P0 |
| 1.14 | Service Worker + PWA manifest | P0 |
| 1.15 | IndexedDB cache tier | P0 |
| 1.16 | Domain tests (target >=200) | P0 |
| 1.17 | Card + core + provider tests (target >=300 total) | P0 |
| 1.18 | Update CI for shared toolchain | P0 |

### Phase 2 — Feature Cards (v6.1-v6.3)

| # | Task | Priority |
|---|------|:---:|
| 2.1 | Sector heatmap card | P1 |
| 2.2 | Screener card | P1 |
| 2.3 | Alert history card | P1 |
| 2.4 | Twelve Data provider + Worker route | P1 |
| 2.5 | Chart indicator sub-panels | P1 |
| 2.6 | BUY/SELL signal markers on chart | P1 |
| 2.7 | Responsive mobile layout | P1 |
| 2.8 | Lighthouse CI integration | P1 |
| 2.9 | Playwright E2E tests | P1 |
| 2.10 | Toast notification system | P1 |

### Phase 3 — Analytics & Portfolio (v7.0)

| # | Task | Priority |
|---|------|:---:|
| 3.1 | Portfolio card | P2 |
| 3.2 | Backtest card | P2 |
| 3.3 | Port analytics calculators | P2 |
| 3.4 | Consensus history timeline | P2 |
| 3.5 | Provider health dashboard | P2 |
| 3.6 | Theme polish (high-contrast) | P2 |
| 3.7 | Polygon.io provider | P2 |

### Phase 4 — Advanced (v8.0+)

| # | Task | Priority |
|---|------|:---:|
| 4.1 | WebSocket streaming | P3 |
| 4.2 | Browser notification alerts | P3 |
| 4.3 | Shared watchlist URLs | P3 |
| 4.4 | i18n (English + Hebrew) | P3 |
| 4.5 | Optional Supabase backend | P3 |
| 4.6 | Multi-chart layout | P3 |
| 4.7 | Chart drawing tools | P3 |

---

## 14. Technology Decisions Matrix

| Area | Decision | Alternative | Why |
|------|----------|-------------|-----|
| **Language** | TypeScript 6.0 strict | Dart (Flutter Web) | 10x smaller bundles, standard tooling |
| **Build** | Vite 8 | Webpack | HMR, tree-shaking, monorepo proven |
| **UI** | Vanilla TS | React, Vue, Svelte | Zero overhead, proven at FDB scale |
| **Charts** | Lightweight Charts | Chart.js, D3 | OHLC native, 40 KB, MIT |
| **State** | EventTarget pub/sub | Redux, Zustand | No deps, <200 LOC |
| **CSS** | Vanilla + @layer | Tailwind, Sass | No build step, cascade control |
| **Test** | Vitest 4 + happy-dom | Jest | Vite-native, fast |
| **E2E** | Playwright | Cypress | Cross-browser, network mock |
| **Proxy** | Cloudflare Workers | Vercel Edge | 100K req/day free, KV |
| **Deploy** | GH Pages + CF Workers | Vercel | Free, no lock-in |
| **Storage** | IndexedDB + localStorage | SQLite WASM | Zero-dep, sufficient |
| **Offline** | Service Worker | — | PWA standard |
| **npm** | Shared workspace | pnpm | Monorepo consistent |
| **Backend** | None / Supabase (P4) | Firebase | Free, Postgres, OSS client |

---

## 15. Scope Boundaries

### Building

- Browser-based stock monitoring dashboard
- 12-method technical consensus engine
- Interactive financial charts
- Offline-capable PWA
- Self-hosted, open-source, $0/month

### NOT Building

- **Not a brokerage** — no order execution, no real money
- **Not a mobile app** — browser-first
- **Not a social platform** — no user accounts in Phases 1-3
- **Not a news aggregator** — link out, don't build a feed
- **Not a real-time terminal** — daily/intraday, not tick-by-tick
- **Not a copy of the Flutter app** — Web has its own UX

Every feature must justify: (1) data source, (2) UI card, (3) test suite.

---

## 16. Appendix: Flutter Archive

<details>
<summary>Click to expand Flutter app history (archived)</summary>

### Final State (v2.27.0+41)

- 3348+ passing tests, 0 analyzer issues, 100% domain coverage
- 470+ domain entities, 12 trading methods, 15 technical calculators
- Platforms: Android (APK), Windows (MSIX)
- Stack: Dart, Flutter, Riverpod, Drift (SQLite), GoRouter

### Why Archived

The Flutter app proved the domain model. The web rewrite carries forward all algorithms
and test vectors. Native platform code is not maintained going forward.

### Shared Assets

- Domain algorithms (ported 1:1 to TypeScript)
- Test vectors (same inputs/outputs)
- `sp500_tickers.json`, `sector_map.json`

</details>

---

*Last updated: April 21, 2026*
