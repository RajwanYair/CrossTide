# Changelog

All notable changes to CrossTide are documented in this file.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
Versioning follows [Semantic Versioning](https://semver.org/).

---

## [11.12.0] - 2026-05-04

### Highlights

Phase R feature sprint: 10 trading & portfolio analysis modules — price
targets, sector allocation, risk/reward evaluation, correlation analysis,
gap scanning, and portfolio rebalancing.

### Added

- **Price target tracker (R1)**: Set/track price targets with progress-to-target
  calculations, hit detection for long/short directions.
- **Sector allocation calculator (R2)**: Per-sector weightings, Herfindahl
  concentration index, over/underweight detection.
- **Intraday high/low distance (R3)**: Position-in-range (0–1) metric,
  near-high/near-low filters, widest/narrowest range screens.
- **Ticker comparison table (R4)**: Side-by-side metrics with best/worst
  identification, 52-week distance, performance ranking.
- **Risk/reward ratio calculator (R5)**: R:R analysis for long/short setups,
  position sizing from risk budget, expected value calculation.
- **Pair correlation calculator (R6)**: Pearson correlation between return
  series, NxN matrix builder, most/least correlated pairs.
- **Earnings surprise tracker (R7)**: Beat/miss analysis with revenue
  surprise, beat rate, streak tracking, magnitude classification.
- **Watchlist export formatter (R8)**: CSV, TSV, JSON, text export with
  date-stamped filenames and flexible import parsing.
- **Gap detection scanner (R9)**: Gap-up/down identification with same-day
  fill detection, fill rate statistics, unfilled gap tracking.
- **Portfolio rebalance calculator (R10)**: Drift-based rebalance plans with
  buy/sell/hold actions, share count derivation, target validation.

---

## [11.11.0] - 2025-07-05

### Highlights

Phase Q feature sprint: 10 power-user analytics and management utilities —
layout presets, provider analytics, momentum/volatility ranking, trade journal,
and smart staleness detection.

### Added

- **Dashboard layout presets (Q1)**: Save/restore named card arrangements with
  up to 20 presets, rename, and active-on-reload tracking.
- **Provider usage analytics (Q2)**: Track per-provider API call counts,
  latency averages, error rates, and most-used provider identification.
- **Price alert proximity check (Q3)**: Calculate distance from current prices
  to alert levels with percentage thresholds and sorted nearest-first.
- **Multi-ticker momentum rank (Q4)**: Rate-of-change ranking across portfolio
  with composite multi-timeframe scoring (short/medium/long).
- **Search history suggestions (Q5)**: Frequency-based autocomplete from past
  searches with prefix matching and LRU eviction.
- **Data snapshot diffing (Q6)**: Compare two point-in-time states to detect
  price moves, volume changes, and consensus signal flips.
- **Volatility rank calculator (Q7)**: Annualized volatility from daily returns
  with standard deviation, classification labels, and least-volatile filter.
- **Gain/loss streak tracker (Q8)**: Detect consecutive up/down days, find
  longest historical streaks, and rank portfolio by streak length.
- **Quote staleness detector (Q9)**: Classify quotes as fresh/stale/expired by
  configurable thresholds with market-hours awareness heuristic.
- **Trade journal log (Q10)**: Record buy/sell trades with price, quantity,
  notes, tags, and P/L totals. localStorage-backed, 500-entry cap.

---

## [11.10.0] - 2025-07-05

### Highlights

Phase P feature sprint: 10 power-user utilities — performance diagnostics,
correlation analysis, watchlist history, ticker pinning, notification
preferences, and advanced session management.

### Added

- **Auto-theme system sync (P1)**: Listen for OS prefers-color-scheme and
  prefers-contrast changes, auto-apply theme with manual override support.
- **Provider failover event log (P2)**: In-memory circular buffer (50 events)
  tracking provider fallback events with subscriber notifications.
- **Multi-ticker batch selection (P3)**: Ephemeral in-memory selection state
  for batch operations with select/deselect/toggle/selectAll/clear APIs.
- **Session state persistence (P4)**: Save/restore navigation state across
  page reloads via sessionStorage with 30-min expiry.
- **Data cache statistics (P5)**: Track cache hit/miss rates, entry counts,
  and estimated localStorage usage for diagnostics.
- **Ticker pinning (P6)**: Pin tickers to top of watchlist regardless of sort
  order with generic sortWithPinnedFirst utility.
- **Notification preferences (P7)**: Granular per-category enable/disable for
  price alerts, signal flips, provider failovers, data stale, and earnings.
- **Performance metrics collector (P8)**: Web Vitals observation (LCP, FCP,
  CLS, INP, TTFB) plus custom fetch latency and render time tracking.
- **Ticker correlation quick-check (P9)**: Pearson correlation on returns for
  any two price series with interpretation labels.
- **Watchlist change history (P10)**: Timestamped add/remove log with
  circular buffer (200 entries), ticker filtering, and undo candidates.

---

## [11.9.0] - 2025-07-05

### Highlights

Phase O feature sprint: 10 new features for power users — settings search,
dashboard stats, color tags, card width preferences, recent tickers history,
keyboard shortcut customization, and contextual ticker actions menu.

### Added

- **Settings search/filter (O4)**: Keyword input to filter settings groups in
  real-time by label, option, or button text.
- **Dashboard stats footer (O5)**: Live footer stats showing watchlist count,
  active/total providers, and data freshness breakdown (fresh/stale/expired).
- **Watchlist color tags (O6)**: Assign color labels (Bullish, Bearish,
  Neutral, Watch, Earnings, Speculative) to tickers with localStorage
  persistence. Six preset colors with CSS variable support.
- **Card width preference (O7)**: Per-card half-width vs full-width toggle
  with DOM class application and localStorage persistence.
- **Recent tickers history (O8)**: Tracks last 10 viewed tickers for
  quick-access navigation with deduplication and MRU ordering.
- **Keyboard shortcut customization (O9)**: Rebind any shortcut via
  localStorage. Includes formatBinding/parseBinding helpers for combo strings.
- **Contextual ticker actions menu (O10)**: Custom right-click context menu
  system with registered action buttons, viewport-aware positioning, Escape
  dismiss, and click-outside close.

---

## [11.8.0] - 2025-07-05

### Highlights

Production hardening release: removed dead infrastructure, fixed all TypeScript
errors, eliminated false-positive VS Code extension warnings, and promoted
ESLint browser-compat checking to error level.

### Removed

- **Changesets infrastructure**: Deleted `.changeset/` directory,
  `changesets.yml` workflow, changeset/version scripts, and `@changesets/cli`
  dependency. Releases are done manually via `gh release`.
- **Redundant VS Code extensions**: Removed `webhint.vscode-webhint`,
  `kwesinavilot.baseline-lens`, and `benandrew.browser-compatibility-checker`
  from recommendations — ESLint `eslint-plugin-compat` already provides
  accurate browser compatibility checking that respects our browserslist.

### Changed

- **Browser compat ESLint rule promoted to error**: `compat/compat` now
  fails the build instead of warning, enforcing production-grade API usage.
- **VS Code settings hardened**: Disabled webhint extension (redundant),
  disabled GitHub Actions pinning refresh (fails behind corporate proxy).
- **Parent MyScripts tooling synced**: Removed dead `@changesets/cli`,
  added `eslint-plugin-compat` to shared devDependencies.

### Fixed

- **TypeScript strict error in `full-backup.ts`**: Fixed
  `exactOptionalPropertyTypes` violation when `methodWeights` was `undefined`
  or `Partial` — now properly filters and conditionally includes the field.
- **Documentation references**: Updated `ARCHITECTURE.md` and `ROADMAP.md`
  to reflect removal of changesets infrastructure.

---

## [11.7.0] - 2025-07-05

### Highlights

UX polish & data management sprint: smooth theme transitions, keyboard shortcuts
modal, data freshness indicators, configurable refresh intervals, rate-limit
visualization, comprehensive backup/restore, print styles, and drawing URL sharing.

### Added

- **Theme transition animation**: Smooth 300ms CSS transition on background-color,
  color, border-color, and box-shadow when switching between dark/light/high-contrast
  themes. Skipped on initial page load to avoid FOUC.
- **Keyboard shortcuts modal**: Press `?` to open a categorized dialog displaying all
  keyboard shortcuts with styled `<kbd>` elements grouped by category.
- **Data freshness indicator**: Aggregate badge in footer showing "Live" / "Xm ago" /
  "Xh ago" with color-coded freshness level (green/yellow/red).
- **Auto-refresh interval setting**: Users can configure refresh intervals between
  1–60 minutes from the Settings card. Persisted with validation (min 1m, max 60m).
- **Rate limit visualization**: Provider health card now shows a color-coded usage bar
  per provider tracking request count in a 60-second sliding window.
- **Full backup/restore**: Export now includes drawings, alert rules, theme, method
  weights, and card settings (schema version bumped to 8). Added `collectFullBackup()`
  helper and `exportAllDrawings()`/`importAllDrawings()` utilities.
- **Print-friendly stylesheet**: `@media print` rules that hide navigation/footer,
  force light background, add table borders, and show external link URLs.
- **Chart annotation URL sharing**: `encodeDrawingsUrl()` and `decodeDrawingsUrl()`
  encode up to 50 chart drawings into a base64url shareable link.

### Changed

- ROADMAP updated: K1–K5, L1, L2, L8 marked as done. M3 marked N/A. Phase N added.

---

## [11.6.0] - 2025-07-05

### Highlights

UX & documentation sprint: offline indicator, locale picker, drawing undo/redo,
"What's New" modal, service worker update prompt, and comprehensive docs expansion.

### Added

- **Offline indicator**: Fixed banner at top of viewport when network connectivity
  is lost, auto-dismisses on reconnection. ARIA `role="alert"` for screen readers.
- **Language picker**: Settings card now includes a locale dropdown (EN, ES, DE, ZH, HE)
  that calls `setLocale()` and persists the choice.
- **Drawing undo/redo**: `attachDrawingHistory()` module with Ctrl+Z/Ctrl+Y (Cmd+Z/Cmd+Shift+Z)
  keyboard support, 50-state history depth. 10 unit tests.
- **"What's New" modal**: Detects version change via localStorage and shows a modal
  with release highlights. Registry-based design for easy updates.
- **Plugin API docs page**: Full MDX reference for the custom indicator plugin system,
  fixing the dead link from charts.mdx.
- **Card guide pages**: Added docs for seasonality, provider-health, consensus-timeline,
  and strategy-comparison (M4 complete).
- **Uptime Kuma badge**: Status badge added to README.md linking to monitoring dashboard.

### Changed

- **SW update UX**: Replaced auto-refresh toast with a persistent bottom banner
  containing "Refresh" and "Later" buttons — user controls when to apply updates.
- **vitest.config.ts**: Added `define: { __APP_VERSION__ }` for test compatibility.
- Updated ROADMAP.md: marked K6–K17, L3–L11, M4, M6 as ✅ Done.

---

## [11.5.0] - 2025-07-05

### Highlights

Quality & testing sprint: eliminated all remaining innerHTML violations,
migrated to container queries, expanded accessibility & mobile testing,
enhanced CI with Lighthouse Web Vitals, and added GitHub issue templates.

### Added

- **M1 — Virtual scroller stress test**: 7 tests validating 10K-row performance
  (O(visible) DOM, spacer height, rapid updates, scroll simulation, dispose safety).
- **M2 — Mobile responsive e2e tests**: 6 Playwright tests across Pixel 7 / iPhone 14 /
  iPhone SE / Galaxy S9+ / iPad viewports (overflow, touch targets, nav wrap, card stack).
- **M7 — Lighthouse Web Vitals in CI**: `perf-regression.yml` now collects LCP, TBT,
  CLS, and performance score via Lighthouse CI and includes them in PR comments.
- **Toast dismiss button**: Notifications now include an accessible close button with
  `aria-label="Dismiss"` and keyboard support.
- **M5 — GitHub issue templates**: Bug report and feature request forms with structured
  fields (severity, browser, area dropdowns).

### Changed

- **R14 — innerHTML elimination**: Completed migration to 0 violations in `src/cards/`.
  Converted `alert-rules-ui.ts`, `chart-card.ts`, `consensus-timeline-card.ts`,
  `preset-filters.ts`, `provider-health-monitor.ts`, `screener-card.ts`, `screener.ts`.
- **K8/R16 — Container queries**: Migrated `.portfolio-columns` and `#watchlist-table`
  from `@media` to `@container card` queries for proper component-level responsiveness.
- **K15 — WCAG audit expanded**: `wcag-audit.spec.ts` now covers 23 routes (added
  provider-health, seasonality, comparison, strategy-comparison).
- Updated ROADMAP.md: R14, R16, K8, K15, M1, M2, M5, M7, M8 marked as ✅ Done.

---

## [11.4.0] - 2025-07-05

### Highlights

Architecture quality sprint completing K4 (event delegation) and K1
(patchDOM migration) across remaining card files.

### Changed

- **K4 — Event delegation**: Migrated `settings.ts`, `multi-chart-layout.ts`,
  and `screener-columns.ts` from direct `addEventListener` to `createDelegate`
  with `data-action` attributes. Only 5 legitimate direct listeners remain
  (canvas mouse tracking, SVG crosshair sync, keyboard shortcuts).
- **K1 — patchDOM migration**: Replaced `innerHTML` with `patchDOM()` in
  `macro-dashboard-card.ts`, `sector-rotation-card.ts`,
  `relative-strength-card.ts`, `strategy-comparison-card.ts`,
  `signal-dsl-card.ts` (9 instances), and `backtest-card.ts` (5 instances).
  Only 8 trivial `innerHTML` usages remain (empty clears, toast, alert row).
- Updated ROADMAP.md refactor backlog: R14 and R15 marked near-complete.

---

## [11.3.0] - 2025-07-04

### Highlights

Feature sprint delivering multi-condition alert rules, strategy comparison,
watchlist groups integration, and continued event delegation migration.

### Added

- **L3 — Multi-condition alert rules**: Full CRUD rule builder UI with AND/OR
  operators and per-condition types (method, consensus). Rules persist to
  localStorage and evaluate live against incoming signals during data refresh,
  firing browser notifications + sound on match.
- **L4 — Strategy comparison card**: Side-by-side SMA crossover backtest
  comparison with overlaid equity curves (SVG), stats table (return, CAGR,
  drawdown, win rate, profit factor, trades), and winner declaration.
- **L7 — Watchlist groups integration**: User-defined collapsible groups now
  render in the watchlist when present, with ungrouped tickers shown below.
- **K17 — Uptime Kuma config**: Fly.io deployment config (`monitoring/fly.toml`)
  for Uptime Kuma monitoring of CrossTide API health endpoints.
- **Nav links**: Added sidebar navigation entries for Strategy Comparison and
  Provider Health cards.
- **Provider Health**: Added to README card gallery (23 total cards).

### Changed

- **K4 — Event delegation expansion**: Migrated `backtest-card`, `signal-dsl-card`,
  `heatmap`, `preset-filters`, and `relative-strength-card` from direct
  `addEventListener` to `createDelegate` with `data-action` attributes.
- **M9 — README enhancement**: Added TypeScript 5.9 and Bundle <200 KB badges,
  full 23-card gallery table with descriptions.

### Fixed

- Registry test card count updated (22 → 23) for strategy-comparison card.
- Backtest and heatmap test selectors updated for delegation migration.

---

## [11.2.0] - 2025-07-03

### Highlights

Architecture quality sprint: complete patchDOM migration (K1) and event
delegation expansion (K4) across all remaining card modules. Every card now
uses incremental DOM diffing instead of innerHTML, and delegated `data-action`
handlers replace per-render addEventListener calls.

### Refactored

- **correlation-matrix-card**: patchDOM + createDelegate for period/crypto changes
- **comparison-card**: patchDOM for container + output, delegate for compare button
- **consensus-timeline-card**: patchDOM + delegate for ticker/days selects
- **alerts-card**: patchDOM for permission UI, delegate for enable-notify
- **signal-dsl-card**: patchDOM for initial render, delegate for clear/save/open
- **chart-card**: patchDOM for backtest section, delegate for timeframe + run-backtest
- **settings**: patchDOM + delegate for all action buttons (export, import, clear, Finnhub key)
- **screener-card**: patchDOM for empty states, delegate for preset filter buttons
- **watchlist-card**: patchDOM for loading placeholder
- **heatmap-card**: delegate for sector drill-down tile clicks

### Fixed

- Test selectors updated from `#btn-*` IDs to `[data-action='*']` attributes
- Consensus-timeline test uses `bubbles: true` for delegated change events

### Stats

- 4565 unit tests passing
- TypeScript strict mode clean
- K1 patchDOM migration: 100% complete (all 19 cards)
- K4 Event delegation: expanded from 1 to 10 cards

---

## [11.1.0] - 2025-07-03

### Highlights

Feature sprint completing all remaining Phase L & M roadmap items: watchlist
hover zoom, comprehensive user guides for 8 cards, and expanded contributing
documentation.

### Added

- **Watchlist hover zoom** (L11): pointerenter popup shows mini sparkline,
  day-change, consensus badge, and volume for any watchlist row. 300 ms show
  delay, 150 ms hide delay, auto-positions left when overflow detected.
- **User guides** (M4): added docs-site MDX pages for Risk Metrics,
  Correlation Matrix, Market Breadth, Sector Rotation, Macro Dashboard,
  Earnings Calendar, Signal DSL, and Relative Strength cards.
- **Contributing guide expansion** (M5): architecture overview, conventional
  commit conventions, testing guidelines, and file-naming rules.

### Fixed

- `ConsensusResult.strength` used correctly in hover zoom (was referencing
  non-existent `.score` property).

---

## [11.0.0] - 2025-07-02

### Highlights

Major release: cross-browser compatibility fixes, instrument type filter
correction, version bump, and hover zoom roadmap planning.

---

## [10.0.0] - 2025-06-15

### Highlights

Major release completing Phase L & M of the roadmap: strategy comparison,
extended charting tools, image export, comprehensive testing infrastructure,
CI automation, i18n expansion, and documentation showcase.

### Added

- **Strategy comparison** (L4): `compareStrategies()` domain function runs two
  backtest configs side-by-side and produces delta metrics (return, win rate,
  drawdown, trade count) with a winner determination.
- **Additional drawing tools** (L5): Rectangle, channel, ray, horizontal line,
  and text annotation tools added to the chart canvas overlay.
- **Export to image** (L9): `captureElementAsPng()` and `captureElementAsSvg()`
  utilities for exporting any card/chart as PNG (2x scale) or vector SVG.
- **Load testing** (M1): 7 stress tests validating VirtualScroller at 10K–50K
  rows with sub-50ms update performance assertions.
- **Mobile responsive audit** (M2): 10 unit tests covering WCAG 2.5.5 touch
  targets, horizontal overflow prevention, iOS Safari safe areas.
- **WebSocket reconnect stress tests** (M3): Extended to 13 tests covering
  backoff ceiling, concurrent listeners, handler persistence across reconnects,
  and 100 rapid flaps in 1 second.
- **Performance regression CI** (M7): New `perf-regression.yml` workflow that
  compares PR bundle size vs base, posts delta comments, fails on budget breach.
- **Dependency audit automation** (M8): Auto-creates GitHub issues on weekly
  audit failures; added license-compliance job (rejects GPL/AGPL in production).
- **README showcase** (M9): Feature highlights table, competitive comparison
  (vs TradingView/Yahoo/Finviz), screenshots section.
- **i18n expansion** (M6): Full translation dictionaries for Spanish (es),
  German (de), and Chinese Simplified (zh) — 100+ keys each with ICU plural
  support. Barrel export with `SUPPORTED_LOCALES` and `LOCALE_LABELS`.

---

## [8.0.0] - 2026-05-03

### Highlights

Major release delivering Phase K of the architecture roadmap: performance
infrastructure, accessibility improvements, observability, and developer
experience enhancements.

### Added

- **Request deduplication** (K3): `fetchOnce()` in-flight promise cache prevents
  duplicate concurrent network requests to the same resource.
- **Event delegation** (K4): `createDelegate()` utility with `data-action`
  dispatch pattern — single listener per container, routes to named handlers.
- **ARIA live regions** (K6): Card containers now have `aria-live="polite"` so
  screen readers announce content refreshes automatically.
- **Worker health check CI job** (K10): New CI step starts worker via wrangler
  dev and verifies /api/health + X-Request-ID header.
- **CSP report-uri** (K11): `POST /api/csp-report` endpoint logs Content-Security-Policy
  violations; CSP directives now include `report-uri /api/csp-report`.
- **X-Request-ID propagation** (K12): Worker middleware generates/echoes a UUID
  request ID on every response for end-to-end tracing.

### Changed

- **Sparkline memoization** (K13): `renderSparkline()` results cached via 128-entry
  LRU Map keyed by data content + options — avoids redundant SVG rebuilds.
- **VS Code workspace config**: Disable built-in CSS validation (Stylelint handles
  CSS linting); suppress progressive-enhancement compat warnings.

### Fixed

- **Chart sync cleanup** (K5): Multi-chart layout now unsubscribes panel
  crosshair registrations before re-render, preventing duplicate updates.
- **Prettier formatting**: 19 files reformatted to match project code style.

---

## [7.25.0] - 2026-05-03

### Breaking

- **Remove deprecated corsProxy API**: `setCorsProxy()`, `getCorsProxy()`, and
  internal `proxyUrl()` removed from `src/core/data-service.ts`. CORS proxy was
  a no-op since v7.22.0 (Vite proxy handles dev; Yahoo CORS headers handle prod).

### Removed

- `TwelveDataTimeSeriesSchema` from valibot-schemas (zero imports; Twelve Data
  provider removed in R23).
- `corsproxy.io` from CSP `connect-src` in vite.config.ts.
- Superseded roadmap archives (`ROADMAP.archive-2026-04.md`,
  `ROADMAP.archive-2026-05.md`) — preserved in git history.

### Fixed

- `vitest.config.ts` coverage exclusion typo: `paste-overlay` → `palette-overlay`.
- `docs/ROADMAP.md` markdown table formatting (MD060 compliance).

### Changed

- **ESLint**: Tightened `varsIgnorePattern` from 30+ prefixes to `^_` only.
- **Browserslist**: Expanded to Opera, Samsung Internet, ChromeAndroid,
  FirefoxAndroid, iOS ≥ 16.4.
- **Playwright**: 7 projects (Chromium, Firefox, WebKit, Edge, Pixel 7,
  iPhone 14, iPad).
- **Vitest browser**: 3 engines (Chromium, Firefox, WebKit).

### Added

- `tests/browser/cross-browser-compat.browser.test.ts` — 50+ Web API assertions
  across all engines.
- `tests/e2e/responsive.spec.ts` — viewport, dark/light mode, reduced motion,
  overflow detection.
- `config/css-custom-data.json` — teaches VS Code about `@starting-style`,
  `@scope`, `@container`, `@layer`, anchor positioning, `forced-color-adjust`.
- README troubleshooting section.
- `eslint-plugin-import-x` and `playwright` added to parent MyScripts shared deps.

### Verified

- 0 TypeScript errors (strict mode)
- 0 ESLint warnings (`--max-warnings 0`)
- 4,304 unit tests passing (367 test files)
- Production build: 129.1 KB gzip JS, 44 SW precache entries (633.6 KB)

---

## [7.24.0] - 2026-05-04

### Fixed

- **Service Worker types**: Added `/// <reference lib="webworker" />` triple-slash
  directive to `src/sw.ts`, resolving all 9 VS Code type errors for
  `ServiceWorkerGlobalScope` APIs without changing runtime behavior.
- **Vite preview proxy**: Made `secure` flag conditional on proxy presence
  (`secure: !proxyAgent`) so corporate MITM proxies don't break preview mode.

### Changed

- **VS Code settings**: Disabled built-in CSS validation (project uses Stylelint),
  suppressed unknown-at-rule lint for `@starting-style`/`@scope`, added `softprops`
  to GitHub Actions trusted authors.

### Verified

- 0 TypeScript errors (strict mode, noUncheckedIndexedAccess)
- 0 ESLint warnings (--max-warnings 0)
- 4,308 unit tests passing (367 test files)
- Production build: 129.1 KB gzip JS, 44 SW precache entries (633.7 KB)
- Bundle budget: PASS (129.1 KB < 200 KB)

---

## [7.23.0] - 2026-05-03

### Changed — 20-task production readiness sprint

- **Dead code removal**: Deleted `src/ui/date-format.ts` (dead re-export superseded
  by `core/date-format.ts` since v7.15.0). Updated test import paths.
- **Barrel export cleanup**: Removed dead date-format re-exports from `src/ui/index.ts`.
- **ROADMAP updated**: Added Sprint Log section with 20-task checklist, updated
  declared version and test count (4308 tests).
- **ARCHITECTURE.md**: Updated version stamp to v7.23.0.

### Verified (all 20 sprint tasks)

- 0 TypeScript errors (strict mode, noUncheckedIndexedAccess)
- 0 ESLint warnings (--max-warnings 0)
- 4,308 unit tests passing (367 test files)
- Production build: 78 KB main bundle (25.6 KB gzip), 44 SW precache entries
- No non-web code paths, no Python, no duplicate utilities
- CI/Release workflows, .vscode standards, Dependabot all confirmed operational

---

## [7.22.0] - 2026-05-03

### Added — Production hardening & proxy support

- **Corporate proxy support**: Vite dev server routes Yahoo/Stooq/Worker requests
  through `https-proxy-agent` when `HTTPS_PROXY` / `HTTP_PROXY` env vars are set.
  Enables local development behind corporate firewalls.
- **Cards barrel export**: Created `src/cards/index.ts` barrel file to match the
  `"./cards"` export declared in package.json.
- **Browserslist config**: Added explicit browser targets to package.json for
  accurate CSS/HTML compatibility validation in VS Code.

### Changed

- **Workspace organization**: Moved CODE_OF_CONDUCT.md, CONTRIBUTING.md, and
  SECURITY.md to `.github/` directory (GitHub discovers them there).
- **tsconfig.json**: SW file is properly excluded; VS Code picks up
  `tsconfig.sw.json` for service worker type-checking.
- **.gitignore**: Added `*.tsbuildinfo` pattern.
- **.vscode/settings.json**: Added CSS compat and GitHub Actions trust settings.

### Fixed

- **Provider registry**: Yahoo and Stooq providers now use Vite proxy paths
  (`/api/yahoo`, `/api/stooq`) in dev mode, fixing CORS failures behind proxies.

---

## [7.21.0] - 2025-07-03

### Changed — Production hardening

- **TypeScript**: Fixed all 188 type errors — zero `tsc --noEmit` errors.
- **ESLint**: Resolved all lint warnings — zero warnings with `--max-warnings 0`.
- **File moves**: Consolidated configuration files into `config/` directory.

---

## [7.20.0] - 2026-05-05

### Added — 10-sprint delivery (coverage sweep session 12)

- **Coverage — pattern-recognition.ts + scale-linear.ts**: 8 tests covering Bearish
  Engulfing, Evening Star, Three Black Crows patterns, and `tickStep` rounding.
- **Coverage — signal-dsl.ts**: 15 tests covering `*`, `/`, `<=`, `!=` operators,
  multi-arg function calls, whitespace tolerance, and boolean literal parsing.
- **Coverage — backtest-engine.ts**: 5 tests covering force-close at simulation end,
  drawdown calculation, majority-signal edge, zero initial capital, and HOLD signals.
- **Coverage — export-import.ts**: 3 tests covering schema version rejection, checksum
  mismatch detection, and CompressionStream fallback path.
- **Coverage — push-notifications.ts**: 5 tests covering missing p256dh/auth keys, SW
  ready rejection, permission denied, getSubscription throws, unsubscribe throws.
- **Coverage — finnhub-stream-manager.ts**: 4 tests covering empty/whitespace apiKey
  guard, setTickers no-stream no-op, and localStorage throw during persistence.
- **Coverage — onboarding-tour.ts**: 4 tests covering empty steps early return, Back
  button navigation, Escape key dismissal, and overlay click close.
- **Coverage — file-system-access.ts + circuit-breaker.ts + webauthn.ts**: 7 tests
  covering non-AbortError fallback in file picker, initial circuit-breaker state
  snapshot, and webauthn conditional mediation absent / getPublicKey undefined.
- **Coverage — tiered-cache.ts**: 7 tests covering localStorage quota exceeded in
  `set()`, corrupt JSON in `get()`, expired L2 cleanup, `clear()`/`delete()` with
  localStorage errors, and `evictOldest` boundary cases.

---

## [7.19.0] - 2026-05-05

### Added — 10-sprint delivery (coverage sweep session 11)

- **Coverage — push-notifications.ts** (81%→98%): 6 tests covering non-SW Notification
  fallback path, Notification API absent branch, and no-subscription path in subscribeToPush.
- **Coverage — plugin-api.ts** (83%→100%): 6 tests covering `loadIndicatorModule`
  dynamic-import branches for valid, invalid-export, schema-fail, and empty-module URLs
  via `vi.mock` HTTP URL interception.
- **Coverage — drawing-tools.ts** (91%→97%): 2 tests covering the null canvas context
  no-op handle branch (all draw/resize/cursor callbacks are safe no-ops).
- **Coverage — popover.ts** (83%→100%): 5 tests covering native Popover API toggle,
  `isPopoverOpen` via `matches(:popover-open)`, `ManagedPopover.toggle()`, and
  `attachAnchorTrigger` with popover.id set.
- **Coverage — polygon-provider.ts** (83%→98%) + **yahoo-provider.ts** (84%→93%)\*\*:
  10 tests covering schema parse failure, partial field mapping (only exchange / only
  type / neither), and catch branches in both providers.
- **Coverage — worker-rpc.ts** (86%→98%): 4 tests covering `callWithTransfer` method —
  resolve, reject, ID increment, and empty transfer list.
- **Coverage — toast.ts** (87%→95%) + **aria-live.ts** (91%→100%)\*\*: 7 tests covering
  Popover API `showPopover`/`hidePopover` paths, `animationend` listener branch, and
  non-DOM environment early returns.
- **Coverage — sw-update.ts** (86%→95%) + **broadcast-channel.ts** (88%→98%) +
  **chart-sync.ts** (86%→97%)\*\*: 8 tests covering `onUpdateFound` when `installing` is
  null but `waiting` is set, `console.error` when a config-change handler throws,
  `console.warn` when `postMessage` fails on a closed channel, and the
  `subscribeCrosshairMove` callback body including the `isSyncing` re-entrancy guard.
- **Coverage — obv-method.ts** (86%→100%): 2 tests covering the SELL bearish-divergence
  branch (OBV falling while price rising) and signal field population.
- **Coverage — settings.ts** (89%→97%): 7 tests covering `readCardSettingsFromPanel`
  for all remaining card types — consensus, heatmap, backtest, alerts, portfolio, and
  risk — via field change events.

### Stats

- **Total tests**: ~4 191 passing across ~348 test files
- **New tests this release**: +57 across 13 new coverage test files

---

## [7.18.0] - 2026-05-04

### Added — 10-sprint delivery (coverage sweep + J11/J16)

- **Coverage — export-import.ts**: 9 tests covering importConfigJSON edge cases
  (null/primitive watchlist entries, missing addedAt, non-object root, high-contrast
  theme, no-checksum path), downloadCompressedFile with CompressionStream, and
  downloadFile URL revocation.
- **Coverage — scroll-driven.ts**: 9 tests covering attachScrollProgress fallback
  path (scroll ratio, clamping), native ScrollTimeline path (rAF loop, null
  currentTime, progress clamping, playState handling), and createViewTimeline dispose.
- **Coverage — router.ts**: 16 tests covering link click interception (modifier
  keys, data-param extraction), spa-redirect restoration, View Transitions API,
  navigation signal, hash fallback, and replace-mode navigation.
- **Coverage — config.ts**: 11 tests covering all parseSingleCardSettings switch
  branches (watchlist through risk), invalid settings graceful skip, and non-object
  cardSettings handling.
- **Coverage — telemetry.ts**: 5 tests covering analytics-only path (error boundary
  without handler), web vitals callback forwarding, destroy teardown sequence,
  pageview delegation, and setEnabled delegation.
- **Coverage — settings.ts**: 15 tests covering card settings panel rendering for
  all 9 card types, onCardSettingsChange emit, Finnhub API key save/clear, export-gz
  button, and method weights slider + reset.
- **Coverage — fetch.ts**: 10 tests covering fetchConditional (304 Not Modified,
  200 with validators, 500 error, parent signal abort), fetchWithTimeout parentSignal
  forwarding, and fetchWithRetry abort bail without retry.
- **J16 — WebSocket reconnect stress tests**: 9 tests simulating rapid disconnect
  flaps (20 cycles), max-attempt exhaustion, 100-message burst during reconnection,
  interleaved open/close events, Symbol.dispose auto-close, error forwarding, and
  readyState reporting.
- **J11 — Accessibility ARIA sweep**: Added skip-to-main-content link, ARIA landmarks
  (`role="banner"`, `role="navigation"`, `role="main"`), `aria-current="page"` on
  active nav links, `aria-live="polite"` on market status badge, `prefers-contrast:
more` support, and `focus-within` outline on card sections.

---

## [7.17.0] - 2026-05-03

### Added — 10-sprint delivery (J1–J8, Phase J roadmap)

- **J2–J4 — User Guide Pages**: Added 3 new user guide MDX pages — **Screener**,
  **Backtest Engine**, and **Alerts** — in `docs-site/src/content/docs/`.
  Each guide documents UI features, parameters, keyboard shortcuts, and export options.
- **J5 — Docs Sidebar Fix**: Added "User Guides" sidebar section linking all 6 guide
  pages (Charts, Portfolio, Watchlist, Screener, Backtest, Alerts). Removed broken
  "Core Utilities" autogenerate pointing to non-existent content directory.
- **J6 — Card Tests Batch 1**: Tests for `chart-card`, `consensus-card`, `watchlist-card`
  adapters (13 tests). Covers mount/update/dispose lifecycle and backtest UI rendering.
- **J7 — Card Tests Batch 2**: Tests for `market-breadth-data`, `screener-data`,
  `settings-card` bridges and adapters (11 tests). Covers getter/setter round-trips and
  settings callback wiring.
- **J8 — Core Worker Tests**: Tests for `app-store`, `backtest-worker`, `compute-worker`
  (11 tests). Validates reactive signal semantics, synchronous fallback path, and type
  interface shape.
- **Phase J Roadmap**: Added Phase J (v10.0.0) to ROADMAP.md — 8 future items including
  E2E Playwright tests, WCAG accessibility audit, i18n scaffolding, and plugin API.

### Changed

- **J1 — CHANGELOG Backfill**: Added missing entries for v7.14.0, v7.15.0, and v7.16.0.

### Stats

- **Total tests**: 3 990 passing across 325 test files
- **New tests this release**: 35 (13 + 11 + 11)
- **New docs pages**: 3 user guides + Phase J roadmap section

---

## [7.16.0] - 2026-05-03

### Added — 10-sprint delivery (F2, F5, F6, R4, R21)

- **F6 — Indicator MDX Reference (batches 1–4)**: 44 new MDX indicator reference pages
  in `docs-site/src/content/docs/indicators/`, bringing the total to **48 pages**.
  Covers oscillators (stochastic-rsi, connors-rsi, cmo, momentum, roc, tsi, trix, ppo,
  kst, fisher-transform, ultimate-oscillator), trend/MA (supertrend, parabolic-sar,
  ichimoku, dema-tema, hull-ma, kama, wma, dpo, ma-crossover, linear-regression,
  coppock-curve, vortex), volume/volatility (force-index, chaikin-money-flow,
  chaikin-oscillator, klinger-oscillator, ease-of-movement, ad-line, choppiness-index,
  keltner, donchian, envelope, mass-index, ulcer-index, elder-ray, elder-impulse),
  and advanced (anchored-vwap, volume-profile, pivots, zigzag, fractals, heikin-ashi, mfi).
- **F5 — Telemetry env vars**: `.env.example` documenting `VITE_GLITCHTIP_DSN`,
  `VITE_PLAUSIBLE_URL`, `VITE_PLAUSIBLE_SITE`, `VITE_WORKER_BASE_URL`.
- **F2 — Docs deploy workflow**: `.github/workflows/docs.yml` for Astro Starlight
  docs-site deployment to GitHub Pages. Docs badge added to README.
- **R4 — Subpath exports**: `package.json` `exports` field with `./core`, `./domain`,
  `./cards`, `./ui` subpaths.
- **R21 — ARCHITECTURE.md update**: comprehensive rewrite from v7.5 to v7.15 — now
  reflects 112 domain modules, 20 routes, Hono Worker, 3884 tests, 48 MDX pages.

### Changed

- `.gitignore`: added `.env.local` entry.
- Roadmap: comprehensive status sync marking all completed F/G/H/I/R items.

---

## [7.15.0] - 2026-04-26

### Added — 10-sprint delivery (F3, F4, F10, R5, R6, R8, R16, G15)

- **R16 — Unified Cache Manager** (`cache-manager.ts`): facade over memory/LRU/tiered
  cache strategies with stats tracking (36 tests).
- **Alpha Vantage Provider**: last-resort tertiary failover in provider chain (19 tests).
- **R8 — Core date-format** (`date-format.ts`): `parseIsoDate`, `relativeTime`, trading
  day helpers — unified from duplicate `ui/date-format` and `core/date-format` (31 tests).
- **F4 — Structured Request Logger** (`request-logger.ts`): IP hashing, JSON log lines
  for Logpush via Worker middleware (31 tests).
- **F10 — gitleaks**: secret scanning config + CI job.
- **Provider Mock Factory**: `makeQuote`, `makeCandles`, `createMockProvider` (19 tests).
- **F3 — E2E Expansion**: keyboard shortcuts and settings view Playwright specs.
- **R5 — Cast cleanup**: removed 10 unnecessary `as` casts; replaced with non-null
  assertions and `instanceof` guards.
- **G15 — JSDoc sweep**: section headers and one-line descriptions for all domain barrel
  exports.
- Roadmap status sync marking F3/F4/F10/R5/R6/R8/R16/G15 as Done.

### Stats

- **166 new tests** across new modules
- Test total: **3819 tests** across **311 test files**

---

## [7.14.0] - 2026-04-19

### Added — 10-sprint delivery (G4, I5, H10, I3, I8, I7, I4, R24, H17, R23)

- **G4 — Transferable OHLCV** (`transferable-ohlc.ts`): zero-copy `Float64Array` helpers
  for compute Worker backtest + screener (19 tests).
- **I5 — Public REST API Helpers**: rate-limit, pagination, and validation utilities for
  read-only Hono Worker routes (43 tests).
- **H10 — Durable Objects WS Fan-out** (`ws-fanout.ts`): channel manager for real-time
  tick distribution per symbol (23 tests).
- **I3 — Pattern Backtesting**: historical win-rate validation of ONNX-detected candlestick
  patterns (19 tests).
- **I8 — Collaborative Watchlist Sharing** (`watchlist-share.ts`): share-by-URL read-only
  snapshots with TTL and merge logic (25 tests).
- **I7 — CRDT Config Merge** (`crdt-sync.ts`): LWW registers, G-Set, OR-Set for
  multi-device cloud sync conflict resolution (28 tests).
- **I4 — ONNX Model Pipeline** (`onnx-pipeline.ts`): metadata, tensor validation, and
  normalization utilities (28 tests).
- **R24 — Market-hours Detection**: WS connection gating for 6 exchanges with timezone
  awareness (19 tests).
- **H17 — Tauri 2.0 Bridge** (`tauri-bridge.ts`): IPC, window management, deep links,
  tray integration (23 tests).
- **R23 — Remove Twelve Data Provider**: cleaned up imports, failover chain, and
  schema (6 tests).

### Stats

- **233 new tests** across 10 new / refactored modules
- Test total: **3604+ tests** across **302+ test files**

---

## [7.13.0] - 2025-07-17

### Added — 10-sprint delivery (H8, H16, I1, I2, H4, H13, I9, I10, I11, I6)

- **H8 — OPFS Storage Tier** (`opfs-storage.ts`): `opfsSupported`, `writeCandles`,
  `readCandles`, `deleteCandles`, `listTickers`, `getArchiveSize`, `clearAllArchives`,
  `serializeCandles`, `deserializeCandles` — binary 48-byte/candle format for persistent
  OHLCV archive in Origin Private File System (25 new tests).
- **H16 — uPlot Inline Chart Helpers** (`uplot-helpers.ts`): `buildSparklineOpts`,
  `buildMiniChartOpts`, `closesToSparklineData`, `candlesToUplotData`, `priceRangeFromData`,
  `sparklineColor`, `buildVolumeBarSeries`, `hexToRgba` — config builders for sparklines
  and mini-charts (34 new tests).
- **I1 — ONNX Runtime Web Helpers** (`onnx-patterns.ts`): `onnxSupported`,
  `preprocessCandles`, `softmax`, `argmax`, `topK`, `buildInputTensor`,
  `createModelLoader` — dependency-injected abstraction for on-device ML pattern
  recognition (29 new tests).
- **I2 — Candlestick Pattern Recognition** (`pattern-recognition.ts`): `bodySize`,
  `candleRange`, `upperShadow`, `lowerShadow`, `isBullish`, `isDoji`, `isHammer`,
  `isShootingStar`, `isSpinningTop`, `isMarubozu`, `isBullishEngulfing`,
  `isBearishEngulfing`, `isMorningStar`, `isEveningStar`, `isThreeWhiteSoldiers`,
  `isThreeBlackCrows`, `detectAllPatterns` — 10 rule-based candlestick pattern
  detectors + full-scan scanner (45 new tests).
- **H4 — Scroll-driven Animations** (`scroll-driven.ts`): `supportsScrollDriven`,
  `supportsViewTimeline`, `createScrollTimeline`, `createViewTimeline`,
  `attachScrollProgress`, `buildScrollTimelineCss`, `buildViewTimelineCss`,
  `buildAnimationCss` — progressive enhancement for CSS scroll-timeline API (24 new tests).
- **H13 — XLSX Export** (`xlsx-export.ts`): `createWorkbook`, `addSheet`, `generateXlsx`,
  `cellRef`, `escapeXml`, `inferCellType` — zero-dependency OOXML SpreadsheetML generator
  with minimal ZIP builder (34 new tests).
- **I9 — Market Regime Detection** (`market-regime.ts`): `Regime` enum,
  `classifyVix`, `classifyBreadth`, `classifyYieldCurve`, `classifyDollar`,
  `trendRegime`, `volatilityRegime`, `combinedRegime`, `regimeScore`, `regimeLabel`,
  `regimeColor` — rule-based macro regime classifier with weighted ensemble (49 new tests).
- **I10 — Economic Calendar** (`economic-calendar.ts`): `EventImpact`/`EventCategory`
  enums, `parseEconEvent`, `filterByImpact`, `filterByCountry`, `filterByDateRange`,
  `groupByDate`, `groupByCountry`, `nextEvent`, `classifyImpact`, `classifyCategory`,
  `formatSurprise`, `surprisePct`, `isMarketMoving` — macro event parsing and analysis
  (47 new tests).
- **I11 — News Digest** (`news-digest.ts`): `detectFormat`, `parseRssFeed`,
  `parseAtomFeed`, `parseFeed`, `extractTickers`, `groupByTicker`, `scoreSentiment`,
  `classifySentiment`, `deduplicateItems`, `sortByDate`, `summariseDigest` — RSS/Atom
  feed parsing with ticker extraction and keyword sentiment scoring (41 new tests).
- **I6 — Signal Strategy I/O** (`signal-strategy-io.ts`): `exportStrategy`,
  `importStrategy`, `exportBundle`, `importBundle`, `validateExpression`, `validateVars`,
  `checksumPayload`, `encodeShareUrl`, `decodeShareUrl`, `payloadToClipboardText` —
  portable JSON strategy sharing with checksum integrity and URL encoding (37 new tests).

### Stats

- **365 new tests** across 10 new modules and test files
- Test total: **3604 tests** across **302 test files**
- All existing tests continue to pass

---

## [7.12.0] - 2026-07-30

### Added — 10-sprint delivery (H6, H21, G21, G8, G9, H3, H5, G18, G19, G16)

- **H6 — File System Access API tests**: Full test coverage for existing
  `file-system-access.ts` (`saveStrategyToDisk`, `openStrategyFromDisk`) with
  `showSaveFilePicker`/`showOpenFilePicker` mocks and `<a>` fallback paths (14 new tests).
- **H21 — Relative Strength Comparison** (`relative-strength.ts`): `normalizeSeries`,
  `windowStartDate` (1W/1M/3M/6M/1Y/YTD windows), `computeRelativeStrengths`,
  `findOutperformer`, `findUnderperformer`, `summariseReturns` (24 new tests).
- **G21 — Heatmap Sector Drilldown** (`heatmap-drilldown.ts`): `buildDrilldown`,
  `sortDrilldown`, `buildBreadcrumb`, `computeAttributionBar`, `buildDrilldownEntries`
  with `DrilldownEntry.attributionShare` (25 new tests).
- **G8 — Navigation API module** (`navigation-api.ts`): `supportsNavigationApi`,
  `getNavigationApi`, `interceptNavigation`, `navigateWithApi`, `currentNavigationUrl`,
  `onNavigationStart`, `isSameOrigin` — progressive enhancement over History API
  with `history.pushState` fallback (20 new tests).
- **G9 — Popover API utility** (`ui/popover.ts`): `supportsPopover`, `openPopover`,
  `closePopover`, `togglePopover`, `isPopoverOpen`, `createManagedPopover`,
  `attachAnchorTrigger` — Baseline 2024 wrappers with `display` fallback (18 new tests).
- **H3 — Speculation Rules API** (`speculation-rules.ts`): `speculationRulesSupported`,
  `injectSpeculationRules`, `buildPrefetchRules`, `buildPrerenderRules`,
  `removeSpeculationRules`, `linkPrefetchFallback` — Chromium 121+ with
  `<link rel="prefetch">` fallback (20 new tests).
- **H5 — CSS @scope utility** (`css-scope.ts`): `supportsCssScope`, `buildScopeRule`,
  `injectScopedStyles`, `removeScopedStyles`, `removeAllScopedStyles` — Baseline 2024
  `@scope` injection with verbatim-CSS fallback (16 new tests).
- **G18 — ETF constituent drilldown** (`etf-drilldown.ts`): `buildEtfDrilldown`,
  `topHoldingsByWeight`, `topHoldersByContribution`, `positiveContributors`,
  `negativeContributors` — weighted contribution analytics with attribution shares (19 new tests).
- **G19 — Name enrichment helpers** (`name-enrichment.ts`): `normaliseCompanyName`,
  `extractShortName`, `formatDisplayName`, `enrichWatchlistEntry`, `buildNameMap` —
  strips legal suffixes and share-class qualifiers; builds O(1) name lookup maps (28 new tests).
- **G16 — Inter Variable font loading** (`font-loader.ts` + `styles/fonts.css`):
  `fontLoadingSupported`, `isFontLoaded`, `waitForFont`, `preloadFont`, `observeFontLoad`;
  `@font-face` declarations for Inter Variable + JetBrains Mono with `font-display: optional` (13 new tests).

Total new tests: +197 (3042 → 3239)

---

## [7.11.0] - 2026-07-29

### Added — 8-sprint delivery (G11, G20, G22, G23, G24, H18, H19, H20)

- **G11 — Compression Streams** (`compress.ts`): `compressStringToGzip`,
  `compressionStreamSupported`, `estimateGzipRatio`, `gzipFilename` — gzip
  export helpers via the Baseline-2023 CompressionStream API with graceful
  fallback (16 new tests).
- **G20 — Custom weight edge-cases**: Extended consensus-engine tests covering
  `weight=0` silencing indicators, all-zero → NEUTRAL, boosted-weight amplification,
  and strength clamping to [0, 1] (8 new tests, 19 total in file).
- **G22 — Correlation Heatmap render-data** (`correlation-heatmap.ts`):
  `rToHslColor`, `buildHeatmapRenderData` (flat n×n cell array, diagonal
  detection, warning pairs sorted by |r|), `sliceCorrelationResult` (19 new tests).
- **G23 — Market Breadth analytics** (`market-breadth.ts`): `computeMarketBreadth`
  aggregates per-ticker change/SMA data into buy/sell/neutral counts; `classifyBreadthCondition`
  produces bullish/bearish/neutral regime (18 new tests).
- **G24 — Per-card settings helpers**: `setCardSetting<K>` and `getCardSetting<K>`
  pure functions added to `config.ts`; reactive `onCardSettingsChange` signal
  exported from `card-settings-signal.ts` (16 new tests across 2 files).
- **H18 — Earnings Calendar domain** (`earnings-calendar.ts`): `parseEarningsResponse`,
  `sortByDate`, `filterUpcoming`, `getDaysUntilEarnings`, `classifySurprise` (23 new tests).
- **H19 — Macro Dashboard domain** (`macro-dashboard.ts`): `MACRO_TICKERS` constants,
  `classifyMacroRegime`, `classifyMacroRegimeExtended`, `formatMacroChange`,
  `regimeLabel`, `regimeCssClass`, `getMacroTicker` (20 new tests).
- **H20 — Sector Rotation domain** (`sector-rotation.ts`): `SECTOR_ETFS` (11 SPDR ETFs),
  `computeReturn`, `computeRelativeReturn`, `classifySectorPerformance`, `rankSectors`
  (22 new tests).

### Stats

- Tests: **3042** (+149 from v7.10.0)
- New source files: 7 (compress.ts, correlation-heatmap.ts, market-breadth.ts,
  earnings-calendar.ts, macro-dashboard.ts, sector-rotation.ts, card-settings-signal.ts exists)

---

## [7.10.0] - 2026-07-28

### Added — 10-sprint delivery (G5, G10, G12, G13, G7, H15, H7, H2, H1, G17)

- **G5 — `expectTypeOf` type assertions** (47 new tests): Type-level tests using
  Vitest's `expectTypeOf` API across core utilities, providers, domain, and cards.
- **G10 — OpenAPI /openapi.json endpoint**: Worker route serving a full OpenAPI 3.1
  spec with Cache-Control: max-age=3600 (5 new tests).
- **G12 — `Symbol.dispose` / `using` cleanup**: `ReconnectingWebSocket` and
  `WorkerClient` implement `Symbol.dispose` for deterministic resource cleanup (5
  new tests).
- **G13 — Cloudflare native Rate Limiting API**: Worker middleware uses CF
  `RateLimiter` binding when available, falls back to in-memory token bucket (4
  new tests, 53 total worker tests).
- **G7 — Temporal polyfill** (`@js-temporal/polyfill ^0.5.1`): `toPlainDate`,
  `plainDateRange`, and `addTradingDays` added to `timezone.ts`; `Temporal` re-
  exported from `core/index.ts` (12 new tests, 17 timezone tests total).
- **H15 — Tiingo EOD/REST provider**: Full `MarketDataProvider` implementation
  covering IEX quotes, EOD history, and search; Valibot schemas added (13 new
  tests).
- **H7 — Background Fetch API wrapper**: `backgroundFetchSupported`,
  `startArchiveDownload`, `getActiveFetches`, `onFetchProgress`, and
  `fetchWithFallback` in `src/core/background-fetch.ts` (13 new tests).
- **H2 — `@starting-style` CSS entry animations**: `.card`, `.modal`/`[popover]`,
  `.toast`, and `.detail-panel` gain smooth mount transitions in
  `src/styles/components.css`.
- **H1 — CSS Anchor Positioning for chart crosshair tooltip**: `createAnchorTooltip`
  in `src/ui/anchor-tooltip.ts`; native path via `anchor-name`/`position-anchor`,
  JS fallback for unsupported browsers; `@supports` guard in components.css (16
  new tests).
- **G17 — `@vitest/browser` mode**: 12 browser tests running in real headless
  Chromium via Playwright (`vitest.browser.config.ts`), covering CSS Anchor
  Positioning, Temporal timezone functions, and Background Fetch detection.

### Total test count: 2877 (happy-dom) + 12 (browser / Chromium)

---

## [7.8.0] - 2026-07-26

### Changed — F1 (P0): Valibot-only validation

- **Removed `zod` from production dependencies** — `valibot` is now the sole
  runtime validator. `src/types/valibot-schemas.ts` covers all domain, provider,
  and config schemas: `TickerSchema`, `MethodSignalSchema`, `ConsensusResultSchema`,
  `AppConfigSchema`, `WatchlistEntrySchema`, `ThemeSchema`, all provider schemas
  (Yahoo, Finnhub, CoinGecko, Polygon), plus `parseOrThrow` / `flattenIssues`
  helpers.
- Deleted `src/types/zod-schemas.ts` and `tests/unit/types/zod-schemas.test.ts`.
- Removes ~13 KB gz from initial bundle.

---

## [7.7.0] - 2026-07-19

### Minor — Production-readiness sprint

#### Fixed

- **CSS browser compatibility** — Added `-webkit-user-select: none` prefix on
  `.sortable` and `.sector-header` (Safari support); added
  `-webkit-forced-color-adjust: none` prefix in `a11y.css` (Safari forced
  colours). `@keyframes live-flash` `color-mix()` wrapped in
  `@supports (background-color: color-mix(...))` with `rgba()` fallback for
  Chrome <111. `view-transition-name` and `::view-transition-*` rules wrapped
  in `@supports (view-transition-name: none)` for progressive enhancement.
- **Inline style removed** — `#pwa-install-group` `style="display:none"` in
  `index.html` replaced with `.setting-group.hidden { display: none }` CSS
  class; `main.ts` updated to use `classList.add/remove("hidden")`.
- **Worker tsconfig** — Added missing `forceConsistentCasingInFileNames: true`
  to `worker/tsconfig.json`.
- **docs-site tsconfig** — Removed deprecated `baseUrl: "."` and corrected
  `paths` to `"./src/*"`; ran `npm install` to resolve missing Astro type
  extensions.
- **docs-site CSS** — Fixed `hsl()` from modern space-separated syntax to
  legacy comma notation for broad browser compat.

#### Changed

- **`config/` subdirectory** — Five root-level linter/tool config files moved
  to `config/`:
  - `.htmlhintrc`, `.markdownlint.json`, `.stylelintrc.json`,
    `commitlint.config.mjs`, `lighthouserc.json`.
    All `package.json` scripts, `simple-git-hooks`, `lint-staged`, `.github/`
    workflows, `eslint.config.mjs`, and `.vscode/settings.json` updated to
    reference the new paths.
- **Lighthouse assertions** — All `"warn"` assertions in `config/lighthouserc.json`
  promoted to `"error"` (performance, best-practices, SEO, FCP, LCP, TBT, CLS,
  interactive). Zero false-passes from here on.
- **`wrangler.toml`** (root + `worker/`) — Removed all commented-out
  placeholder `[[kv_namespaces]]` and `[[r2_buckets]]` blocks.
- **`.gitignore`** — Added `docs-site/node_modules/`.
- **ESLint** — Added `config/**` and `docs-site/**` to ignore list.
- **VS Code settings** — Added `markdownlint.config` and
  `stylelint.configFile` extensions paths pointing to `config/`.

#### Removed

- **`stylelint-config-standard` devDependency** — Was listed in
  `package.json` but unused (`.stylelintrc.json` has no `extends` array).
  Removed with `npm uninstall --save-dev`.
- **`lint-staged` brace syntax** — `*.{css}` single-value brace changed to
  `*.css`.

#### Infrastructure

- **MyScripts shared tooling** — Added `@commitlint/cli`,
  `@commitlint/config-conventional`, `@lhci/cli`, `lint-staged`, and
  `simple-git-hooks` to `MyScripts/package.json` devDependencies so all
  workspace projects share a single install of these tools.

---

## [7.6.0] - 2026-06-07

### Patch — Engineering quality sprint (20-task maintenance)

#### Fixed

- **TS strict-mode errors** — Two pre-existing errors now resolved with zero
  suppressions:
  - `src/core/i18n.ts` `getTextDirection()`: replaced `split("-")[0]`
    (unsafe under `noUncheckedIndexedAccess`) with array destructuring
    `const [primary = ""] = …`.
  - `src/core/storage-manager.ts` `createStorageManager()`: replaced direct
    `estimate` property spread (violates `exactOptionalPropertyTypes`) with
    conditional spread `...(estimate !== undefined && { estimate })`.
- **CI: duplicate `lighthouse:` job** — `ci.yml` contained two identical
  `lighthouse:` job blocks; the duplicate entry is removed.

#### Changed

- **`ARCHITECTURE.md`** updated to v7.5.0:
  - Version header updated (`v7.2.0 → v7.5.0`).
  - Added features: View Transitions (C5), drag-reorder watchlist (A11),
    C2 runtime palette persistence.
  - i18n row now references `messages.ts` `t()` helper.
  - Test count updated (`≥2260 → ≥2658 tests across ≥262 files`).
  - New **URL sharing flow** Mermaid sequence diagram (D5).
  - New **Routing & card registry** section with full route → card module
    table.
  - Storage model expanded from 3-tier to 4-tier (added L4 Service Worker
    Cache).
  - New **Performance budget** table (LCP / INP / CLS / bundle targets).
  - `docs/ARCHITECTURE.md` (stale v6.7.0) replaced with a redirect to root.
- **`README.md`**: fixed broken link (`docs/ARCHITECTURE.md` → root
  `ARCHITECTURE.md`), updated architecture block to reflect current
  directory structure, added `npm run dev:components` to scripts table.
- **`.github/dependabot.yml`**: added `docs-site/` npm ecosystem entry.
- **`.vscode/extensions.json`**: added `DavidAnson.vscode-markdownlint`
  recommendation.

---

## [7.5.0] - 2026-05-19

### Minor — i18n message catalogue, shared watchlist URLs, coverage push

#### Added

- **C1: i18n message catalogue with `t()` translation helper.** `src/core/messages.ts` —
  English (`en`) + Hebrew (`he`) catalogs covering ~80 keys across `nav.*`, `watchlist.*`,
  `consensus.*`, `alerts.*`, `settings.*`, `common.*`, `providerHealth.*`, `stream.*`
  namespaces. Variable substitution via `{varName}` syntax. Fallback chain: full locale →
  BCP47 primary tag → `en` → key itself. `registerCatalogue(locale, messages)` for runtime
  extension. 19 tests. (_commit `5c3462e`_)

- **D5: Shared watchlist deep-link URLs.** "Share" button added to the watchlist toolbar.
  Click generates a base64url-encoded `?s=…` deep-link URL and copies it to the clipboard.
  On startup, if the URL contains a watchlist param and the local list is empty, tickers are
  auto-imported with a toast confirmation. "Share watchlist URL" command added to the command
  palette. Builds on existing `src/core/share-state.ts` `encodeWatchlistUrl` /
  `decodeWatchlistUrl` API. (_commit `0c4549c`_)

#### Coverage Push

- **easing.ts** (76% → 100%): bisection fallback path via `cubicBezier(0,0,0,1)(0.0001)`
  where slopeX < 1e-6 triggers slope-break (`lo=mid` and `hi=mid` branches). +2 tests.
  (_commit `be3088a`_)

- **error-boundary.ts** (79% → 100%): `vi.spyOn(window, "addEventListener")` captures the
  `unhandledrejection` handler; tested with Error+stack and non-Error reason. +2 tests.
  (_commit `be3088a`_)

- **signals.ts** (82% → 96%): `batch()` return value + nested batch; `localStorageAdapter`
  with `vi.stubGlobal` — absent key, save/load, setItem/getItem throws; `persistedSignal`
  BroadcastChannel `onmessage` handler via object-property capture (no-this-alias safe).
  +7 tests. (_commit `be3088a`_)

- **sw-register.ts** (83% → 100%): `vi.stubGlobal("navigator", { userAgent:"test" })` to
  remove `serviceWorker` property so `"serviceWorker" in navigator` is `false`. +1 test.
  (_commit `d651d0a`_)

- **icu-formatter.ts** (84% → 97%): unmatched brace / malformed / unknown block types; plural
  "other" fallback; plural no-match; selectValue no-match; `Intl.PluralRules` fallback via
  `vi.stubGlobal("Intl", undefined)`; string-to-number conversion; `parseCases` no-brace.
  +11 tests. (_commit `d651d0a`_)

- **contrast.ts** (85% → 96%): `matchMedia` throws (try/catch path) and `matchMedia` returns
  `{ matches: true }`. +2 tests. (_commit `d651d0a`_)

- **provider-registry.ts** (59% → 100%): New `provider-registry-breaker.test.ts` uses the
  **real** `createProviderChain` (no mock) — exercises `createBreakerAwareProvider` internals:
  `recordSuccess`, `recordFailure`, breaker-aware `health()`, and "circuit breaker is open"
  throw after 3 failures. +5 tests. (_commit `15b08e5`_)

- **cards/settings.ts** (68% → 100%): Finnhub API key Save/Clear button handlers — calls
  `onFinnhubKeyChange(key)` on Save, skips on empty input, calls `onFinnhubKeyChange(null)`
  and resets state on Clear. +3 tests. (_commit `15b08e5`_)

- **alert-state-machine.ts** (76% → 97%): `consensusSell` alert fire, no-refire on
  consecutive SELL, and `consensus.direction === "NEUTRAL"` clearing `firedAlerts`. +3 tests.
  (_commit `15b08e5`_)

- **share-state.ts** (branch: 77% → 86%): `decodeShareState` returns null when object has
  `v` but no `s` field. +1 test. (_commit `0c4549c`_)

#### Tests

- Total: **2658** (+57 from v7.4.0 baseline of 2601)
- Test files: **262** (+3)

#### ROADMAP

- Marked C1 ✅ Done (v7.5.0)
- Marked D5 ✅ Done (v7.5.0)

---

## [7.4.0] - 2026-05-19

### Minor — Card activation tests (A8/A11-A14/B2-B6), coverage push, ROADMAP updates

#### Added

- **A8: Finnhub + circuit-breaker integration tests.** 11 new tests in `tests/unit/providers/breaker-provider-integration.test.ts` covering: circuit opens after failure threshold; rejected calls without hitting provider when open; health() reflects open circuit (available=false); resetOnSuccess; all three methods (getQuote/getHistory/search) protected; `configureFinnhub` adds Finnhub with closed breaker. Inline `wrapWithBreaker()` helper mirrors the registry's private `createBreakerAwareProvider`.

- **A11: Watchlist drag-reorder wiring.** `bindWatchlistReorder(tbody, onReorder)` added to `src/ui/watchlist.ts`. Wires HTML5 drag events to the `ui/reorder.ts` state machine; returns a cleanup function. 18 new tests covering sort-by-volume/change/consensus, vol-high/normal/low badge classes, 52W range edge cases (high≤low → "--"), drag-reorder DOM binding, and cleanup.

- **A12/A13: Heatmap + Screener card activation tests.** `tests/unit/cards/heatmap-card.test.ts` (7 tests): mounts, renders 11 sector tiles, shows Technology, fills container, has `.heatmap-grid`. `tests/unit/cards/screener-card.test.ts` (11 tests): mounts, preset buttons, empty state, ticker count, preset click marks active, switching removes active from previous, screener-data bridge set/clear.

- **A14/B5: Alerts card + Provider Health card tests.** `tests/unit/cards/alerts-card.test.ts` (9 tests): mount, empty state, renders stored alerts, update() re-renders, handle.update exists, pushAlert saves/prepends/caps-at-200/handles invalid JSON. `tests/unit/cards/provider-health-card.test.ts` (8 tests): mount, renders "yahoo", dispose function, dispose clears interval, auto-refreshes on 30s interval, checkHealthTransition called.

- **B2: Portfolio card activation tests.** 11 tests in `tests/unit/cards/portfolio-card.test.ts`: mounts without blank flash (DEMO_HOLDINGS rendered immediately), shows total value / unrealized P/L / sector allocation / positions table headers, badge-positive for profitable holdings, top-3 concentration metric, re-renders with custom IDB holdings after async load.

- **B3: Risk metrics card tests.** 10 tests in `tests/unit/cards/risk-card.test.ts`: Sortino Ratio, Max Drawdown, CAGR, Calmar Ratio all present; equity curve SVG rendered; 4 gauge bars (`risk-gauge-wrap`); demo note present; Sortino value > 0.

- **B4: Backtest UI card tests.** 10 tests in `tests/unit/cards/backtest-card.test.ts`: ticker input (default "AAPL"), fast MA input (default 10), slow MA input (default 30), Run button, `.backtest-controls`, `#backtest-result` container, `CardHandle` return, Run button triggers computation. Mocks `backtest-worker` and `data-service`.

- **B6: Consensus timeline card tests.** 9 tests in `tests/unit/cards/consensus-timeline-card.test.ts`: ticker select has all 5 demo tickers (AAPL/MSFT/NVDA/JPM/XOM), days select defaults to 60, single-view section populated, multi-view has 5 `.timeline-multi-item` elements, "All Demo Tickers" heading, changing ticker rerenders with different HTML, `.timeline-card-layout` class.

#### Coverage Push (Sprint 8)

- **notifications-extended** (+4 tests): `requestNotificationPermission()` without Notification API (line 46 branch), `showNotification()` with `icon`, `requireInteraction`, and `silent` options (lines 64, 66-68).

- **router-extended** (+7 tests): `initRouter()` called twice hits `if (initialized)` branch (lines 251-252); `?spa-redirect=` query param restores URL from 404 fallback (line 260); `data-param-*` extraction on anchor click; modifier-key clicks do not fire route-change handlers.

- **telemetry-extended** (+8 tests): analytics-active path (lines 141-190) — `createAnalyticsClient` called with correct endpoint/site, `observeWebVitals` wired, `destroy()` stops vitals observer, `handle.event` delegates; error-tracking-active path — `installErrorBoundary` called with custom handler (GlitchTip DSN), teardown called on destroy; both sinks active path. All sinks mocked (no network calls).

#### Documentation

- **ROADMAP.md**: Marked A8, A11, A12, A13, A14, B2, B3, B4, B5, B6 as ✅ Done (v7.4.0).

#### Tests

- Total: **2547** (+120 from v7.3.0 baseline of 2427)
- Test files: **259** (+12)

---

## [7.3.0] - 2026-05-19

### Minor — Sortable persistence, palette activation, component preview, a11y coverage, instrument filters, chart crosshair sync

#### Added

- **B14: Universal sortable column headers persistence.** `persistSort(tableKey, config)` and `loadSort(tableKey)` added to `ui/sortable.ts`. Sort state (column + direction) is stored under `"ct_sort_<tableKey>"` in `localStorage` with validation on load. Covers all data tables app-wide. 11 new unit tests.

- **B12: Instrument-type filter bar.** `renderChipBar(onChange?)` renders `All / Stocks / ETFs / Crypto` chip bar above the watchlist. `mountInstrumentFilterBar(onChange)` handles mount + auto-chip click based on persisted selection. DOM tests added: chip render, active-chip class toggling, chip-click updates filter + calls onChange, re-render after click, graceful skip when container missing, persisted filter loaded on mount. 9 new unit tests.

- **C2: Runtime palette activation.** `applyPalette(name, root?)` sets CSS custom properties (`--color-<kind>`) on the root element and sets `data-palette` attribute. `persistPalette(name)` / `loadPalette()` persist to `localStorage` under `"ct_palette"`. `activatePaletteFromStorage()` bootstraps palette from storage on startup. 12 new unit tests (20 total in palettes suite).

- **A19: Component preview page.** `dev/components.html` extended with two new sections:
  - **Color Palettes (C2):** palette-switcher buttons + live CSS swatch grid per palette.
  - **Registered Cards (A19):** iterates `listCards()` from the registry, dynamically mounts each `CardContext` in its own container, shows mounted / error badges.

- **B9: Chart crosshair sync** (`ui/chart-sync.ts`). `createChartSyncBus()` singleton EventEmitter keeps crosshairs aligned across multiple Lightweight Charts instances. `wireCrosshairSync(chartId, chart, series, bus?)` registers a chart to the bus and returns a cleanup function. Uses `isSyncing` flag to prevent echo loops. 9 unit tests across `createChartSyncBus` and `wireCrosshairSync`.

- **A10: Command palette keyboard shortcut.** `Ctrl+K` / `⌘K` bound in `main.ts` via `shortcuts.register()` to call `openPalette(paletteCommands)`.

#### Tests

- **clipboard**: +7 tests — `fallbackCopy` DOM textarea path (`execCommand` succeeds/returns false/throws), DOM fallback after `clipboard.writeText` rejects. Uses `Object.defineProperty` for `document.execCommand` (not natively defined in happy-dom). 10 tests total.

- **provider-registry**: +4 tests — `createBreakerAwareProvider` pass-through to underlying provider, circuit breaker initial state (0 failures / `"closed"`), health snapshot merges inner health with breaker state, `getChain` returns same instance on repeated calls. 11 tests total.

- **a11y**: +12 tests — `trapFocus` Tab-wraps-to-first (on last element), Shift+Tab-wraps-to-last (on first element), mid-element Tab passes through, empty container prevents default, non-Tab key ignored, cleanup removes listener. `prefersReducedMotion` stubs `matchMedia` for both `true`/`false`. 14 tests total (up from 2).

- **error-boundary**: +4 tests — error without stack (non-Error `event.error`), unhandled rejection with string reason (no stack), MAX_LOG=100 cap with oldest-entry eviction, no-handler `installErrorBoundary` still records. 10 tests total (up from 6).

- **data-service** (Sprint 1): 26 tests — `fetchTickerData`, `fetchAllTickers`, `setCorsProxy/getCorsProxy`, `parseInstrumentType` mapping (EQUITY→stock, ETF→etf, CRYPTOCURRENCY→crypto, unknown→other).

- **palette-overlay** (Sprint 2): 21 tests — `openPalette` singleton, keyboard nav (ArrowDown/Up/Enter/Escape), search filter, backdrop click.

**Total: 2427 tests across 247 files (up from 2328/245).**

#### Docs

- **ROADMAP.md:** Marked A10, A19, B9, B12, B13, B14, C2 as ✅ Done (v7.3.0).

---

## [7.2.0] - 2026-05-16

### Minor — Security headers, storage manager, URL state, cross-tab sync, schema-versioned export, onboarding

#### Added

- **A20: Cloudflare Worker security headers middleware** (`worker/security.ts`). `withSecurityHeaders()` wraps all Worker API responses with `Content-Security-Policy`, `Strict-Transport-Security` (HSTS; max-age=31536000; preload), `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Permissions-Policy`, `Cross-Origin-Opener-Policy`, `Cross-Origin-Resource-Policy`, and `Referrer-Policy`. 10 new unit tests.

- **A21: Storage pressure + LRU eviction** (`src/core/storage-manager.ts`). Polls `navigator.storage.estimate()` every 60 s; at ≥80% quota evicts 20 oldest `TieredCache` entries; at ≥95% evicts 50 entries and calls `navigator.storage.persist()`. Singleton `initStorageManager(cache)` API for `main.ts` integration. 9 new unit tests.

- **A22: ARCHITECTURE.md rewrite.** Updated to v7.2 reality: Worker layer, `storage-manager`, git hooks (`simple-git-hooks` + `lint-staged`), storage tiers table, expanded Security section with all response headers, new three-tier storage model table.

- **A18: Git hooks wired.** `simple-git-hooks` + `lint-staged` added; `pre-commit` runs ESLint + Prettier on staged TS/CSS/MD files; `commit-msg` runs `commitlint` for Conventional Commits enforcement.

- **B10: URL state activation** (`src/core/url-state.ts`). `readCurrentUrlState()`, `updateCurrentUrlState()`, `pushUrlState()`, `clearUrlState()`, `buildCurrentShareUrl()`, `onUrlStateChange()` — wires `share-state.ts` to `window.location` / `history` API for deep-linking and shareable URLs. 12 new unit tests.

- **B11: Cross-tab share sync** (`src/core/cross-tab-share.ts`). `createCrossTabShareSync()` wraps `broadcast-channel.ts` with `ShareState`-typed helpers (`broadcastShareState`, `onShareState`). No-echo (sender skips own messages). Graceful degradation when `BroadcastChannel` unavailable. 7 new unit tests.

- **C7: Schema-versioned export envelope.** `exportConfigJSON()` now emits `{ schemaVersion, version, exportedAt, checksum, config }`. `checksum` is a djb2 hex hash of the canonical `config` JSON for tamper/corruption detection. `importConfigJSON()` validates the checksum and rejects `schemaVersion > EXPORT_SCHEMA_VERSION` (future-format guard). Legacy exports without `schemaVersion` are accepted (backward compat). Exported `EXPORT_SCHEMA_VERSION` constant. 6 new unit tests.

- **C9: Onboarding tour hardening.** Added 3 additional test cases: Escape key dismissal, HTML escaping (XSS prevention via `innerHTML` entity check), and overlay-click dismissal. 3 new unit tests (16 total for tour).

#### Tests

- **backtest-worker-fallback**: 13 new tests — `runSmaCrossoverLocal()` pure sync fallback path, 0% → ~90% coverage.
- **uuid**: +7 tests for `uuidV4` and `nanoId` fallback paths (removes `randomUUID`/`getRandomValues` via `Object.defineProperty`).
- **og-image**: +8 tests — direction color mapping (SELL/STRONG_SELL=red, HOLD/NEUTRAL=amber, BUY=green, no badge when direction absent), `downloadSvg` DOM mock.
- **export-import**: +6 C7 schema/checksum tests (see above).
- **storage-manager**: 9 new tests.
- **url-state**: 12 new tests.
- **cross-tab-share**: 7 new tests.
- **worker security headers**: 10 new tests (44 total for worker suite).
- **onboarding-tour**: +3 tests (16 total).

**Total: 2328 tests across 245 files (up from 2254/241).**

---

## [7.1.0] - 2026-05-12

### Minor — Cloudflare Worker API, 13 indicator docs, user guides, RTL locale, coverage

#### Added

- **E2: Cloudflare Worker REST API** (`worker/`). Five endpoints: `GET /api/health`, `GET /api/chart`, `GET /api/search`, `POST /api/screener`, `GET /api/og/:symbol`. In-memory token-bucket rate limiting (60 req/min per IP). Mulberry32 PRNG for deterministic synthetic OHLCV. SVG social-preview `/api/og` endpoint. 34 new unit tests.

- **C4: 8 additional indicator MDX reference pages.** Added: ATR, VWAP, EMA/SMA, CCI, Williams %R, OBV, Aroon, Awesome Oscillator. Each page includes KaTeX formula, parameters table, interpretation table, TypeScript usage example, and related indicators. Brings total to 13 indicator docs.

- **User guide pages.** Three comprehensive MDX docs: Watchlist (add/remove/sort/filter/share), Charts (range selector, overlays, drawing tools, consensus badge), Portfolio (position entry, P&L, sector exposure, CSV import/export).

- **D7: RTL locale wiring.** `setLocale(locale)` persists to localStorage and updates `<html lang>` + `<html dir>`. `getTextDirection(locale)` returns `"rtl"` for Arabic, Hebrew, Farsi, Urdu, and 3 others. `initLocale()` bootstraps `<html>` on page load. `main.ts` now calls `initLocale()` before `initTheme()`.

#### Changed

- **i18n.ts `getLocale()`** now reads from localStorage before `navigator.language`, enabling persisted locale preferences across sessions.

#### Tests

- **web-vitals**: +17 tests covering LCP, CLS, FCP, TTFB, INP via mock `PerformanceObserver`; `hadRecentInput` filter; largest-wins dedup; `stop()` after connect; `safeObserve` throw path; beacon fallbacks.
- **telemetry**: +9 tests for `parseStackTrace`, `reportToGlitchTip` (sendBeacon/fetch/throw/sample-skip/invalid-DSN). Exported `_parseStackTraceForTests` and `_reportToGlitchTipForTests`.
- **analytics-client**: +5 tests for `defaultSend` transport (sendBeacon, fetch fallback, sendBeacon throws, no sendBeacon, no transport).
- **deep-clone**: +15 tests for fallback path covering all branches (primitive, object, array, Date, RegExp, Map, Set, circular refs). Exported `_fallbackCloneForTests`.
- **registry**: Mocked all 14 card modules (7 were missing). Added test for cache eviction on load failure (retry behaviour).
- **i18n**: +12 tests for `setLocale`, `persistLocale`, `getTextDirection`, `initLocale`.
- **domain/api-types**: 20 `expectTypeOf` type-level assertions on `DailyCandle`, `SignalDirection`, `MethodSignal`, `ConsensusResult`, and all 13 indicator function return types.

**Total: 2254 tests across 241 files (up from 2169/240).**

---

### Major — Full-stack hardening, real data, responsive cards, security

#### Added

- **A9: Valibot at all provider boundaries.** CoinGecko + Polygon providers now validate every API response with `safeParse()` schemas — no more `as` type casts.
- **D23: Supply-chain security workflow.** `npm audit signatures`, dependency-review-action, Socket.dev scanning on PRs + weekly cron.
- **Portfolio IDB persistence.** Holdings stored in IndexedDB via `portfolio-store.ts`; card loads user data with demo fallback.
- **Backtest real candle data.** Ticker input fetches real OHLCV history via `fetchTickerData`; synthetic fallback on failure.
- **C5: Container-query responsive cards.** `.card` gains `container-type: inline-size`; `@container` rules adapt portfolio columns, backtest controls, watchlist columns, and heatmap grid based on card width.
- **C7: Schema-versioned export checksum.** DJB2 integrity hash in `FullExportPayload`; validated on import; tamper detection.
- **Provider health degradation alerts.** State-machine monitors healthy→degraded→down transitions; fires toast + browser notification; auto-dismiss.
- **D1: WebAuthn foundation.** Client-side passkey registration + authentication; base64url utilities; platform authenticator detection; conditional mediation check.

#### Changed

- **ARCHITECTURE.md rewritten** for v7.0 — updated layered diagram, runtime sequence, features table, runtime deps, 7 CI workflows, security section.
- **Backtest card** now shows ticker input, real candle count indicator, and data source label.
- **Portfolio card** dynamically loads from IDB, showing user-specific note vs demo label.

#### Security

- Supply-chain audit on every push/PR touching `package-lock.json`.
- Export integrity: DJB2 checksum prevents silent data tampering on import.
- WebAuthn: passkey-ready architecture (server challenge integration pending).

---

## [6.5.0] - 2026-05-02

### Phase A — Activation (cards, security, performance)

- **A4: Remove state.ts.** Signals are now the sole state primitive; dead `createStore` code deleted.
- **A10: Command palette + keyboard shortcuts.** Ctrl+K opens fuzzy-search palette; `/` focuses search; `R` refreshes; `Shift+?` shows help.
- **A5: Wire backtest into Web Worker.** Chart card now runs backtest off main thread via `runBacktestAsync`.
- **A11: Watchlist column sorting.** Click any column header to sort ascending/descending with visual indicators.
- **A14: Alert card activation.** Alerts persist to localStorage (last 200), fires browser Notification on new alert.
- **A12: Heatmap card.** Sector heatmap treemap (11 sectors, color-coded by % change) with new `/heatmap` route.
- **A13: Screener card.** 6 preset filters (oversold, overbought, trend-following, volume breakout, etc.) with interactive results table.
- **A20: CSP meta tag.** Content-Security-Policy enforced via `<meta>` tag; `public/_headers` for Cloudflare Pages deployment (HSTS, COOP, CORP, X-Frame-Options).
- **A21: Storage pressure + LRU eviction.** TieredCache gains `evictOldest(n)` method; pressure monitor polls every 60s and evicts at 80% quota.

---

## [6.4.0] - 2026-05-01

### Deduplication & architecture enforcement

- **Architecture violation fixed.** `src/core/data-export.ts` was importing
  `AlertRecord` and `Holding` types from the `cards/` layer (higher-level).
  These types are now defined in `src/types/domain.ts` and re-exported from
  their original card modules for backward compatibility.
- **`formatVolume` deduplicated.** Local implementations in `chart.ts` and
  `watchlist.ts` replaced with `formatCompact` from `ui/number-format.ts`.
- **`prefersReducedMotion` deduplicated.** Removed duplicate in
  `ui/contrast.ts`; single source of truth is `ui/a11y.ts`.
- **`announce()` consolidated.** `ui/a11y.ts` now delegates to
  `ui/aria-live.ts` instead of maintaining a separate live-region
  implementation. Tests updated to match the canonical element IDs.
- **`formatPercent` kept local** in `performance-metrics.ts` (different
  semantics: always shows `+` sign for zero, whereas `number-format.ts`
  only signs strictly-positive values).

### Verified locally

- `tsc --noEmit` (main + SW): 0 errors.
- `npx eslint . --max-warnings 0`: 0 issues.
- `npx vitest run`: 215 test files, 1771 tests — all pass.
- `npx vite build`: 29.42 KB gzipped (85% under 200 KB budget).

---

## [6.3.0] - 2026-05-01

### Production-readiness: SW build, dead-code removal, structural cleanup

- **Service worker compiled.** `public/sw.ts` (raw TypeScript copied to
  `dist/` uncompiled) replaced by `src/sw.ts` built by Vite as a named
  `rollupOptions.input` entry → `dist/sw.js`. Floating promise
  `cache.put(…)` fixed (void-wrapped). Separate `tsconfig.sw.json` with
  `"lib": ["ES2022", "WebWorker"]` type-checks it without DOM conflicts.
- **Service worker wired up.** `registerServiceWorker` and
  `watchServiceWorkerUpdates` (previously exported but never called) are
  now invoked in `main.ts` after bootstrap; shows an "update available"
  toast 3 s before applying the new worker.
- **`UpdatableRegistration.update()` return type** corrected from
  `Promise<void>` to `Promise<ServiceWorkerRegistration | void>` to match
  the real `ServiceWorkerRegistration` DOM type.
- **SW scope/type** changed from `{ scope: "/" }` to
  `{ scope: "./", type: "module" }` to match the `base: "./"` Vite config
  (required for GitHub Pages sub-path hosting).
- **`apple-touch-icon` added** to `index.html` (was missing; surfaced by
  browser-compat linter).
- **`ARCHITECTURE.md` moved** from root to `docs/`; `README.md` link
  updated. Root now contains only standard project files.
- **`typescript.tsdk` fixed** in `.vscode/settings.json` — was pointing
  to `../node_modules` (parent `MyScripts/node_modules`); now
  `./node_modules` so VS Code always uses the repo-local TypeScript.
- **ESLint** updated to use `project: ["./tsconfig.json",
"./tsconfig.sw.json"]` so type-aware rules cover `src/sw.ts`.
- **`typecheck` and `build` scripts** extended to run both
  `tsc --noEmit` (main) and `tsc --project tsconfig.sw.json --noEmit`
  (service worker) in sequence.
- **Coverage exclusion** — `src/sw.ts` added to Vitest coverage `exclude`
  list alongside `src/main.ts`.
- **`MyScripts/package.json`** — added `zod ^4.4.1` to shared
  dependencies; aligned `vite` to `^8.0.10`.

### Verified locally

- `tsc --noEmit` (main): 0 errors.
- `tsc --project tsconfig.sw.json --noEmit`: 0 errors.
- `npm run lint`: 0 errors, 0 warnings.
- `npm run lint:css / lint:html / lint:md / format:check`: all clean.
- `npx vitest run`: 215 test files, 1772 tests — all pass.
- `npx vite build`: `dist/sw.js` (0.67 KB / 0.40 KB gz) generated;
  bundle check **PASS at 31.2 KB gzipped** (84 % under the 200 KB budget).

---

## [6.2.0] - 2026

### Sprint — self-contained repo + CI hardening

- **Self-contained repo.** All build/lint/test configs are now repo-local. Removed every
  `extends: "../tooling/..."` reference (TypeScript, Vite, Vitest, ESLint, Stylelint,
  markdownlint, Prettier). The repo no longer depends on the parent `MyScripts/tooling/`
  folder or the parent `node_modules/`.
- **`package-lock.json`.** Added `devDependencies` for every tool actually used
  (typescript, vite, vitest, @vitest/coverage-v8, eslint, @eslint/js, typescript-eslint,
  prettier, stylelint, stylelint-config-standard, htmlhint, markdownlint-cli2, happy-dom)
  and committed `package-lock.json` so `npm ci` works on a clean checkout. This unblocks
  GitHub Actions CI, which had been failing with
  _"Dependencies lock file is not found"_ on every run since v6.1.0-rc.1.
- **Scope lock — web only.** Deleted `worker/` (Cloudflare Workers BFF scaffolding that
  was never wired into the front-end). The repo now ships a single deployable: the Vite
  production build in `dist/`.
- **CI workflow** now drives every gate via `npm run ...` scripts (single source of
  truth) instead of duplicating CLI flags.
- **Release workflow** unchanged in behaviour but tightened: re-uses the same scripts
  and uploads `crosstide-vX.Y.Z.zip` plus a SHA-256 sidecar to the GitHub Release.
- **`vite.config.ts`** uses Vite 8's `oxc` minifier (matches what the repo actually
  has installed; the previous `esbuild` setting required an extra dependency).
