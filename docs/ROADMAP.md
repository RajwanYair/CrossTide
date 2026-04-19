# CrossTide Web — Strategic Roadmap

> **Roadmap refresh date:** April 19, 2026
> **Goal:** Build CrossTide as a best-in-class **HTML/Web stock dashboard** — a standalone web application delivering SMA crossover detection, 12-method consensus signals, and interactive charting. Informed by proven patterns from the existing Flutter app and five shipped web projects in the MyScripts monorepo.

---

## 1. Product Vision

CrossTide Web is a **browser-based stock monitoring dashboard** that provides:

- Real-time watchlist with live consensus BUY/SELL/NEUTRAL status per ticker
- Interactive candlestick + indicator charts with BUY/SELL signal overlays
- 12-method Consensus Engine (Micho, RSI, MACD, Bollinger, Stochastic, OBV, ADX, CCI, SAR, Williams %R, MFI, SuperTrend)
- Sector heatmap, screener, alert history, and portfolio tracking views
- Offline-first PWA with Service Worker caching
- Zero runtime framework dependencies — vanilla TypeScript, no React/Vue/Angular

### Why Not Flutter Web?

The existing Flutter app (Android + Windows) is mature. Flutter Web was considered but rejected:

| Concern | Flutter Web | Vanilla TS + Vite |
|---------|-------------|-------------------|
| Bundle size | 2–5 MB (CanvasKit/Skia WASM) | <200 KB (no framework) |
| SEO / link sharing | Opaque canvas, no DOM content | Real HTML + SSR-ready |
| Performance | Canvas redraw = GPU cost | DOM + CSS = browser-optimized |
| Developer ecosystem | Flutter-only tooling | Standard web tooling (DevTools, Lighthouse) |
| Proven pattern | None in our projects | FamilyDashBoard (2853 tests), Wedding (v8), BudgetManager |

**Decision:** Build a standalone TypeScript web app following the proven FamilyDashBoard/Wedding/BudgetManager architecture. Share **domain logic** by porting core calculators to TypeScript (not reusing Dart code at runtime).

### Success Criteria

| Metric | Target |
|--------|--------|
| First meaningful paint | <1.5 s on 4G |
| JS bundle (gzipped) | <180 KB |
| Lighthouse Performance | ≥90 |
| Lighthouse Accessibility | ≥95 |
| Offline capability | Full watchlist + cached charts |
| Unit test count | ≥500 (Vitest) |
| Test coverage | ≥90% statements, ≥80% branches |
| ESLint + TypeScript | 0 errors, 0 warnings |

---

## 2. Architecture

### 2.1 Stack Decision Matrix

Decisions informed by what works across five shipped MyScripts web projects:

| Area | Decision | Rationale | Precedent |
|------|----------|-----------|-----------|
| **Language** | TypeScript 5.9+ strict | Type safety, monorepo standard | All 3 web projects |
| **Build** | Vite 8 | Fast HMR, tree-shaking, proven | FDB, Wedding, Budget |
| **Test** | Vitest 4 + happy-dom | Vite-native, fast, 2853+ tests proven | FDB |
| **E2E** | Playwright | Cross-browser, Network interception | Wedding |
| **Lint** | ESLint 10 flat config + typescript-eslint | 0-warning policy, type-aware | All projects |
| **CSS** | Vanilla CSS with `@layer`, design tokens, container queries | No preprocessor, cascade-aware | FDB |
| **CSS Lint** | Stylelint 17 | Standard config, 0-warning | Wedding, FDB |
| **HTML Lint** | HTMLHint | DOM contract enforcement | Wedding, FDB |
| **Markdown** | markdownlint-cli2 | Doc quality gate | All projects |
| **State** | EventTarget pub/sub reactive store | Proven at scale in FDB (2853 tests) | FDB `state.ts` |
| **Charting** | Lightweight Charts (TradingView OSS) | OHLC/candlestick native, 40 KB | — (new) |
| **API proxy** | Cloudflare Workers | CORS elimination, 100K req/day free, edge-deployed | FDB |
| **Deployment** | GitHub Pages (static) + Cloudflare Workers (API) | Free tier, proven pipeline | FDB |
| **npm model** | Shared `MyScripts/node_modules` workspace | Single `npm install` for all projects | All projects |
| **CI** | GitHub Actions | Lint + test + build + deploy | All projects |
| **Package manager** | npm (workspace) | Consistent with monorepo | All projects |

### 2.2 Project Structure

