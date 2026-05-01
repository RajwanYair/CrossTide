# Changelog

All notable changes to CrossTide are documented in this file.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
Versioning follows [Semantic Versioning](https://semver.org/).

---

## [7.0.0] - 2026-05-01

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