- **README.md / ARCHITECTURE.md** rewritten to match reality:
  - Mermaid diagrams for layered architecture and runtime data flow.
  - Tech-stack versions corrected (TS 5.9, Vite 8, Vitest 4, ESLint 10).
  - Documented release artifacts and Pages deployment.

### Removed

- `worker/` (`worker/src/index.ts`, `routes/`, `middleware/`) — 5 files, ~7 KB.
- All references to `../tooling/*` from build/lint/test/format configs.

### Verified locally

- `npm ci` (clean install): 338 packages, 0 vulnerabilities.
- `npm run ci`: typecheck → lint (TS + CSS + HTML + MD + Prettier) → 1772 tests / 215
  files pass → vite build → bundle check **PASS at 21.2 KB gzipped** (89 % under the
  200 KB budget).

---

## [6.1.0] - 2026

### Added — Production-readiness pass

- **Strict TypeScript** — `exactOptionalPropertyTypes: true` enabled
  project-wide; refactored `error-boundary`, `notifications`, `sync-queue`,
  `polygon-provider`, `yahoo-provider` to construct optional fields
  conditionally.
- **Strict Markdown lint** — re-enabled `MD036/no-emphasis-as-heading`,
  `MD060/table-column-style`, `MD041/first-line-heading`; converted GitHub
  issue/PR templates to proper headings; tables auto-formatted via Prettier.
