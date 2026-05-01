# Changelog

All notable changes to CrossTide are documented in this file.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
Versioning follows [Semantic Versioning](https://semver.org/).

---

## [6.1.0-rc.2] - 2025

### Added — Phase A streaming, DSL, and risk metrics (Sprints 31–40)

- **Branded primitives** (`domain/branded`) — opaque `Ticker`, `ISODate`,
  `Price`, `Percent` types with guards and constructors.
- **Reconnecting WebSocket** (`core/reconnecting-ws`) — exponential
  backoff with jitter, queued sends, injectable transport.
- **Optimistic mutation** (`core/optimistic`) — store-aware
  apply/commit/rollback helper.
- **Freshness classifier** (`ui/freshness`) — live/fresh/recent/stale/expired
  buckets and compact age formatter.
- **Benchmark comparison** (`domain/benchmark`) — rebase, relative-strength
  alignment, beta vs benchmark.
- **CSV import/export** (`core/csv`) — RFC 4180 parser/serializer with
  quoted fields, embedded newlines, and object mapping.
- **Risk ratios** (`domain/risk-ratios`) — Sortino, CAGR, max-drawdown,
  Calmar.
- **Drawing tools** (`ui/drawing`) — pure state machine for trendlines,
  horizontal lines, and Fibonacci retracements with hit-testing.
- **Color-blind palettes** (`ui/palettes`) — default + deuteranopia,
  protanopia, tritanopia variants.
- **Signal DSL** (`domain/signal-dsl`) — safe expression evaluator
  (arith / comparison / boolean / function calls) for custom signals.

### Tests

- 1120 tests across 125 files (+102 new in this RC).

---

## [6.1.0-rc.1] - 2025

### Added — Phase A platform modules (Sprints 5–30)

- **Web Worker RPC** (`core/worker-rpc`, `core/compute-worker`,
  `core/backtest-worker`) — typed postMessage RPC with sync fallback.
- **LRU cache** (`core/lru-cache`) — bounded least-recently-used cache.
- **Circuit breaker** (`providers/circuit-breaker`) — closed/open/half-open
  state machine for provider resilience.
- **Finnhub provider** (`providers/finnhub-provider`) — quote/candle/search
  with health tracking.
- **Storage pressure** (`core/storage-pressure`) — quota observer +
  persistent storage request.
- **Web vitals** (`core/web-vitals`) — LCP/CLS/INP/FCP/TTFB collector with
  beacon reporter.
- **Analytics client** (`core/analytics-client`) — cookieless
  Plausible-compatible client.
- **Notifications** (`core/notifications`) — typed Notification API wrapper.
- **Service Worker update** (`core/sw-update`) — update detection and
  apply-on-demand.
- **Sync queue** (`core/sync-queue`) — IDB-backed offline mutation queue.
- **Command palette** (`ui/command-palette`) — pure scoring + ranking.
- **Heatmap layout** (`cards/heatmap-layout`) — squarified treemap.
- **Share state** (`core/share-state`) — base64url URL state encoder.
- **CSP / SRI** (`core/csp-builder`, `core/sri`) — security header builder
  and Subresource Integrity helper.
- **Drag-reorder** (`ui/reorder`) — pure list reorder state machine.
- **Multi-series sparkline** (`ui/multi-sparkline`) — SVG path builder.
- **Provider health stats** (`providers/health-stats`) — aggregator with
  p50/p95 latency.
- **Range bar** (`ui/range-bar`) — 52-week range geometry helper.
- **Container query** (`ui/container-query`) — discrete size-class observer.
- **IDB migrations** (`core/idb-migrations`) — versioned schema upgrade
  helper.
- **Shortcuts catalog** (`ui/shortcuts-catalog`) — keyboard shortcut data
  and search.
- **Tier policy** (`core/tier-policy`) — promotion/demotion decisions for
  the tiered cache.
- **Contrast** (`ui/contrast`) — WCAG luminance / contrast ratio helpers.
- **Backtest metrics** (`domain/backtest-metrics`) — Sharpe, drawdown,
  CAGR, profit factor.
- **Position sizing** (`domain/position-sizing`) — risk/ATR/Kelly sizing.

### Quality

- 26 new modules, ~200 new unit tests, 0 tsc errors, 0 eslint warnings.

---

## [6.0.0] - 2025-07-21

### Changed — Web-Only Migration & Shared Toolchain

- **Full web-only migration** — removed `windows/` directory and all Flutter artifacts
- **Shared MyScripts toolchain** — all configs now extend `../tooling/` bases:
  - `tsconfig.json` extends `../tooling/tsconfig/base-typescript.json`
  - `eslint.config.mjs` imports `createWebTsAppEslintConfig` from shared
  - `vitest.config.ts` uses `happyDomVitestConfig` from shared
  - `vite.config.ts` spreads `baseConfig` from shared
  - `.stylelintrc.json` extends `../tooling/stylelint/base.json`
  - `.prettierrc` extends `../tooling/prettier.base.json`
  - `.markdownlint.json` extends `../tooling/markdownlint.base.json`
- **Removed local devDependencies** (16 packages) — uses shared `MyScripts/node_modules`
- **Removed local `package-lock.json`** and `node_modules/`
- **Tool version upgrades** via shared workspace:
  TypeScript 5.8→6.0, Vite 6.3→8.0, Vitest 3.1→4.1, ESLint 9→10.2,
  Stylelint 16→17.7, happy-dom 17→20.9, markdownlint-cli2 0.18→0.22
- Cleaned `.gitignore` — removed legacy Flutter entries
- Cleaned `.vscode/settings.json` — removed `**/windows` exclude, updated tsdk path
- Updated engine requirements to `^20.19.0 || ^22.13.0 || >=24.0.0`

### Added

- Comprehensive `docs/ROADMAP.md` with competitive analysis, architecture, and phased plan
  - Comparison table: CrossTide vs TradingView, FinViz, StockAnalysis, thinkorswim, Webull, GhostFolio
  - Harvested insights from competitors (heatmap, sparklines, keyboard shortcuts, etc.)
  - 4-phase implementation plan (v6→v8+)
  - Technology decisions matrix, scope boundaries, Flutter archive appendix

### Removed

- `windows/` directory (Flutter ephemeral build artifacts)
- Legacy `.gitignore` entries (`.dart_tool/`, `.flutter-plugins`, `android/`, `windows/`)
- 16 local `devDependencies` from `package.json`
- Local `package-lock.json`
- Local `node_modules/`

---

## [5.0.0] - 2025-07-16

### Added — Production Hardening

- Unit tests for core/fetch (timeout, retry, abort), ui/router, ui/theme, ui/watchlist
- Test count: 79 → 103 across 14 test files, 98.64% coverage
- Shared `makeCandles()` test helper (eliminates duplication across 6 domain tests)
- markdownlint-cli2 with project `.markdownlint.json` config
- `.gitattributes` for LF line-ending enforcement
- ESLint test overrides (relaxed non-null-assertion, explicit-return-type in tests)
- CODEOWNERS, pull request template, issue templates (bug report, feature request)
- Dependabot config (npm weekly, GitHub Actions weekly)

### Changed

- CONTRIBUTING.md, SECURITY.md, COPILOT_GUIDE.md rewritten for TypeScript/Vite stack
- VS Code extensions.json cleaned (removed unused Tailwind CSS)
- `.editorconfig` cleaned (removed dead Dart section)
- Coverage excludes barrel `index.ts` re-exports and type-only files
- `technical-defaults.test.ts` converted to parameterized `it.each` (8 → 17 tests)
- `.prettierignore` cleaned

### Fixed

- MD040 (fenced code block language) in ARCHITECTURE.md, README.md, COPILOT_GUIDE.md
- MD047 (trailing newline) in CHANGELOG.md, COPILOT_GUIDE.md

---

## [4.0.0] - 2025-06-04

### Changed — Complete Web Rewrite

- **BREAKING**: Rewrote entire application from Flutter/Dart to vanilla TypeScript + Vite
- Removed all Flutter, Dart, Android, and Windows native code
- New browser-based SPA with dark/light theme support

### Added

- TypeScript 5.8+ strict mode codebase
- Vite 6.3+ build tool with ES2022 target
- Domain layer: SMA, EMA, RSI, MACD calculators (ported from Dart)
- Consensus engine with Micho+1 rule
- Cross-up detector
- Reactive state store (EventTarget-based)
- TTL-based in-memory cache
- localStorage config persistence with schema versioning
- Hash-based SPA router (watchlist/consensus/settings views)
- CSS design system with custom properties and @layer
- Dark/light theme toggle
- PWA manifest and favicon
- 70 unit tests (Vitest + happy-dom, 90% coverage thresholds)
- ESLint 9 flat config with typescript-eslint strict
- Stylelint, HTMLHint, Prettier, markdownlint
- GitHub Actions CI (typecheck + lint + test + build + bundle check)
- GitHub Actions Release (tag → zip + checksums)
- GitHub Pages deployment workflow
- Dependabot for npm and GitHub Actions
- Bundle size budget (200 KB JS)
- ARCHITECTURE.md documentation

### Removed

- All Flutter/Dart source code (~520 domain exports, 3000+ tests)
- Drift SQLite database layer
- Android and Windows native runners
- Riverpod state management
- All Flutter-specific GitHub Actions workflows
- Flutter-specific VS Code configuration

## [3.0.0] - 2025-05-18

- Final Flutter release before web rewrite
- See git history for v1.0.0–v3.0.0 Flutter changelog