```text
CrossTideWeb/                         # New folder under MyScripts/
├── index.html                        # App shell — single HTML entry
├── package.json                      # Project metadata, scripts
├── tsconfig.json                     # TypeScript strict config
├── vite.config.ts                    # Vite 8 build config
├── vitest.config.ts                  # Vitest 4 test config
├── eslint.config.mjs                # ESLint 10 flat config
├── playwright.config.mjs            # E2E test config
├── .stylelintrc.json
├── .htmlhintrc
├── .editorconfig
├── sw.js                             # Service Worker (precache + stale-while-revalidate)
├── public/
│   ├── favicon.svg
│   ├── manifest.json                 # PWA manifest
│   └── icons/                        # PWA icons (192, 512)
├── src/
│   ├── main.ts                       # Bootstrap: safeLoad cards, intervals, SW register
│   ├── types/
│   │   ├── api.ts                    # Yahoo/TwelveData/Polygon response shapes
│   │   ├── domain.ts                 # DailyCandle, MethodSignal, ConsensusResult, AlertType
│   │   ├── config.ts                 # User config schema + defaults
│   │   └── card.ts                   # CardDefinition, CardRuntime interface
│   ├── core/
│   │   ├── constants.ts              # URLs, symbols, intervals, thresholds (TechnicalDefaults)
│   │   ├── cache.ts                  # L1 in-memory Map + L2 localStorage + L3 IndexedDB (LRU)
│   │   ├── idb-cache.ts             # IndexedDB async tier (≤50 MB LRU cap)
│   │   ├── fetch.ts                  # fetchWithTimeout, fetchViaWorker, retryWithBackoff, proxy chain
│   │   ├── state.ts                  # EventTarget reactive store (get/set/on/off/snapshot)
│   │   ├── config.ts                # Settings load/save/export/import + migration
│   │   ├── sw-register.ts           # Service Worker lifecycle (registration, SKIP_WAITING)
│   │   ├── error-reporter.ts        # Debounced error batching → Worker POST /api/errors
│   │   ├── provider-health.ts       # Per-provider success/failure tracking
│   │   └── idle.ts                   # requestIdleCallback wrapper, page visibility
│   ├── domain/
│   │   ├── candle.ts                 # DailyCandle type + utility fns
│   │   ├── sma-calculator.ts         # SMA computation (port from Dart)
│   │   ├── ema-calculator.ts         # EMA computation
│   │   ├── rsi-calculator.ts         # RSI computation
│   │   ├── macd-calculator.ts        # MACD/Signal computation
│   │   ├── bollinger-calculator.ts   # Bollinger Bands computation
│   │   ├── atr-calculator.ts         # ATR computation
│   │   ├── stochastic-calculator.ts  # Stochastic %K/%D
│   │   ├── obv-calculator.ts         # On-Balance Volume
│   │   ├── adx-calculator.ts         # ADX + DI± computation
│   │   ├── cci-calculator.ts         # CCI computation
│   │   ├── mfi-calculator.ts         # Money Flow Index
│   │   ├── supertrend-calculator.ts  # SuperTrend computation
│   │   ├── williams-r-calculator.ts  # Williams %R
│   │   ├── parabolic-sar-calculator.ts
│   │   ├── vwap-calculator.ts        # VWAP
│   │   ├── micho-method.ts           # Micho Method BUY/SELL detector
│   │   ├── rsi-method.ts             # RSI exit-oversold/overbought detector
│   │   ├── macd-method.ts            # MACD/Signal crossover
│   │   ├── bollinger-method.ts       # Bollinger band breakout
│   │   ├── stochastic-method.ts      # Stochastic %K/%D crossover
│   │   ├── obv-method.ts             # OBV divergence
│   │   ├── adx-method.ts             # ADX trend + DI crossover
│   │   ├── cci-method.ts             # CCI exit signals
│   │   ├── sar-method.ts             # Parabolic SAR flip
│   │   ├── williams-r-method.ts      # Williams %R exit signals
│   │   ├── mfi-method.ts             # MFI exit signals
│   │   ├── supertrend-method.ts      # SuperTrend direction flip
│   │   ├── consensus-engine.ts       # Micho + ≥1 other = GREEN/RED
│   │   ├── alert-state-machine.ts    # Idempotent candle-date dedup
│   │   ├── signal-aggregator.ts      # Buy/sell/neutral tallying
│   │   ├── cross-up-detector.ts      # SMA cross-up/cross-down detection
│   │   ├── technical-defaults.ts     # Shared indicator constants (port from Dart)
│   │   └── backtest-engine.ts        # Walk-forward backtesting
│   ├── providers/
│   │   ├── yahoo-provider.ts         # Yahoo Finance v8 chart API
│   │   ├── twelve-data-provider.ts   # Twelve Data (800 req/day free)
│   │   ├── polygon-provider.ts       # Polygon.io (paid tier)
│   │   ├── coingecko-provider.ts     # CoinGecko (crypto)
│   │   ├── provider-chain.ts         # Fallback provider orchestrator
│   │   └── types.ts                  # MarketDataProvider interface
│   ├── cards/
│   │   ├── base-card.ts              # createCardLoader + scheduleCard lifecycle
│   │   ├── watchlist/
│   │   │   ├── watchlist.ts          # Main watchlist table — prices, consensus, sparklines
│   │   │   └── watchlist.css
│   │   ├── chart/
│   │   │   ├── chart.ts             # TradingView Lightweight Charts — candlestick + indicators
│   │   │   └── chart.css
│   │   ├── consensus/
│   │   │   ├── consensus.ts          # 12-method consensus dashboard per ticker
│   │   │   └── consensus.css
│   │   ├── heatmap/
│   │   │   ├── heatmap.ts           # Sector/industry heatmap (canvas or SVG)
│   │   │   └── heatmap.css
│   │   ├── screener/
│   │   │   ├── screener.ts          # Filter tickers by technical criteria
│   │   │   └── screener.css
│   │   ├── alerts/
│   │   │   ├── alerts.ts            # Alert history timeline
│   │   │   └── alerts.css
│   │   ├── portfolio/
│   │   │   ├── portfolio.ts         # Holdings, allocation, P&L
│   │   │   └── portfolio.css
│   │   ├── backtest/
│   │   │   ├── backtest.ts          # Strategy config → equity curve
│   │   │   └── backtest.css
│   │   └── settings/
│   │       ├── settings.ts          # Config panel (providers, alerts, theme, export/import)
│   │       └── settings.css
│   ├── ui/
│   │   ├── theme.ts                  # Dark/light + accent color themes
│   │   ├── keyboard.ts              # Global keyboard shortcuts
│   │   ├── header.ts                # Clock, market status badge, search bar
│   │   ├── nav.ts                    # Hash router + sidebar navigation
│   │   ├── toast.ts                  # Toast notification system
│   │   ├── modal.ts                  # Modal dialog system
│   │   └── status-bar.ts            # Version, sync dots, provider health
│   └── styles/
│       ├── tokens.css                # @layer tokens: CSS custom properties (colors, spacing, type)
│       ├── themes.css                # Dark (default), light, high-contrast theme overrides
│       ├── base.css                  # Reset, typography, body, scrollbar
│       ├── layout.css                # Responsive grid, sidebar, @container queries
│       ├── components.css            # Shared card chrome, badges, buttons, inputs
│       ├── animations.css            # Keyframes, transitions, entrance effects
│       └── a11y.css                  # prefers-reduced-motion, prefers-contrast
├── worker/
│   ├── src/
│   │   ├── index.ts                  # Worker entry + router
│   │   ├── routes/
│   │   │   ├── stocks.ts            # Yahoo Finance / Twelve Data proxy
│   │   │   ├── crypto.ts            # CoinGecko proxy
│   │   │   └── errors.ts            # Client error ingestion
│   │   └── middleware/
│   │       ├── cors.ts               # CORS headers
│   │       ├── rate-limit.ts         # Per-IP rate limiting
│   │       └── cache-control.ts      # TTL headers by route
│   ├── wrangler.toml
│   └── package.json
├── tests/
│   ├── unit/
│   │   ├── domain/                   # All calculator + detector tests
│   │   ├── core/                     # Cache, fetch, state, config tests
│   │   ├── providers/                # Provider chain, mock responses
│   │   ├── cards/                    # Card module unit tests
│   │   ├── ui/                       # Theme, nav, keyboard tests
│   │   └── worker/                   # Worker route + middleware tests
│   └── e2e/
│       ├── watchlist.spec.ts         # Full watchlist flow
│       ├── chart.spec.ts             # Chart interaction
│       └── offline.spec.ts           # Offline/SW caching
├── docs/
│   ├── ARCHITECTURE.md               # Visual layer diagram + dependency rules
│   ├── TRADING_METHODS.md            # Deep dive on 12 methods + consensus
│   └── DATA_PROVIDERS.md            # Provider comparison, rate limits
├── CHANGELOG.md
├── CONTRIBUTING.md
├── LICENSE
├── README.md
└── SECURITY.md
```

### 2.3 Layer Dependency Rules

```text
types/           ← Pure type definitions, no runtime code
domain/          ← Pure TypeScript functions, no DOM, no fetch, no side effects
core/            ← State, cache, fetch, config — no UI
providers/       ← Data fetching — depends on core/ and types/
cards/           ← Feature modules — depends on everything above
ui/              ← Shared UI chrome — depends on core/
styles/          ← Pure CSS — no TypeScript imports
worker/          ← Cloudflare Worker — independent deployable
```

Domain logic (calculators, detectors, consensus engine) is **pure functional TypeScript** — no DOM, no fetch, no side effects. This mirrors the Dart domain layer's purity principle. Domain functions receive `DailyCandle[]` arrays and return computed results.

### 2.4 Runtime Architecture

```text
Browser
 ├─ main.ts ─── safeLoad(each card) ──▶ Promise.allSettled
 │               └── setInterval per card (TTL-based refresh)
 ├─ sw.js ────── APP_SHELL precache ──▶ offline HTML fallback
 │               └── API cache (stale-while-revalidate)
 └─ card-registry ── dynamic import() per card ──▶ lazy load + init

Data fetch chain (per request):
  cGet(key, TTL) → hit: return cached
                 → miss: fetchViaWorker(Cloudflare)  ← Worker-first
                       → fallback: fetchWithRetry(direct URL)
                           → exponential backoff (3 retries)
                           → proxy chain (allorigins → codetabs → corsproxy)
                 → cSet(key, data, ttl)
                 → recordSuccess / recordFailure (provider health)

Cache tiers:
  L1: in-memory Map ─── process lifetime (instant)
  L2: localStorage ──── 7-day eviction (sync, <5 MB)
  L3: IndexedDB ─────── 50 MB LRU cap (async, large datasets)
  L4: Service Worker ─── stale-while-revalidate (offline resilience)
```

### 2.5 Reactive State Model

Adopted from FamilyDashBoard's proven `state.ts` pattern:

```typescript
// EventTarget-based reactive store
const state = createStore({
  watchlist: [] as WatchlistEntry[],
  activeSymbol: null as string | null,
  consensus: {} as Record<string, ConsensusResult>,
  config: loadConfig(),
  providerHealth: {} as Record<string, ProviderHealth>,
});

// Subscribe to changes
state.on('watchlist', (entries) => renderWatchlist(entries));
state.on('consensus', (data) => renderConsensus(data));
state.on('config', (cfg) => applyTheme(cfg.theme));
```

### 2.6 CSS Architecture

Adopted from FamilyDashBoard's `@layer` system:

```css
/* tokens.css — declares layer order + design tokens */
@layer tokens, themes, base, layout, components, animations;

@layer tokens {
  :root {
    /* Colors — semantic, not literal */
    --bg-app: #0d1117;
    --bg-card: #161b22;
    --bg-card-hover: #1c2128;
    --text-primary: #e6edf3;
    --text-secondary: #8b949e;
    --accent: #58a6ff;
    --signal-buy: #3fb950;
    --signal-sell: #f85149;
    --signal-neutral: #8b949e;

    /* Spacing scale */
    --sp-xs: 4px;
    --sp-sm: 8px;
    --sp-md: 16px;
    --sp-lg: 24px;
    --sp-xl: 32px;

    /* Typography */
    --font-mono: 'JetBrains Mono', 'Fira Code', monospace;
    --font-sans: 'Inter', system-ui, sans-serif;
    --font-size-sm: 0.8125rem;
    --font-size-base: 0.875rem;
    --font-size-lg: 1rem;
    --font-size-xl: 1.25rem;

    /* Chart-specific */
    --chart-grid: #21262d;
    --chart-crosshair: #484f58;
    --candle-up: #3fb950;
    --candle-down: #f85149;
  }
}
```