- **Strict Stylelint** — re-enabled
  `declaration-block-no-redundant-longhand-properties`.
- **Strict ESLint** — removed all `eslint-disable` directives from `src/`;
  refactored `idb.ts` callback return types, `worker-rpc.ts` `AnyFn` to
  `(...args: never[]) => unknown`, and `supertrend-calculator.ts` to drop
  dead `prevSuperTrend` assignment. `scripts/**` now linted (was ignored).
- **Bundle size script** — `check-bundle-size.mjs` now measures gzipped
  output (matching the 200 KB gzipped figure quoted in docs) instead of
  raw bytes.
- **`clean` script** — replaced inline `node -e "require(...)"` (broken in
  ESM packages) with proper `scripts/clean.mjs`.
- **`format` / `format:check`** — now scoped to source globs, excludes
  build artifacts and the archived roadmap; included in `lint:all` and CI.
- **Prettier** — moved `extends` (unsupported by Prettier) to inline
  options matching `tooling/prettier.base.json`; markdown is no longer
  ignored.

### Removed

- `vite-env.d.ts` moved from repo root to `src/vite-env.d.ts` (and
  removed from `tsconfig.json` `include`).
- Legacy `build/` directory (20 MB of leftover Flutter desktop EXE
  artifacts from a pre-web era of the project).
- All `eslint-disable` directives in `src/`.

### Verified

- `tsc --noEmit`: 0 errors with all strict flags on.
- `eslint . --max-warnings 0`: 0 issues.
- `stylelint`: 0 issues.
- `htmlhint`: 0 issues.
- `markdownlint-cli2`: 0 issues across 11 docs.
- `prettier --check`: clean across 254 source/doc files.
- `vitest run`: 215 files, **1772 tests** pass.
- `vite build`: 74.45 KB raw / 21.29 KB gzipped (89% under 200 KB budget).
- `check:bundle`: PASS at 20.6 KB gzipped.

---

## [6.1.0-rc.11] - 2026

### Added — Sprints 121–130 (more indicators + core/UI utilities)

- **Ultimate Oscillator** (`domain/ultimate-oscillator`) — Larry Williams'
  multi-period buying-pressure oscillator (0–100).
- **Klinger Volume Oscillator** (`domain/klinger-oscillator`) — fast/slow
  EMA difference of signed volume force; reuses a shared `VolumeCandle`
  type.
- **Choppiness Index** (`domain/choppiness-index`) — Dreiss's
  trending-vs-ranging gauge.
- **Ease of Movement** (`domain/ease-of-movement`) — Arms' price/volume
  EOM with SMA smoothing.