Card CSS is co-located (each card owns its `.css` file next to its `.ts` file). Global styles stay in `src/styles/`.

---

## 3. Domain Logic — TypeScript Port Strategy

### 3.1 What Gets Ported

The CrossTide Flutter app has **~90 core domain files** (calculators, detectors, consensus engine). These are pure Dart functions with no Flutter dependencies — ideal candidates for 1:1 TypeScript translation.

| Category | Files | Priority |
|----------|-------|----------|
| **Technical calculators** (15) | SMA, EMA, RSI, MACD, Bollinger, ATR, Stochastic, OBV, ADX, CCI, MFI, SuperTrend, Williams %R, SAR, VWAP | P0 |
| **Method detectors** (12) | Micho, RSI, MACD, Bollinger, Stochastic, OBV, ADX, CCI, SAR, Williams %R, MFI, SuperTrend | P0 |
| **Consensus engine** | `consensus-engine.ts` — Micho + ≥1 other = GREEN/RED | P0 |
| **Alert state machine** | `alert-state-machine.ts` — idempotent candle-date dedup | P0 |
| **Signal aggregator** | Buy/sell/neutral tallying + strength score | P1 |
| **Cross-up detector** | SMA cross-up/cross-down detection | P1 |
| **Shared constants** | `technical-defaults.ts` — RSI 30/70, MFI 20/80, etc. | P0 |
| **Backtest engine** | Walk-forward validation | P2 |
| **Analytics** (~20) | Fibonacci, Volume Profile, Sharpe/Sortino, Drawdown, Correlation, etc. | P3 |

### 3.2 Port Conventions