- **KAMA** (`domain/kama`) — Kaufman Adaptive Moving Average with
  configurable fast/slow constants and SMA seed.
- **UUID + nanoId** (`core/uuid`) — `uuidV4`, `isUuidV4`, and URL-safe
  `nanoId(size)` with `crypto.randomUUID` / `getRandomValues` /
  `Math.random` fallback chain.
- **URL-safe Base64** (`core/base64-url`) — RFC 4648 §5
  encode/decode for both strings (UTF-8) and `Uint8Array`, no padding.
- **Timezone helpers** (`core/timezone`) — `currentTimeZone`,
  `timeZoneOffsetMinutes`, `formatInTimeZone` using `Intl.DateTimeFormat`.
- **Clipboard wrapper** (`ui/clipboard`) — async `copyToClipboard` /
  `readClipboard` with hidden-textarea fallback for legacy contexts.
- **ARIA live announcer** (`ui/aria-live`) — `announceLive` (re-exported
  to avoid collision with existing `a11y.announce`) + auto-managed
  visually-hidden polite/assertive regions.

### Tests

- 1772 unit tests passing (+57 from rc.10).

---

## [6.1.0-rc.10] - 2026

### Added — Sprints 111–120 (more indicators + core/UI utilities)

- **Momentum** (`domain/momentum`) — classic price-difference oscillator.
- **Rate of Change** (`domain/roc`) — percentage variant of momentum,
  null on zero baseline.
- **Rolling Standard Deviation** (`domain/standard-deviation`) — windowed
  population (default) or sample stddev.
- **Moving Average Envelope** (`domain/envelope`) — SMA ± fixed percent
  bands.
- **Bill Williams Fractals** (`domain/fractals`) — 5-bar swing high/low
  pivot detector.
- **String hashes** (`core/hash-djb2`) — `djb2`, `djb2Hex`, `fnv1a32`
  non-cryptographic 32-bit hashes for cache keys.
- **Seeded PRNG** (`core/seedrandom`) — Mulberry32 generator with
  `randomInt`, `randomFloat`, and Fisher-Yates `shuffle` helpers.
- **Easing functions** (`core/easing`) — quad/cubic/in/out/inOut family
  plus a CSS-compatible `cubicBezier(p1x, p1y, p2x, p2y)` factory.
- **Date formatter** (`ui/date-format`) — DOM-free UTC token formatter
  (`YYYY-MM-DD HH:mm:ss.SSS`) and `isoDate`/`isoTime`/`isoDateTime`
  helpers.
- **Text highlighting** (`ui/text-highlight`) — `highlightSubstring` /
  `highlightWords` returning `{ text, match }` segments for safe
  rendering of search results.

### Tests

- 1715 unit tests passing (was 1648; +67 from Sprints 111–120).