- Every Dart calculator maps 1:1 to a TypeScript module
- Same function signatures: `computeSeries(candles: DailyCandle[], period?: number): Result[]`
- Same test cases: port Dart test → Vitest test (same inputs, same expected outputs)
- Pure functions only — no class instances needed (unlike Dart's `const Calculator()` pattern)
- Domain modules export only functions and types — no side effects

### 3.3 Shared Constants (Ported from `TechnicalDefaults`)

```typescript
// src/domain/technical-defaults.ts
export const DEFAULTS = {
  period: 14,
  rsiOversold: 30,
  rsiOverbought: 70,
  mfiOversold: 20,
  mfiOverbought: 80,
  williamsROversold: -80,
  williamsROverbought: -20,
  cciOversold: -100,
  cciOverbought: 100,
  smaPeriods: [50, 150, 200],
  macdFast: 12,
  macdSlow: 26,
  macdSignal: 9,
  bollingerPeriod: 20,
  bollingerMultiplier: 2.0,
} as const;
```

---

## 4. Data Provider Strategy

### 4.1 Provider Chain

```text
Primary:   Yahoo Finance v8 chart API (via Cloudflare Worker proxy)
Fallback1: Twelve Data REST API (800 req/day free tier)
Fallback2: Stooq CSV (historical, no real-time)
Crypto:    CoinGecko (CORS-enabled, no proxy needed)
```

### 4.2 Worker Proxy Architecture

The Cloudflare Worker eliminates CORS issues and provides:

- Request signing / cookie rotation for Yahoo Finance
- Response caching (KV or Cache API) — 5-min TTL for quotes, 24-hr for historical
- Rate limiting per client IP
- Error aggregation endpoint (`POST /api/errors`)
- Health endpoint (`GET /api/health`)

```text
Browser ──fetch──▶ Cloudflare Worker ──fetch──▶ Yahoo Finance v8
                   ├── Cache API (edge)
                   ├── Rate limiter
                   └── Error logger
```

### 4.3 Data Refresh Strategy

| Data type | TTL | Refresh trigger |
|-----------|-----|-----------------|
| Intraday quote (market open) | 60 s | Auto-interval |
| Intraday quote (market closed) | 5 min | Auto-interval |
| Daily OHLC history | 24 hr | Manual or on card mount |
| Consensus result | Computed client-side on each quote refresh | — |
| Provider health | Per-fetch | Success/failure callback |

### 4.4 Offline Strategy

- Service Worker caches the app shell (HTML, CSS, JS, icons)
- L2/L3 cache stores last-known watchlist data and historical candles
- Offline banner displayed when navigator.onLine === false
- Consensus is recomputed from cached candles — works fully offline
- Alert history is stored in IndexedDB — fully available offline

---

## 5. Feature Cards — Detailed Design

### 5.1 Watchlist Card (P0 — Core)

The primary view. Displays all tracked tickers in a sortable, filterable table.

| Column | Content |
|--------|---------|
| Symbol | Ticker + emoji sector badge |
| Price | Last close, formatted with locale |
| Change | $ change + % change, colored green/red |
| Consensus | GREEN/RED/NEUTRAL badge with method count |
| Sparkline | 30-day inline SVG mini-chart |
| Volume | Relative volume vs 20-day average |
| 52W Range | Progress bar showing price position |
| Actions | Detail → chart, Edit, Remove |

- Click row → navigates to chart card with ticker pre-selected
- Supports inline add (type symbol → Enter → adds to list)
- Drag-to-reorder (persisted to localStorage)
- Bulk import from S&P 500 presets or CSV
- Export watchlist as JSON/CSV

### 5.2 Chart Card (P0 — Core)

Interactive candlestick chart using [TradingView Lightweight Charts](https://github.com/nicehash/lightweight-charts) (open-source, 40 KB).

- OHLC candlestick with volume sub-chart
- Overlay toggles: SMA50, SMA150, SMA200, Bollinger Bands, SAR dots
- Sub-indicator panels: RSI, MACD histogram, Stochastic %K/%D, ADX
- BUY/SELL signal markers from consensus engine overlaid on price chart
- Time range selector: 1M, 3M, 6M, 1Y, 5Y, ALL
- Crosshair with OHLCV tooltip
- Responsive: scales from phone to 4K

### 5.3 Consensus Dashboard Card (P0 — Core)

Per-ticker view showing all 12 methods:

```text
┌─────────────────────────────────────────┐
│  AAPL — Consensus: BUY (8/12)           │
│                                         │
│  Micho Method    ● BUY  (MA150 cross)   │
│  RSI             ● BUY  (RSI=28→32)     │
│  MACD            ● BUY  (MACD>Signal)   │
│  Bollinger       ○ NEUTRAL              │
│  Stochastic      ● BUY  (%K>%D)         │
│  OBV             ● BUY  (+divergence)   │
│  ADX             ● BUY  (+DI>−DI)       │
│  CCI             ○ NEUTRAL              │
│  SAR             ● BUY  (flip up)       │
│  Williams %R     ● BUY  (exit oversold) │
│  MFI             ○ NEUTRAL              │
│  SuperTrend      ● BUY  (flip up)       │
│                                         │
│  Strength: 67% │ Confidence: HIGH       │
└─────────────────────────────────────────┘
```

- Clicking any method shows its detailed explanation and chart sub-panel
- Historical consensus timeline (GREEN/RED bar chart over time)

### 5.4 Sector Heatmap Card (P1)

Canvas-rendered treemap showing sector performance:

- Color-coded by daily/weekly % change (green → red gradient)
- Tile size by market cap weight
- Click tile → jumps to ticker chart
- Sector data sourced from `sp500_tickers.json` and `sector_map.json` (already in Flutter app)

### 5.5 Screener Card (P1)

Filter tickers by technical criteria:

- RSI < 30 (oversold) / RSI > 70 (overbought)
- Price above/below SMA200
- Consensus = BUY/SELL
- Volume > 2× average
- ADX > 25 (strong trend)
- Custom filter builder (composable rules)
- Results: filtered watchlist table with matching tickers

### 5.6 Alert History Card (P1)

Timeline of fired alerts:

- Chronological list with date, ticker, alert type, method
- Filter by ticker, alert type, date range
- Export as CSV/JSON
- Stored in IndexedDB (persistent, offline-available)

### 5.7 Portfolio Card (P2)

Holdings tracker:

- Add positions: symbol, shares, avg cost
- Real-time P&L (unrealized)
- Allocation pie chart (by sector, by position)
- Risk metrics: beta, Sharpe ratio, max drawdown
- Dividend income projection
- Stored in IndexedDB + exportable

### 5.8 Backtest Card (P2)

Strategy backtester:

- Select method(s) and ticker(s)
- Date range picker
- Run button → equity curve chart
- Performance table: total return, max drawdown, Sharpe, win rate
- Side-by-side comparison of strategies

### 5.9 Settings Card (P0)

- **Data providers**: select primary (Yahoo/Twelve Data/Polygon) + API key entry
- **Theme**: dark (default), light, high-contrast
- **Alert config**: consensus threshold, cooldown period
- **Watchlist**: import/export JSON, S&P 500 preset
- **Cache**: clear cache, view storage usage
- **About**: version, changelog, GitHub link

---

## 6. Cloudflare Worker — API Surface

```text
GET  /api/health                    → { status, uptime, providers }
GET  /api/stocks/quote/:symbol      → Yahoo v8 chart proxy (1d, 5d, 3mo, 1y ranges)
GET  /api/stocks/history/:symbol    → Yahoo v8 historical OHLCV (up to 5y)
GET  /api/stocks/search?q=         → Yahoo v8 search autocomplete proxy
GET  /api/crypto/:id                → CoinGecko market data proxy
GET  /api/twelve/:symbol            → Twelve Data time series proxy
POST /api/errors                    → Client error ingestion (best-effort telemetry)
```

All responses include `Cache-Control` headers. Worker caches at edge for configured TTLs.

---

## 7. Testing Strategy

### 7.1 Test Layers

| Layer | Tool | Target |
|-------|------|--------|
| Domain logic | Vitest | 100% coverage — pure functions, deterministic |
| Core (cache, fetch, state) | Vitest + happy-dom | 90%+ coverage |
| Providers | Vitest + MSW (Mock Service Worker) | Response parsing, error handling, fallback chain |
| Cards | Vitest + happy-dom | DOM contract, render output |
| Worker | Vitest + miniflare | Route handling, caching, rate limiting |
| DOM contracts | Vitest | `getElementById` existence assertions (à la FDB) |
| E2E | Playwright | Critical user flows: add ticker → see consensus → view chart |

### 7.2 Quality Gates (CI)

```yaml
# Every PR must pass:
- tsc --noEmit                           # 0 type errors
- eslint . --max-warnings 0              # 0 lint issues
- stylelint "src/**/*.css" --max-warnings 0
- htmlhint index.html
- markdownlint-cli2 "*.md" ".github/**/*.md"
- vitest run --coverage                  # ≥90% statements
- vite build                             # <180 KB gzipped JS
- playwright test                        # E2E smoke
```

### 7.3 Port Verification

Every domain calculator ported from Dart must include:

1. A Vitest file with the **exact same test cases** as the Flutter test
2. A reference comment linking to the Dart source file
3. Boundary/edge-case tests for floating-point precision (IEEE 754 awareness)

---

## 8. PWA & Offline Strategy

### 8.1 Service Worker

```text
sw.js
 ├── precache: index.html, CSS, JS bundles, icons, manifest
 ├── runtime cache:
 │    ├── /api/stocks/*  → stale-while-revalidate (5 min)
 │    ├── /api/crypto/*  → stale-while-revalidate (5 min)
 │    └── fonts/*        → cache-first (30 day)
 └── offline fallback: serve cached app shell
```

### 8.2 Installable

- `manifest.json` with `display: standalone`, theme color, icons
- Install prompt on supported browsers
- Works as desktop PWA on Chrome OS, Windows, macOS

### 8.3 Offline Behavior

| Feature | Offline Behavior |
|---------|------------------|
| Watchlist | Shows last-cached prices (stale chip indicator) |
| Chart | Loads from IndexedDB historical cache |
| Consensus | Recomputed from cached candles |
| Alerts | Fully available from IndexedDB |
| Settings | Fully available from localStorage |
| Screener | Works against cached data |

---

## 9. Performance Budget

| Asset | Budget | Enforcement |
|-------|--------|-------------|
| HTML | <10 KB | Lighthouse CI |
| CSS (all layers) | <30 KB | Vite bundle report |
| JS (initial) | <150 KB gzipped | `check:bundle` script |
| JS (lazy cards) | <50 KB each | Per-card budget |
| Fonts | <100 KB (woff2) | Self-hosted subset |
| Lightweight Charts lib | ~40 KB | Conditional import (chart card only) |
| **Total initial load** | **<200 KB gzipped** | CI gate |

Enforcement via bundle-size check script (adopted from FamilyDashBoard's `check-bundle-size.mjs`).

---

## 10. Deployment Pipeline

```text
developer push → GitHub Actions CI
  ├── lint (ESLint + Stylelint + HTMLHint + markdownlint)
  ├── typecheck (tsc --noEmit)
  ├── test (vitest run --coverage)
  ├── build (vite build)
  ├── bundle size check
  ├── Lighthouse CI (performance ≥90, a11y ≥95)
  └── deploy
       ├── GitHub Pages (static site: dist/)
       └── Cloudflare Workers (wrangler deploy)
```

### 10.1 Environments

| Environment | URL | Trigger |
|-------------|-----|---------|
| Development | `localhost:5173` | `npm run dev` |
| Preview | PR deploy preview | PR open |
| Production | `rajwanyair.github.io/CrossTideWeb/` | Merge to main |
| Worker | `crosstide.rajwanyair.workers.dev` | Merge to main |

---

## 11. Implementation Phases

### Phase 1 — Core Dashboard (v1.0)

> Goal: Functional watchlist + chart + consensus — the MVP.

| # | Task | Priority | Effort |
|---|------|----------|--------|
| 1.1 | Project scaffold (Vite, TS, ESLint, Vitest, CI) | P0 | 1 day |
| 1.2 | CSS design system (tokens, themes, layout) | P0 | 2 days |
| 1.3 | Core infra (cache, fetch, state, config, SW register) | P0 | 3 days |
| 1.4 | Port technical calculators (15) to TypeScript | P0 | 3 days |
| 1.5 | Port method detectors (12) to TypeScript | P0 | 2 days |
| 1.6 | Port consensus engine + alert state machine | P0 | 1 day |
| 1.7 | Port `technical-defaults.ts` shared constants | P0 | 1 hr |
| 1.8 | Cloudflare Worker scaffold + Yahoo proxy route | P0 | 2 days |
| 1.9 | Yahoo Finance provider (browser-side) | P0 | 2 days |
| 1.10 | Watchlist card (table, sparklines, consensus badges) | P0 | 3 days |
| 1.11 | Chart card (Lightweight Charts, OHLC, SMA overlays) | P0 | 3 days |
| 1.12 | Consensus dashboard card | P0 | 2 days |
| 1.13 | Settings card (provider, theme, watchlist import/export) | P0 | 2 days |
| 1.14 | Navigation (hash router, sidebar, keyboard shortcuts) | P0 | 1 day |
| 1.15 | Service Worker + PWA manifest | P0 | 1 day |
| 1.16 | Domain test suite (port from Flutter tests) | P0 | 3 days |
| 1.17 | Card + core test suite | P0 | 2 days |
| 1.18 | GitHub Actions CI pipeline | P0 | 1 day |
| 1.19 | GitHub Pages deployment | P0 | 1 day |

### Phase 2 — Feature Cards (v1.1–v1.3)

| # | Task | Priority | Effort |
|---|------|----------|--------|
| 2.1 | Sector heatmap card | P1 | 3 days |
| 2.2 | Screener card (filter builder) | P1 | 3 days |
| 2.3 | Alert history card (IndexedDB persistence) | P1 | 2 days |
| 2.4 | Twelve Data provider + Worker route | P1 | 2 days |
| 2.5 | CoinGecko crypto provider | P1 | 1 day |
| 2.6 | Chart indicator sub-panels (RSI, MACD, Stochastic, ADX) | P1 | 3 days |
| 2.7 | Chart BUY/SELL signal markers on price overlay | P1 | 2 days |
| 2.8 | Responsive mobile layout | P1 | 2 days |
| 2.9 | Offline banner + stale-data indicators | P1 | 1 day |
| 2.10 | Playwright E2E tests | P1 | 2 days |

### Phase 3 — Analytics & Portfolio (v2.0)

| # | Task | Priority | Effort |
|---|------|----------|--------|
| 3.1 | Portfolio card (holdings, P&L, allocation chart) | P2 | 3 days |
| 3.2 | Backtest card (strategy config, equity curve) | P2 | 5 days |
| 3.3 | Port analytics calculators (Sharpe, Sortino, Drawdown, etc.) | P2 | 3 days |
| 3.4 | Consensus history timeline chart | P2 | 2 days |
| 3.5 | Provider health dashboard | P2 | 1 day |
| 3.6 | Dark/light/high-contrast theme polish | P2 | 2 days |
| 3.7 | Polygon.io provider (paid tier) | P2 | 2 days |

### Phase 4 — Advanced (v3.0+)

| # | Task | Priority | Effort |
|---|------|----------|--------|
| 4.1 | Real-time WebSocket streaming (Polygon/Twelve Data) | P3 | 5 days |
| 4.2 | Alert engine with browser notifications | P3 | 3 days |
| 4.3 | Shared watchlist URLs (encode/decode in URL) | P3 | 2 days |
| 4.4 | i18n (English + Hebrew) | P3 | 3 days |
| 4.5 | Optional Supabase backend (sync, auth, push) | P3 | 2 weeks |
| 4.6 | Chart drawing tools (trendlines, Fibonacci) | P3 | 1 week |
| 4.7 | Natural language search ("tech stocks RSI < 30") | P4 | 1 week |

---

## 12. Migration Path — Flutter App ↔ Web

The Flutter app and Web app are **independent codebases** that share **domain logic by convention** (same algorithms, same test cases, different languages). They are NOT coupled at runtime.

| Concern | Flutter App | Web App |
|---------|-------------|---------|
| Platform | Android, Windows | Browser (any) |
| Language | Dart | TypeScript |
| State | Riverpod | EventTarget store |
| Database | Drift (SQLite) | IndexedDB + localStorage |
| Charts | fl_chart | Lightweight Charts |
| Notifications | flutter_local_notifications | Browser Notification API |
| Background | WorkManager / Timer | Service Worker |
| Deployment | APK / MSIX | GitHub Pages |

### Shared Assets

These files from the Flutter project are used by both:

- `assets/sp500_tickers.json` — S&P 500 ticker list with sectors
- `assets/sector_map.json` — GICS sector/industry hierarchy
- Domain test vectors — same inputs/outputs validate both implementations

### Future Convergence (Optional, Phase 4+)

If demand justifies, a shared backend (Supabase or Dart Frog) could synchronize watchlists and alert state between the Flutter app and Web app — but this is not a prerequisite. Both apps work fully standalone.

---

## 13. Lessons Learned — Patterns Borrowed from MyScripts Projects

| Pattern | Source Project | Application in CrossTide Web |
|---------|---------------|------------------------------|
| Proxy-based reactive store | FamilyDashBoard, BudgetManager | `state.ts` — watchlist, consensus, config reactivity |
| `@layer`-ordered CSS tokens | FamilyDashBoard | `tokens.css` — no specificity wars, clean theming |
| Cloudflare Worker API proxy | FamilyDashBoard | CORS elimination for Yahoo Finance, caching at edge |
| 3-tier cache (memory + LS + IDB) | FamilyDashBoard | Critical for offline stock data and fast re-renders |
| Card-based section architecture | FamilyDashBoard, Wedding | Each feature is a lazy-loaded card module |
| `safeLoad()` + `Promise.allSettled` | FamilyDashBoard | Graceful degradation — one failing card doesn't crash the app |
| Section mount/unmount lifecycle | BudgetManager, Wedding | Cards initialize on navigate, clean up on leave |
| `data-action` event delegation | Wedding | Centralized click handling, no per-element listeners |
| Provider health tracking | FamilyDashBoard | Per-provider success/failure counts in diagnostic overlay |
| Zero runtime dependencies | FamilyDashBoard, BudgetManager | No React/Vue/Angular — vanilla TS + Vite |
| Bundle size budget + CI gate | FamilyDashBoard | `check-bundle-size.mjs` enforced on every PR |
| DOM contract tests | FamilyDashBoard | Element ID existence assertions prevent silent breakage |
| `__APP_VERSION__` injection | FamilyDashBoard | Version from `package.json` injected at build time |
| Shared `MyScripts/node_modules` | All web projects | Single `npm install`, consistent tooling |
| `fetchViaWorker` → proxy fallback | FamilyDashBoard | Worker-first, graceful degradation to CORS proxies |
| Config migration + validation | FamilyDashBoard | Schema versioning prevents corrupt localStorage |

---

## 14. What We Are NOT Building (Web)

These scope boundaries prevent the web version from repeating the Flutter app's entity explosion:

- **Not a brokerage**: no order execution, no broker API, no real money
- **Not a mobile-first app**: the Flutter app covers mobile — Web is desktop-first
- **Not a social platform**: no user accounts in v1 (optional Supabase in Phase 4)
- **Not a news aggregator**: link out to external sources, don't build a feed
- **Not a real-time trading terminal**: daily/intraday data, not tick-by-tick HFT
- **Not a copy of the Flutter app**: Web has its own UX, optimized for browser interaction

Every feature must justify itself with: (1) a data source, (2) a UI card, (3) a test suite. No speculative domain models.

---

## 15. Technology Decisions Matrix (Complete)

| Area | Decision | Alternative Considered | Why This Choice |
|------|----------|----------------------|-----------------|
| **Language** | TypeScript 5.9 strict | Dart (Flutter Web) | 10× smaller bundles, standard web tooling, proven in 3 projects |
| **Build** | Vite 8 | Webpack, Rollup, esbuild | HMR speed, tree-shaking, monorepo proven |
| **UI framework** | None (vanilla TS) | React, Vue, Svelte, Lit | Zero overhead, full DOM control, proven at FDB scale (2853 tests) |
| **Charts** | Lightweight Charts (TradingView OSS) | Chart.js, D3, Highcharts | OHLC native, 40 KB, MIT license, financial-grade |
| **State** | EventTarget pub/sub | Redux, MobX, Zustand | No dependencies, proven pattern, <200 LOC |
| **CSS** | Vanilla + `@layer` + custom properties | Tailwind, CSS Modules, Sass | No build step, cascade control, proven in FDB |
| **Test** | Vitest 4 + happy-dom | Jest, Mocha | Vite-native, fast, TypeScript out-of-box |
| **E2E** | Playwright | Cypress, Puppeteer | Cross-browser, network mocking, proven in Wedding |
| **API proxy** | Cloudflare Workers | Vercel Edge, Netlify Functions | 100K req/day free, KV storage, proven in FDB |
| **Deployment** | GitHub Pages + CF Workers | Vercel, Netlify, Firebase Hosting | Free, no vendor lock-in, proven pipeline |
| **Lint** | ESLint 10 flat config | Biome | Type-aware rules, ecosystem support |
| **CSS lint** | Stylelint 17 | — | Standard, 0-warning policy |
| **Offline** | Service Worker + IndexedDB | — | PWA standard, no library needed |
| **npm** | Shared workspace (MyScripts/) | pnpm, yarn | Consistent with existing monorepo |

---

## 16. Flutter App — Test Suite Consolidation (HIGH PRIORITY)

> **Problem:** The Flutter test suite has grown to **412 test files / 3348+ tests** with significant structural debt. Test execution time scales poorly, shared helpers are underused, and boilerplate dominates the largest files. Domain tests account for 92% of the surface (379 of 412 files).

### 16.1 Current State — By the Numbers

| Metric | Value |
|--------|-------|
| Total test files | 412 |
| Domain test files | 379 (92%) |
| Application test files | 21 |
| Data test files | 12 |
| Batch test files (`*_batch_test.dart`) | 16 files, **10,283 lines** |
| Files with direct `DailyCandle(` constructor | 61 (only 22 use `candle_factory`) |
| Files importing `signal_factory.dart` | 3 of 412 |
| Files with equality/hashCode boilerplate | 138+ |
| Shared test helpers | 2 (`candle_factory.dart`, `signal_factory.dart`) |

### 16.2 Root Causes

1. **Batch test bloat.** The 16 `s*_domain_batch_test.dart` files (covering S231–S600 entities) are the largest files in the suite. Each packs 15–21 groups that repeat the same constructor/property/equality/copyWith/toString patterns per entity. These 16 files alone consume **10,283 lines** — more than some entire projects.

2. **Equality boilerplate everywhere.** 138+ domain test files contain hand-written equality/hashCode test groups. Every entity gets ~8–12 lines of `expect(a == b, isTrue)` / `expect(a == c, isFalse)` / `expect(a.hashCode == b.hashCode, isTrue)`. This is the single most repeated pattern in the suite.

3. **Shared helpers are underused.** `candle_factory.dart` is imported by only 22 of the 61 files that create `DailyCandle` instances. `signal_factory.dart` is imported by only 3 files. The remaining files duplicate local factory functions or inline constructors.

4. **No shared test matchers or verification utilities.** There are only 2 files in `test/helpers/`. Missing entirely: a reusable equality verifier, mock provider factories, common Drift test setup, or parameterized test runners.

5. **Sequential test patterns.** Cases that differ only by input and expected output are written as individual `test()` calls instead of table-driven loops, multiplying both line count and isolated test overhead.

### 16.3 Consolidation Plan

#### Phase A — Shared Test Infrastructure (P0, do first)

| # | Task | Impact | Effort |
|---|------|--------|--------|
| A.1 | Create `test/helpers/equatable_helpers.dart` — a generic `expectEquatable<T>()` that takes an instance, an equal copy, and a list of not-equal variants, then asserts `==`, `hashCode`, and `!=` in one call. | Eliminates ~8–12 lines per entity across **138+ files**. | 2 hr |
| A.2 | Create `test/helpers/copyWith_helpers.dart` — a `verifyCopyWith<T>()` that takes a base instance and a map of field mutators, asserts each produces a new non-equal instance with the expected field changed. | Eliminates repetitive copyWith groups in batch files and `entities_test.dart`. | 2 hr |
| A.3 | Create `test/helpers/toString_helpers.dart` — a simple `expectToStringContains<T>(instance, requiredSubstrings)` for toString verification. | Removes per-entity toString boilerplate. | 1 hr |
| A.4 | Expand `candle_factory.dart` — add preset builders: `makeOhlcvSeries(length, {trend, volatility})`, `makeFlatSeries(length, price)`, `makeCrossUpSeries(smaPeriod)` for common indicator test scenarios. | Reduces 39 files of inline candle construction to factory calls. | 3 hr |
| A.5 | Expand `signal_factory.dart` — add `makeBuySignal(method)`, `makeSellSignal(method)`, `makeNeutralSignal(method)` and `makeConsensusScenario(buyMethods, sellMethods)` for consensus test setup. | Currently only 3 files use it — target is every consensus/method test. | 2 hr |
| A.6 | Create `test/helpers/drift_helpers.dart` — reusable in-memory DB factory and common seed data for data-layer tests. | Eliminates repeated `AppDatabase.forTesting(NativeDatabase.memory())` setup in 12 data test files. | 1 hr |

#### Phase B — Batch Test Refactor (P0, highest line-count impact)

| # | Task | Impact | Effort |
|---|------|--------|--------|
| B.1 | Refactor all 16 `*_batch_test.dart` files to use `expectEquatable()`, `verifyCopyWith()`, and `expectToStringContains()` from Phase A helpers. | Estimated **40–60% line reduction** across 10,283 lines → ~4,000–6,000 lines eliminated. | 1 day |
| B.2 | Convert repeated per-entity groups to table-driven tests: define a list of `({T instance, T equal, List<T> notEqual})` records and loop. | Turns 15–21 copy-paste groups per file into a single parameterized loop. | 1 day |
| B.3 | Evaluate merging batch files by logical domain area instead of story-number ranges: group by entity category (e.g., `signal_entities_test.dart`, `portfolio_entities_test.dart`, `alert_entities_test.dart`). | Better discoverability, fewer files, easier maintenance. | 4 hr |

#### Phase C — Domain Test Deduplication (P1)

| # | Task | Impact | Effort |
|---|------|--------|--------|
| C.1 | Migrate the 39 files that use raw `DailyCandle()` to use `candle_factory.dart` helpers. | Centralizes fixture creation; changing DailyCandle fields in the future requires updating one file instead of 39. | 4 hr |
| C.2 | Migrate consensus and method tests to use `signal_factory.dart` helpers. | Standardizes test setup for all 12 detector tests and consensus engine tests. | 3 hr |
| C.3 | Convert `entities_test.dart` (843 lines, 97 tests) to table-driven structure using Phase A helpers. | Estimated 50% reduction (~420 lines). | 3 hr |
| C.4 | Audit all method detector tests (`*_method_detector_test.dart`) for shared BUY/SELL/no-trigger/insufficient-data structure; extract a `verifyDetectorContract()` helper that runs the standard detector test matrix. | Standardizes the 12 detector test files. | 4 hr |

#### Phase D — Performance Optimization (P1)

| # | Task | Impact | Effort |
|---|------|--------|--------|
| D.1 | Profile test execution: run `flutter test --reporter expanded 2>&1` and parse per-file timing. Identify files that take >2 s. | Data-driven optimization — focus effort where it matters. | 1 hr |
| D.2 | Move expensive shared setup (large candle arrays, DB instances) to `setUpAll` instead of `setUp` where the test body does not mutate the fixture. | Reduces per-test overhead for data-heavy domain tests. | 2 hr |
| D.3 | Audit for unnecessary `async` in pure-computation domain tests. Remove `async`/`await` from tests that are entirely synchronous. | Eliminates microtask scheduling overhead in ~200+ synchronous domain tests. | 2 hr |
| D.4 | Investigate `--concurrency` flag: run `flutter test --concurrency=<cores>` and measure wall-clock time vs default. Document the optimal concurrency for CI and local dev. | Could cut wall-clock time by 2–4× on multi-core CI runners. | 1 hr |
| D.5 | Evaluate splitting the test run into domain-only and integration-only CI jobs. Domain tests are pure Dart and could run on `dart test` without the Flutter test harness overhead. | Pure-Dart domain tests skip Flutter engine initialization per isolate. | 2 hr |

#### Phase E — Structural Hygiene (P2)

| # | Task | Impact | Effort |
|---|------|--------|--------|
| E.1 | Rename batch files from story-number ranges to semantic names (`signal_entities_batch_test.dart`, `portfolio_entities_batch_test.dart`, etc.) once Phase B refactoring is complete. | Better discoverability and IDE navigation. | 1 hr |
| E.2 | Add a `test/helpers/README.md` documenting all shared helpers, when to use each one, and import paths. | Prevents future contributors from reinventing local factories. | 1 hr |
| E.3 | Add a CI lint step that warns when a new test file uses `DailyCandle(` directly instead of `candle_factory.dart`. | Prevents regression of the shared-helper adoption achieved in Phase C. | 2 hr |
| E.4 | Audit for dead test code: test files that test classes no longer exported from `domain.dart` barrel. | Reduces false coverage and maintenance burden. | 2 hr |

### 16.4 Expected Outcomes

| Metric | Before | After (estimated) |
|--------|--------|-------------------|
| Total test lines (batch files) | 10,283 | ~4,500 (−56%) |
| Equality boilerplate instances | 138+ files × ~10 lines | 138+ files × ~1 line (helper call) |
| Shared helper files | 2 | 7+ |
| Shared helper adoption rate | 36% (candles), <1% (signals) | >90% |
| Avg batch file size | 643 lines | ~280 lines |
| `entities_test.dart` | 843 lines | ~420 lines |
| Test wall-clock time (CI) | baseline | −30–50% (concurrency + async cleanup + setUpAll) |

### 16.5 Execution Order

```text
Phase A (shared infra)     ──▶  Phase B (batch refactor)  ──▶  Phase C (dedup)
                                                                     │
Phase D (performance) ─── can run in parallel with B/C ──────────────┘
                                                                     │
Phase E (hygiene) ──── after B+C stabilize ──────────────────────────┘
```

Phases A and B are the highest-leverage work. Phase A unblocks everything else. Phase D is independent and can be started at any time.

### 16.6 Constraints

- Domain coverage must remain **100%** throughout all refactoring — no test removal without replacement.
- Overall coverage target remains **≥ 90%**.
- No `// ignore:` pragmas introduced during refactoring.
- All refactored tests must pass `flutter analyze --fatal-infos` and `dart format --set-exit-if-changed lib test`.
- Batch file merges should be done incrementally (one batch file per PR) to keep diffs reviewable.

---

## 17. GitHub Copilot & CI/CD Enhancement (HIGH PRIORITY)

> **Problem:** The `.github` guidance layer (29 files, ~1,667 lines) was written incrementally as features shipped. It is structurally sound but has gaps: only 1 skill exists, 4 of 6 prompts lack the `tools` field, no prompt uses the `mode` frontmatter, the `presentation.instructions.md` is the thinnest instruction file, `pages.yml` violates the repo's own CI rules, hooks live in a non-standard location, MCP config has an orphaned input, and several high-value agents/prompts/skills are missing entirely.

### 17.1 Current State — By the Numbers

| Category | Files | Lines | Health |
|----------|:-----:|:-----:|--------|
| Agents | 3 | ~156 | Excellent — all frontmatter fields present |
| Instructions | 6 | ~378 | Good — `presentation` thin, `application` missing newer services |
| Prompts | 6 | ~181 | Good — 4 of 6 missing `tools`, none use `mode` |
| Skills | 1 | ~120 | Excellent content — but only one skill exists |
| Workflows | 5 | ~561 | Good — `pages.yml` has 3 violations |
| Issue/PR templates | 3 | ~75 | Good |
| Hooks | 2 | ~30 | Location concern (`.github/hooks/` vs `.vscode/`) |
| MCP config | 1 | ~14 | Orphaned `alpha_vantage_api_key` input |

### 17.2 Root Causes

1. **Skills gap.** Only `add-trading-method` has a skill. Provider integration, entity creation, and test consolidation are equally complex repeatable workflows with no skill guidance.

2. **Prompt frontmatter incomplete.** Only 2 of 6 prompts declare `tools`. None use the newer `mode` field (`agent`/`ask`/`edit`). The `health-check` prompt sets `agent: "agent"` which is not a defined agent name.

3. **Missing agents for common work.** No agent covers presentation/widget work, test refactoring, or CI/CD troubleshooting — despite these being frequent tasks.

4. **Missing prompts for routine tasks.** No prompts exist for fixing analyze errors, PR review, test refactoring, barrel updates, or entity scaffolding.

5. **Instruction drift.** `application.instructions.md` does not mention 5 application services that have test files. `presentation.instructions.md` is the thinnest instruction file (~29 lines) with no screen, theming, accessibility, or widget testing guidance. `data.instructions.md` refers to "Stooq-adjacent integrations" vaguely.

6. **Workflow violations.** `pages.yml` is missing `timeout-minutes`, has no `paths-ignore`, and deploys the entire repo root as the Pages artifact. `release.yml` header comment omits MSIX despite the workflow building it.

7. **Hook location.** `.github/hooks/` is not the standard VS Code Copilot hook location. These may not be loaded at runtime.

8. **MCP config debt.** `.vscode/mcp.json` defines `alpha_vantage_api_key` as an input but no configured server references it.

### 17.3 Enhancement Plan

#### Phase A — Prompt & Agent Frontmatter Modernization (P0, quick wins)

| # | Task | Impact | Effort |
|---|------|--------|--------|
| A.1 | Add `tools` field to the 4 prompts missing it: `add-data-provider`, `add-domain-feature`, `add-trading-method`, `consensus-check`. Use `[read, search, edit, execute]` for creation prompts and `[read, search]` for audit prompts. | Prompts correctly declare their tool surface, improving agent behavior. | 30 min |
| A.2 | Add `mode` field to all 6 prompts. Use `mode: "agent"` for prompts that create/modify code, `mode: "agent"` for audits. | Adopts latest Copilot prompt frontmatter capability. | 15 min |
| A.3 | Fix `health-check.prompt.md`: change `agent: "agent"` to remove the agent field entirely (health check should run in the default agent context, not a nonexistent "agent" agent). | Removes stale reference. | 5 min |
| A.4 | Verify all agent `.md` files have current frontmatter: `description`, `tools`, `model`. Add any missing fields. | Ensures agents are discoverable and properly configured. | 15 min |

#### Phase B — New Agents (P0, high-value additions)

| # | Task | Rationale | Effort |
|---|------|-----------|--------|
| B.1 | Create `presentation-feature.agent.md` — covers UI/widget work, GoRouter routing, Riverpod provider patterns, theming, accessibility, widget testing. Tools: `[read, search, edit, execute]`. | No agent covers the presentation layer. This is the only architecture layer without an agent. | 1 hr |
| B.2 | Create `test-consolidation.agent.md` — specializes in test refactoring, deduplication, batch test optimization, shared helper creation, table-driven conversion. Tools: `[read, search, edit, execute]`. | Directly supports the Section 16 test consolidation effort. | 1 hr |
| B.3 | Create `ci-ops.agent.md` — CI/CD troubleshooting, workflow debugging, build failure triage, GitHub Actions authoring. Tools: `[read, search, edit, execute]`. | Common tasks with no dedicated agent. Workflow files are complex enough to need specialized guidance. | 1 hr |

#### Phase C — New Prompts (P0–P1)

| # | Task | Priority | Effort |
|---|------|----------|--------|
| C.1 | Create `/fix-analyze-errors.prompt.md` — takes analyze output, routes to the appropriate layer agent, fixes each issue. `tools: [read, search, edit, execute]`, `mode: "agent"`. | P0 | 30 min |
| C.2 | Create `/review-pr.prompt.md` — invokes the `reviewer` agent on the current PR changes. `agent: "reviewer"`, `tools: [read, search]`, `mode: "agent"`. | P0 | 30 min |
| C.3 | Create `/refactor-tests.prompt.md` — invokes `test-consolidation` agent for test deduplication, batch refactoring, or helper extraction. `argument-hint: "Target file or pattern"`. | P1 | 30 min |
| C.4 | Create `/update-barrel.prompt.md` — guides barrel re-ordering in `domain.dart`. `agent: "domain-feature"`, `tools: [read, search, edit]`. | P1 | 30 min |
| C.5 | Create `/add-entity.prompt.md` — scaffolds a new domain entity with Equatable, barrel entry, and test file. `agent: "domain-feature"`, `argument-hint: "Entity name and fields"`. | P1 | 30 min |

#### Phase D — New Skills (P1, complex repeatable workflows)

| # | Task | Rationale | Effort |
|---|------|-----------|--------|
| D.1 | Create `.github/skills/add-data-provider/SKILL.md` — step-by-step provider integration workflow: interface implementation, Dio setup, response mapping, factory wiring, fallback chain entry, rate-limit documentation, test matrix (parsing, errors, cache, throttling), settings UI (if user-selectable), validation checklist. | The `add-data-provider` prompt exists but has no detailed skill backing it. Provider integration is complex enough (6+ existing providers, fallback chains, throttle wrappers) to warrant full guidance. | 2 hr |
| D.2 | Create `.github/skills/add-domain-entity/SKILL.md` — step-by-step entity creation workflow: field design, Equatable/const, naming conflict pre-flight (reference domain.instructions.md table), barrel insertion with ASCII-sort verification, copyWith/toString generation, test scaffolding (equality, copyWith, toString, boundary values), domain coverage verification. | Entity creation is the single most repeated domain task. Barrel ordering alone has caused multiple regressions (documented in domain.instructions.md). | 2 hr |
| D.3 | Create `.github/skills/consolidate-tests/SKILL.md` — step-by-step test consolidation workflow: identify boilerplate patterns, extract shared helpers, convert to table-driven tests, migrate to `candle_factory`/`signal_factory`, verify coverage unchanged, validation checklist. Reference Section 16 phases. | Directly supports the test consolidation initiative. Ensures consistent approach across 412 test files. | 2 hr |

#### Phase E — Instruction File Enhancement (P1)

| # | Task | Impact | Effort |
|---|------|--------|--------|
| E.1 | Expand `presentation.instructions.md` (~29 → ~60 lines): add screen patterns (`ConsumerWidget` vs `ConsumerStatefulWidget` decision criteria), navigation patterns (GoRouter route definition, deep-link payloads), theming rules (dark/light/system, color tokens), accessibility patterns (semantic labels, contrast ratios), widget testing guidance (pumpWidget patterns, golden file policy). | Thinnest instruction file; the only layer with sparse guidance. | 1 hr |
| E.2 | Update `application.instructions.md`: add mentions of `CostBasisService`, `BacktestOrchestrator`, `DailyMetricsAggregator`, `AlertRuleService`, `AccessibilityAuditService` with one-line purpose descriptions. | These services have test files but no instruction guidance. | 30 min |
| E.3 | Update `data.instructions.md`: replace "Stooq-adjacent integrations" with explicit `StooqProvider`. Add `http_constants.dart` mention and cache TTL strategy documentation. | Removes vague wording. | 15 min |
| E.4 | Update `ci.instructions.md`: add `pages.yml` job structure section (deploy job, path restrictions, artifact scope). | `pages.yml` is the only workflow not documented in CI instructions. | 30 min |
| E.5 | Update `testing.instructions.md`: add DateTime-containing entity list for S501–S600 entities (if any were added since the current list), add guidance on `setUpAll` vs `setUp` decision, add table-driven test pattern examples, reference shared helpers inventory. | Keeps the testing instruction file aligned with the test consolidation plan (Section 16). | 30 min |

#### Phase F — Workflow Fixes (P0)

| # | Task | Impact | Effort |
|---|------|--------|--------|
| F.1 | Fix `pages.yml`: add `timeout-minutes: 10` to the deploy job. | Violates the repo's own CI rule from `ci.instructions.md`. | 5 min |
| F.2 | Fix `pages.yml`: add `paths-ignore` to skip code-only changes (mirror the list from `ci.yml`), OR add a path filter to only trigger on `docs/**`, `index.html`, `README.md` changes. | Prevents unnecessary Pages deploys on every push to main. | 10 min |
| F.3 | Fix `pages.yml`: change `path: "."` to a scoped directory (e.g., `path: "docs/"` or a dedicated `public/` folder). Currently uploads the entire repo including `lib/`, `test/`, `build/`, `coverage/` to GitHub Pages. | Reduces artifact size and prevents accidental source code publication. | 15 min |
| F.4 | Fix `release.yml`: update header comment (lines 3–10) to mention MSIX alongside ZIP and APK. | Comment is stale — MSIX has been built since it was added but the header was never updated. | 5 min |
| F.5 | Add `gradle` ecosystem to `dependabot.yml` for Android dependency updates. | Currently only `pub` and `github-actions` ecosystems are monitored. Android Gradle dependencies (`build.gradle.kts`) are unmonitored. | 10 min |

#### Phase G — Hook & MCP Cleanup (P1)

| # | Task | Impact | Effort |
|---|------|--------|--------|
| G.1 | Verify whether `.github/hooks/` is loaded by VS Code Copilot. If not, move `format-on-save.json` and `terminal-safety.json` to `.vscode/` or the correct Copilot hook location. | Hooks may be silently ignored in their current non-standard location. | 30 min |
| G.2 | Clean up `.vscode/mcp.json`: either wire the `alpha_vantage_api_key` input to a configured server (if AlphaVantage integration is planned) or remove the orphaned input. | Orphaned config creates confusion about what's actually supported. | 15 min |
| G.3 | Evaluate adding MCP servers that are verified and useful: `context7` for library documentation lookup, `sequential-thinking` for complex multi-step reasoning. Only add if VS Code schema and runtime support are confirmed. | Expands AI-assisted development capabilities. Must stay conservative per copilot-instructions.md guidance. | 1 hr |

#### Phase H — Template & Documentation Refresh (P2)

| # | Task | Impact | Effort |
|---|------|--------|--------|
| H.1 | Update `ISSUE_TEMPLATE/bug_report.md`: add structured form fields (YAML frontmatter `issue_form` format instead of free-text Markdown), add dropdown for data provider, add Flutter version / Dart SDK version fields. | Modern GitHub issue forms are more structured and parseable. | 30 min |
| H.2 | Update `ISSUE_TEMPLATE/feature_request.md`: convert to YAML issue form format with layer dropdown, priority estimate, and acceptance criteria template. | Same modernization as H.1. | 30 min |
| H.3 | Create `ISSUE_TEMPLATE/config.yml` to add "Ask a question → Discussions" and external link options. | Reduces noise in the issue tracker. | 15 min |
| H.4 | Update `pull_request_template.md`: add "Files changed" summary section, add checkbox for "I have updated the relevant `.github/instructions/` file if this changes architectural patterns." | Encourages keeping instruction files current as code changes. | 15 min |

### 17.4 Expected Outcomes

| Metric | Before | After |
|--------|--------|-------|
| Agents | 3 | 6 (every layer + testing + CI) |
| Prompts | 6 (4 missing `tools`, 0 with `mode`) | 11 (all with `tools` + `mode`) |
| Skills | 1 | 4 (trading method, data provider, domain entity, test consolidation) |
| Prompt frontmatter completeness | 33% fully specified | 100% |
| Instruction average lines | 63 | ~75 (presentation expanded, others updated) |
| Workflow rule violations | 3 (pages.yml) + 1 stale comment | 0 |
| Dependabot ecosystems | 2 | 3 (+ gradle) |
| MCP config orphaned inputs | 1 | 0 |
| Hook location issues | 2 files | 0 |

### 17.5 Execution Order

```text
Phase A (frontmatter)  ──▶  Phase F (workflow fixes)  ──▶  Phase B (new agents)
        │                                                         │
        └─ quick wins, do first                                   │
                                                                  ▼
Phase C (new prompts)  ──▶  Phase E (instruction updates)  ──▶  Phase D (new skills)
                                                                  │
Phase G (hooks + MCP)  ─── can run in parallel with C/E ─────────┘
                                                                  │
Phase H (templates)  ──── after everything else stabilizes ───────┘
```

Phases A and F are immediate quick wins (< 1 hour combined). Phase B creates agents that Phases C and D reference. Phase D (skills) should come after Phase E (instructions) since skills reference instruction content.

### 17.6 Constraints

- Never add MCP server configuration unless the schema and runtime support are verified end-to-end.
- Agent `tools` declarations must be least-privilege: read-only agents get `[read, search]`, modification agents get `[read, search, edit, execute]`.
- New prompts must include `description`, `tools`, and `mode` fields — do not repeat the incomplete pattern of the original 6.
- Skill files must include a "Read These Files First" section and a "Completion Checklist" section, matching the `add-trading-method` skill pattern.
- Instruction file updates must not drift from the actual codebase — verify file paths and class names exist before referencing them.
- Workflow changes must be validated with `act` (local) or a throwaway CI run before merging.
- All `.github` markdown files must pass `markdownlint` (enforced by pre-commit).

---

## Appendix A — Completed Work (Flutter App Archive)

<details>
<summary>Click to expand Flutter app implementation history</summary>

### Core Features (v1.0–v2.27)

- SMA200/SMA150/SMA50 cross-up detection with idempotent alerting
- Yahoo Finance provider (free, no API key) + 6 fallback providers
- Drift SQLite database (v15) with TTL cache
- Riverpod state management, GoRouter navigation
- Local notifications (Android channels + Windows toasts)
- WorkManager background (Android) + Timer.periodic (Windows)
- Alert Profiles, HealthCheckService, Golden/Death Cross
- Chart enhancements: SMA overlay, S&P benchmark, volume bars, time-range selector
- Price target/percentage-move/volume spike alerts
- Alert history timeline with CSV/JSON export
- Earnings badge, deep-link support, crash log viewer, audit log
- Multiple data provider fallback chain
- Proxy auto-detection, delta fetch, offline mode
- Watchlist export/import, Telegram/Discord webhooks
- System tray (Windows), MSIX packaging, GitHub Actions CI/CD

### Technical Indicators (15)

SMA, EMA, RSI, MACD, Bollinger, ATR, Stochastic, OBV, ADX, CCI, MFI,
SuperTrend, Williams %R, Parabolic SAR, VWAP

### Method Detectors (12) + Consensus Engine

Micho, RSI, MACD, Bollinger, Stochastic, OBV, ADX, CCI, SAR,
Williams %R, MFI, SuperTrend — all wired into ConsensusEngine + RefreshService

### Analytics (20+)

Fibonacci, Volume Profile, Benchmark, Drawdown, Correlation, Sharpe/Sortino,
Risk/Reward, Trend Strength, Position Sizing, Signal Replay, Backtest Engine

### Stats

- 3348+ passing tests
- 0 analyzer issues
- 100% domain coverage
- 9 screens

</details>

---

*Last updated: April 19, 2026*
*Flutter app: v2.27.0+41 | 3348+ tests | 0 analyze issues | 100% domain coverage*