---

## [6.1.0-rc.9] - 2026

### Added — Sprints 101–110 (more indicators + core/UI utilities)

- **Stochastic RSI** (`domain/stochastic-rsi`) — Chande & Kroll's
  stochastic applied to Wilder RSI, with %K and %D smoothing.
- **True Strength Index** (`domain/tsi`) — Blau's double-smoothed
  momentum oscillator with optional signal EMA.
- **Weighted Moving Average** (`domain/wma`) — linearly weighted MA
  with O(period) sliding sum.
- **Chaikin Oscillator** (`domain/chaikin-oscillator`) — MACD applied
  to the Accumulation/Distribution Line (default 3/10).
- **Elder Impulse System** (`domain/elder-impulse`) — discrete
  GREEN/RED/BLUE bar classification from EMA13 slope and MACD
  histogram slope.
- **deep-clone** (`core/deep-clone`) — `structuredClone` wrapper with
  a recursive fallback covering objects, arrays, `Date`, `RegExp`,
  `Map`, `Set` and cycles.
- **chunk + window + zip** (`core/chunk-array`) — array partitioning
  helpers with optional padding and configurable step.
- **pick + omit + pickBy** (`core/pick-omit`) — type-safe object
  subset utilities.
- **color-blend** (`ui/color-blend`) — hex parse/format, linear
  `blend`, plus `lighten` / `darken` shortcuts.
- **abort-helpers** (`ui/abort-helpers`) — `combineSignals`,
  `withTimeout`, `isAbortError` for cancellation plumbing.

### Tests

- 1648 unit tests (was 1573).

---

## [6.1.0-rc.8] - 2026

### Added — Sprints 91–100 (more indicators + core/UI utilities)

- **Know Sure Thing** (`domain/kst`) — Pring's smoothed weighted ROC
  composite with configurable signal SMA.
- **Detrended Price Oscillator** (`domain/dpo`) — trend-removed price
  oscillator using a displaced SMA.
- **Percentage Price Oscillator** (`domain/ppo`) — MACD expressed as a
  percentage of the slow EMA, with signal and histogram.
- **Accumulation/Distribution Line** (`domain/ad-line`) — Chaikin's
  cumulative money-flow line driven by close location within the bar.
- **Force Index** (`domain/force-index`) — Elder's price-change × volume
  with optional EMA smoothing.
- **Binary search helpers** (`core/binary-search`) — `lowerBound`,
  `upperBound`, `binarySearch` with optional comparator.
- **once / memoize** (`core/once-memoize`) — single-shot guard plus
  cache-by-key function memoization with `clear()` / `delete()`.
- **safe-json** (`core/safe-json`) — non-throwing `safeParse` returning
  a Result, and `safeStringify` that handles cycles, BigInt, functions
  and undefined.
- **text-truncate** (`ui/text-truncate`) — grapheme-aware
  `truncateEnd` and `truncateMiddle` with custom ellipsis.
- **focus-trap helpers** (`ui/focus-trap`) — DOM-free focusable-element
  discovery and ring navigation (`getFocusableElements`,
  `nextFocusable`).

### Tests

- 1573 unit tests (was 1504).

---

## [6.1.0-rc.7] - 2026

### Added — Sprints 81–90 (more indicators + core/UI utilities)

- **Chande Momentum Oscillator** (`domain/chande-momentum-oscillator`) —
  CMO in [-100, 100] using O(1) sliding-window updates.
- **Connors RSI** (`domain/connors-rsi`) — composite of Wilder RSI,
  streak RSI, and rolling ROC percent-rank.
- **Fisher Transform** (`domain/fisher-transform`) — Ehlers near-Gaussian
  oscillator with one-bar trigger.
- **Vortex Indicator** (`domain/vortex-indicator`) — VI+ / VI- trend
  rotation indicator (Botes & Siepman).
- **Mass Index** (`domain/mass-index`) — Dorsey's range-expansion
  reversal indicator (double-EMA ratio sum).
- **URL builder** (`core/url-builder`) — fluent immutable builder with
  typed query params, array values, and hash fragments.
- **deepEqual** (`core/deep-equal`) — structural equality covering Map,
  Set, Date, RegExp, NaN, and cyclic references.
- **Result<T, E>** (`core/result`) — discriminated-union helpers
  (`ok`/`err`/`map`/`mapErr`/`andThen`/`unwrap`/`tryCatch`/`tryCatchAsync`).
- **Sparkbar** (`ui/sparkbar`) — pure SVG mini bar chart string with
  zero-baseline support and HTML-attribute escaping.
- **Keymap formatter** (`ui/keymap-formatter`) — platform-aware
  accelerator labels (⌘K vs Ctrl+K) with HIG ordering on macOS.

### Tests

- 1504 total (+74).

---

## [6.1.0-rc.6] - 2026

### Added — Sprints 71–80 (more indicators, async + UI utilities)

- **TRIX** (`domain/trix`) — triple-smoothed EMA momentum with signal line.
- **Ulcer Index** (`domain/ulcer-index`) — drawdown depth/duration measure.
- **Coppock Curve** (`domain/coppock-curve`) — long-term momentum
  (WMA of summed ROCs).
- **DEMA / TEMA** (`domain/dema-tema`) — Mulloy lag-reduced moving averages.
- **Hull MA** (`domain/hull-ma`) — Alan Hull's smooth + responsive MA.
- **Percentile / percent-rank** (`domain/percentile-rank`) — `percentile`,
  `percentRank`, and `rollingPercentRank` helpers.
- **Promise pool** (`core/promise-pool`) — bounded-concurrency runner with
  ordered results and `runPromisePoolSettled` variant.
- **Event bus** (`core/event-bus`) — type-safe pub/sub with `once`,
  isolated handler errors, and listener counts.
- **SVG path builders** (`ui/svg-path`) — `buildLinePath`, `buildAreaPath`,
  Catmull-Rom `buildSmoothLinePath` with configurable precision.
- **Linear scale** (`ui/scale-linear`) — d3-style scale with `invert`,
  `clamp`, and `niceTicks`.

### Fixed

- `domain/trix`: cascaded EMAs now correctly skip leading nulls instead of
  treating them as zeros (only affected newly-added module).

### Tests

- 1430 total (+72).

---

## [6.1.0-rc.5] - 2026

### Added — Sprints 61–70 (more indicators, async utilities, UI helpers)

- **Aroon** (`domain/aroon`) — up/down/oscillator from N-period
  high/low recency.
- **Chaikin Money Flow** (`domain/chaikin-money-flow`) — volume-weighted
  buying/selling pressure in [-1, 1].
- **Awesome Oscillator** (`domain/awesome-oscillator`) — Bill Williams'
  SMA(5)−SMA(34) of median price with bar coloring.
- **Rolling stats** (`domain/rolling-stats`) — mean / sample std /
  min / max / z-score over a window.
- **Seasonality** (`domain/seasonality`) — return aggregation by month
  and day-of-week with mean and win rate.
- **Elder Ray** (`domain/elder-ray`) — bull/bear power vs EMA(close).
- **Retry + backoff** (`core/retry-backoff`) — exponential backoff with
  full/equal jitter and pluggable sleep.
- **Debounce / throttle** (`core/throttle-debounce`) — both with
  `cancel()` and `flush()`.
- **Color scale** (`ui/color-scale`) — linear interpolation between
  stops, divergent red→white→green palette helper.
- **Relative time** (`ui/relative-time`) — locale-aware "5m ago" /
  "yesterday" / `Mar 5` formatter via `Intl.RelativeTimeFormat`.

### Tests

- 1358 tests across 155 files (+73 new in this RC).

---

## [6.1.0-rc.4] - 2026

### Added — Sprints 51–60 (search, resilience, advanced indicators)

- **Fuzzy matcher** (`core/fuzzy-match`) — subsequence scoring with
  prefix / word-boundary / consecutive bonuses for command palette.
- **Circuit breaker** (`core/circuit-breaker`) — three-state
  (closed/open/half-open) provider isolation with configurable
  thresholds and rehydratable snapshot.
- **Token bucket** (`core/token-bucket`) — pure rate limiter with
  continuous refill and `waitMs` estimation.
- **Squarified treemap layout** (`ui/treemap-layout`) — Bruls/Huijing/
  van Wijk algorithm for sector heatmap.
- **Volume profile** (`domain/volume-profile`) — price-by-volume bins
  with POC and value-area boundaries.
- **Correlation matrix** (`domain/correlation-matrix`) — Pearson r
  across N aligned series.
- **Returns** (`domain/returns`) — simple / log / cumulative / rolling
  / total / annualized.
- **Anchored VWAP** (`domain/anchored-vwap`) — cumulative VWAP from
  any anchor with ±1σ / ±2σ bands.
- **MA crossover detector** (`domain/ma-crossover`) — golden/death
  cross events between any two MA series.
- **Linear regression** (`domain/linear-regression`) — OLS fit, r²,
  trend line and ±k σ regression channel.

### Tests

- 1285 tests across 145 files (+81 new in this RC).

---

## [6.1.0-rc.3] - 2026

### Added — Phase A indicators, portfolio analytics, formatters (Sprints 41–50)

- **Heikin-Ashi** (`domain/heikin-ashi`) — smoothed candle transform.
- **Donchian channels** (`domain/donchian`) — N-bar high/low channel.
- **Keltner channels** (`domain/keltner`) — EMA midline ± multiplier × ATR.
- **Ichimoku Kinko Hyo** (`domain/ichimoku`) — Tenkan/Kijun/Senkou A/B/Chikou
  with displacement.
- **Pivot points** (`domain/pivots`) — classic, Fibonacci, Camarilla,
  Woodie variants.
- **ZigZag** (`domain/zigzag`) — pivot detector with configurable
  reversal threshold.
- **Candle resampler** (`domain/resample`) — bucket OHLCV to coarser
  timeframes (m1/m5/h1/d1/w1).
- **Equity curve** (`domain/equity-curve`) — build curve and stats from
  closed trades (PnL / win rate / profit factor / avg win/loss).
- **Portfolio analytics** (`domain/portfolio-analytics`) — sector
  allocation, position weights, top-N concentration.
- **Number formatters** (`ui/number-format`) — locale-aware price,
  compact (K/M/B), percent, signed change.

### Tests

- 1204 tests across 135 files (+84 new in this RC).

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
