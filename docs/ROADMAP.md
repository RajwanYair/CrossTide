# CrossTide — Development Roadmap

## Vision
CrossTide is a cross-platform stock monitoring toolkit that detects **moving-average crossover events** (SMA50 / SMA150 / SMA200), benchmarks ticker performance against the S&P 500, and empowers individual investors with actionable, real-time alerts — all without paid API keys.

> Ideas in this roadmap were consolidated from 12+ production projects in the workspace  
> (ExplorerLens, RegiLattice, DupDetector, FileProcessor, OptimizeBrowsers, PPA, VHDXCompress,  
> VSCode.RemoteSSH.Verifier, and others) plus standard enterprise engineering patterns.

---

## ✅ Already Implemented

- SMA200 cross-up detection with idempotent alerting
- Yahoo Finance provider (free, no API key)
- Drift SQLite database with TTL cache
- Riverpod state management, GoRouter navigation
- Local notifications (Android channels + Windows toasts)
- WorkManager background (Android) + Timer (Windows)
- **Alert Profiles** — `AlertProfile` enum (Aggressive / Balanced / Conservative / Custom)  
  with preset `AppSettings` defaults and `displayName` / `description` helpers
- **HealthCheckService** — startup diagnostics: network, database, data freshness
- Clean Architecture (domain → data → application → presentation)
- 100% domain test coverage (72 tests)
- GitHub Actions CI/CD, bump-version workflow, release workflow (ZIP + MSIX + APK)
- Pre-commit hooks (dart format, analyze, secret scan, YAML/JSON/Markdown lint)
- VS Code tasks: quick release bumps via `gh workflow run`

---

## v1.1 — Multi-SMA Lines & Benchmark Comparison

### Chart Enhancements
- [ ] **SMA50 / SMA150 overlay lines** on ticker detail chart (toggle on/off)
- [ ] Color-coded lines: SMA50 (green), SMA150 (purple), SMA200 (orange)
- [ ] **S&P 500 benchmark overlay** — normalized % chart comparing ticker vs `^GSPC`
- [ ] Candlestick chart mode (OHLC bars alongside or instead of line chart)
- [ ] Volume bars below the price chart
- [ ] Chart time-range selector: 3M / 6M / 1Y / 2Y / 5Y / Max
- [ ] Pinch-to-zoom and pan on mobile
- [ ] Dark mode chart theme

### Cross-Up Detection Expansion
- [ ] Detect SMA50 and SMA150 cross-ups (not just SMA200)
- [ ] **Golden Cross** alert: SMA50 crosses above SMA200
- [ ] **Death Cross** alert: SMA50 crosses below SMA200
- [ ] User-selectable alert types per ticker

### Alert Profile UX (uses `AlertProfile` already implemented)
- [ ] Profile picker chip-row on settings screen (Aggressive / Balanced / Conservative)
- [ ] "Custom" chip lights up when user overrides any field
- [ ] One-tap reset to profile defaults

---

## v1.2 — Watchlist & Portfolio UX

### Watchlist Improvements
- [ ] **Watchlist groups** (e.g., "Tech", "Energy", "My Portfolio")
- [ ] Drag-to-reorder tickers
- [ ] **Bulk add** tickers — paste comma-separated list
- [ ] Ticker search with auto-complete (fuzzy name + symbol)
- [ ] Market sector tags and color-coded badges
- [ ] **Multi-select + batch actions** (apply profile, enable/disable, delete)  
  *Inspired by the batch-operations pattern from VSCode SSH Manager and FileProcessor*

### Dashboard / Home Screen
- [ ] At-a-glance dashboard: tickers near SMA200, recent cross-ups, market status
- [ ] **Heatmap** — all watchlist tickers colored by distance-from-SMA200
- [ ] Sort/filter by: alphabetical, % above/below SMA, market cap, sector
- [ ] **Data freshness banner** — "Updated 3 min ago" badge per ticker  
  *Mirrored from the startup HealthCheckService data-freshness check*

### Progressive Disclosure UI
- [ ] **Novice mode** — 3 settings visible: symbols, profile, notification toggle  
  *Inspired by RegiLattice's tiered-complexity approach and OptimizeBrowsers profiles*
- [ ] **Advanced mode** — all knobs visible (SMA period, TTL, quiet hours, etc.)
- [ ] Smooth expand/collapse animation between modes

---

## v1.3 — Advanced Technical Indicators

- [ ] **EMA (Exponential Moving Average)** — 12, 26, 50, 200 periods
- [ ] **RSI (Relative Strength Index)** — 14-day with overbought/oversold zones
- [ ] **MACD** — histogram + signal line
- [ ] **Bollinger Bands** — 20-day SMA ± 2σ
- [ ] Custom indicator builder — pick any SMA/EMA period
- [ ] Indicator panel below the main chart (split-pane layout)

---

## v1.4 — Notifications & Alert Engine

- [ ] **Price target alerts** — notify when price hits $X
- [ ] **Percentage-move alerts** — notify on ±N% intraday move
- [ ] **Volume spike alerts** — 2× average daily volume
- [ ] Alert history timeline — scrollable log of all past alerts with price context
- [ ] **Export alert history to CSV / JSON**  
  *Inspired by DupDetector's multi-format export (JSON, CSV, HTML)*
- [ ] Per-ticker notification sound customization
- [ ] **Notification channel fallback chain**:  
  push → Windows toast → in-app banner → silent log  
  *Mirrors the graceful-fallback pattern from OptimizeBrowsers*
- [ ] **Telegram / Discord webhook** integration  
  *Inspired by FileProcessor's plugin/hook architecture; see v1.8 for full plugin system*
- [ ] Email digest — daily summary of watchlist status

---

## v1.5 — Data & Performance

- [ ] **Multiple data provider fallback chain** — Yahoo → AlphaVantage → Mock  
  *Mirrors UbuntuEnhancer's repository validation and PPA's package-manager chain*
- [ ] Intraday data support (1m / 5m / 15m candles)
- [ ] Pre-market / after-hours price display
- [ ] **Offline mode** — full SQLite cache, last-known data when offline  
  *Inspired by portable-deployment philosophy (ComicSorter 2-file model)*
- [ ] Background sync optimization — delta fetch (only new candles)
- [ ] **Data freshness indicator** ("Updated 3 min ago") using HealthCheckService result
- [ ] Rate-limit-aware request scheduler
- [ ] **Corporate / Intel proxy auto-detection** on Windows  
  *Directly lifted from Scripts.UbuntuEnhancer intel proxy pattern*

---

## v1.6 — Platform & Distribution

### Android
- [ ] Widget: home-screen ticker card with SMA status
- [ ] Wear OS companion — wrist glance at cross-up alerts

### Windows
- [ ] System tray with popup summary
- [ ] Windows Task Scheduler integration for true background refresh
- [ ] MSIX packaging for Microsoft Store *(pipeline already implemented)*

### Cross-Platform
- [ ] **iOS** target (requires macOS build host)
- [ ] **macOS** desktop target
- [ ] **Web** target (Progressive Web App) — view-only dashboard
- [ ] Deep-link / universal-link support

---

## v1.7 — Observability, Audit & Export

> **Inspired by:** RegiLattice (snapshot/drift, compliance log), FileProcessor (Prometheus),
> OptimizeBrowsers (dry-run/preview), VHDXCompress (progress tracking), Scripts.OptimizeWIN
> (change-history + rollback)

### Alert Metrics Dashboard
- [ ] Per-ticker sensitivity stats: signal count, false-positive rate, avg days-to-next-cross
- [ ] "Mean time to alert" (data age at alert-fire time)
- [ ] Export daily metrics summary as JSON
- [ ] Optional Prometheus endpoint (`/metrics`) for power users with Grafana

### Snapshot & Drift Detection
- [ ] Daily JSON snapshot of all `TickerAlertState` values
- [ ] Diff view: "Yesterday you had 12 alerts enabled; today 11. What changed?"
- [ ] Anomaly detection: flag if same ticker cross-ups repeatedly within hours
- [ ] **Rollback** — revert settings to a previous snapshot

### Audit Log
- [ ] Every setting change recorded: `{timestamp, field, old_value, new_value}`
- [ ] Surfaced in Settings → Audit Log screen (sortable, filterable)
- [ ] Scrollable alert-event log: `{symbol, time, price, sma200, trigger_type}`

### Dry-Run / Preview Mode
- [ ] Before enabling a profile: "This will fire ~N daily alerts based on last 30 days"
- [ ] Confirm / Cancel dialog with impact summary
- [ ] Preview applies in-memory, no DB write until confirmed

---

## v1.8 — Social & Community Features

- [ ] **Share watchlist** — export/import as JSON or shareable link
- [ ] **Public leaderboard** — opt-in: "Most cross-ups caught this month"
- [ ] Community-curated watchlists (e.g., "ARK Innovation Picks")
- [ ] In-app news feed for watchlist tickers (RSS/Atom aggregation)

---

## v1.9 — AI & Smart Features

> **Inspired by:** DupDetector's ML confidence scoring, behavioral profiling, intent
> classification; GitHub Copilot Chat integration; RegiLattice's dependency resolver

- [ ] **Signal confidence score** — ML-estimated quality % per alert  
  ("87% confidence this cross-up will hold based on historical outcomes")
- [ ] **Trader behavioral profiling** — auto-detect usage pattern (scalper / momentum / reversal)  
  and suggest matching alert profile
- [ ] **AI-powered pattern recognition** — flag when historical outcomes for this setup were profitable
- [ ] Sentiment analysis — aggregate news/social sentiment per ticker
- [ ] **Smart notification timing** — learn when user engages, deliver at optimal time of day
- [ ] **Natural language ticker search** ("show me tech stocks near their 200-day average")
- [ ] **Copilot Chat integration** — ask questions about your watchlist in-app

---

## v2.0 — Plugin System & Extensibility

> **Inspired by:** FileProcessor's 5-plugin-type architecture, DupDetector's custom handlers,
> OptimizeBrowsers' profile customization, Scripts.PPA's multi-package-manager abstraction

- [ ] **Alert handler plugin interface** — users add custom notification sinks  
  (Slack, Discord, Webhook, email, SMS, custom REST endpoint) without app update
- [ ] Plugin discovery: drop a Dart file into a plugins/ folder; app hot-loads it
- [ ] **Declarative alert rule DSL**: `IF sma50 > sma200 AND rsi < 30 THEN alert`  
  *Natural evolution of the `AlertStateMachine` to a data-driven rules engine*
- [ ] User-defined indicators (custom SMA/EMA periods, formula builder)
- [ ] Multi-device sync via Firebase/Supabase
- [ ] Real-time streaming quotes (WebSocket)
- [ ] PDF report generation — weekly technical summary per watchlist
- [ ] **Backtesting engine** — "How did SMA200 cross-ups perform over 10 years?"
- [ ] Unlimited watchlist tickers (free tier: 10)

---

## Future Backlog

| Idea | Source inspiration |
|------|-------------------|
| Crypto support (BTC, ETH via CoinGecko) | — |
| Forex pairs | — |
| Options chain viewer | — |
| Earnings calendar integration | — |
| Dividend tracker | — |
| Multi-language localization (i18n) | localizely.flutter-intl already in extensions |
| Accessibility audit (screen readers, high contrast) | — |
| GPU-accelerated chart rendering (DirectX/Vulkan on Windows) | ExplorerLens GPU pipeline |
| Docker Compose dev stack (PostgreSQL history, Redis cache, exchange simulator) | FileProcessor docker-compose |
| In-app REST API (`/api/alerts`, `/api/config`, `/api/metrics`) | FileNameManipulator FastAPI dashboard |
| Web dashboard companion (view-only) | PPA + VHDXCompress web GUI pattern |
| 11-theme support (Catppuccin, Nord, Dracula, Solarized…) | RegiLattice themes |

---

## Engineering Conventions (Cross-Workspace Learnings)

| Convention | Status |
|------------|--------|
| Pre-commit hooks (format, analyze, secret scan) | ✅ `.pre-commit-config.yaml` added |
| Strict analysis_options + avoid_dynamic_calls | ✅ |
| 100% domain test coverage enforced in CI | ✅ |
| Declarative alert profiles (not imperative if/else) | ✅ `AlertProfile` enum + extension |
| Startup health checks (network, DB, freshness) | ✅ `HealthCheckService` |
| Snapshot/rollback architecture | Planned v1.7 |
| YAML-based user config (human-editable) | Planned v1.7 |
| Graceful fallback chain (provider → mock) | Planned v1.5 |
| Batch operations with multi-select | Planned v1.2 |
| Corporate proxy auto-detection | Planned v1.5 |


### Chart Enhancements
- [ ] **SMA50 / SMA150 overlay lines** on ticker detail chart (toggle on/off)
- [ ] Color-coded lines: SMA50 (green), SMA150 (purple), SMA200 (orange)
- [ ] **S&P 500 benchmark overlay** — normalized percentage chart comparing ticker vs `^GSPC`
- [ ] Candlestick chart mode (OHLC bars alongside or instead of line chart)
- [ ] Volume bars below the price chart
- [ ] Chart time-range selector: 3M / 6M / 1Y / 2Y / 5Y / Max
- [ ] Pinch-to-zoom and pan on mobile
- [ ] Dark mode chart theme

### Cross-Up Detection Expansion
- [ ] Detect SMA50 and SMA150 cross-ups (not just SMA200)
- [ ] **Golden Cross** alert: SMA50 crosses above SMA200
- [ ] **Death Cross** alert: SMA50 crosses below SMA200
- [ ] User-selectable alert types per ticker (SMA200 cross-up, Golden Cross, etc.)

---

## v1.2 — Watchlist & Portfolio UX

### Watchlist Improvements
- [ ] **Watchlist groups** (e.g., "Tech", "Energy", "My Portfolio")
- [ ] Drag-to-reorder tickers
- [ ] Bulk add tickers (paste comma-separated list)
- [ ] Ticker search with auto-complete (fuzzy name + symbol)
- [ ] Market sector tags and color-coded badges

### Dashboard / Home Screen
- [ ] At-a-glance dashboard: tickers near SMA200, recent cross-ups, market status
- [ ] Heatmap — all watchlist tickers colored by distance-from-SMA200
- [ ] Sort/filter by: alphabetical, % above/below SMA, market cap, sector

---

## v1.3 — Advanced Technical Indicators

- [ ] **EMA (Exponential Moving Average)** — 12, 26, 50, 200 periods
- [ ] **RSI (Relative Strength Index)** — 14-day with overbought/oversold zones
- [ ] **MACD** — histogram + signal line
- [ ] **Bollinger Bands** — 20-day SMA ± 2σ
- [ ] Custom indicator builder — pick any SMA/EMA period
- [ ] Indicator panel below the main chart (split-pane layout)

---

## v1.4 — Notifications & Alert Engine

- [ ] **Price target alerts** — notify when price hits $X
- [ ] **Percentage move alerts** — notify on ±N% intraday move
- [ ] **Volume spike alerts** — 2× average daily volume
- [ ] Alert history timeline — scrollable log of all past alerts
- [ ] Export alert history to CSV
- [ ] Per-ticker notification sound customization
- [ ] **Telegram / Discord webhook** integration (push alerts to chat)
- [ ] Email digest — daily summary of watchlist status

---

## v1.5 — Data & Performance

- [ ] **Multiple data provider fallback chain** — Yahoo → AlphaVantage → Mock
- [ ] Intraday data support (1m / 5m / 15m candles)
- [ ] Pre-market / after-hours price display
- [ ] Offline mode — full SQLite cache, last-known data shown when offline
- [ ] Background sync optimization — delta fetch (only new candles)
- [ ] Data freshness indicator ("Updated 3 min ago")
- [ ] Rate-limit-aware request scheduler

---

## v1.6 — Platform & Distribution

### Android
- [ ] Widget: home-screen ticker card with SMA status
- [ ] Wear OS companion — wrist glance at cross-up alerts

### Windows
- [ ] System tray with popup summary
- [ ] Windows Task Scheduler integration for true background refresh
- [ ] MSIX packaging for Microsoft Store

### Cross-Platform
- [ ] **iOS** target (requires macOS build host)
- [ ] **macOS** desktop target
- [ ] **Web** target (Progressive Web App) — view-only dashboard
- [ ] Deep-link / universal-link support

---

## v1.7 — Social & Community Features

- [ ] **Share watchlist** — export/import as JSON or shareable link
- [ ] **Public leaderboard** — opt-in: "Most cross-ups caught this month"
- [ ] Community-curated watchlists (e.g., "ARK Innovation Picks")
- [ ] In-app news feed for watchlist tickers (RSS/Atom aggregation)

---

## v1.8 — AI & Smart Features

- [ ] **AI-powered pattern recognition** — flag similar historical SMA cross-up outcomes
- [ ] Sentiment analysis — aggregate news/social sentiment per ticker
- [ ] Smart notification timing — learn when user engages, deliver at optimal times
- [ ] Natural language ticker search ("show me tech stocks near their 200-day average")
- [ ] Copilot Chat integration — ask questions about your watchlist in-app

---

## v2.0 — Premium & Monetization (Optional)

- [ ] Unlimited watchlist tickers (free tier: 10)
- [ ] Real-time streaming quotes (WebSocket)
- [ ] Multi-device sync via Firebase/Supabase
- [ ] Custom alert rules DSL ("IF sma50 > sma200 AND rsi < 30 THEN alert")
- [ ] PDF report generation — weekly technical summary per watchlist
- [ ] Backtesting engine — "How did SMA200 cross-ups perform over 10 years?"

---

## Future Ideas (Backlog)

- Crypto support (BTC, ETH — via CoinGecko free API)
- Forex pairs
- Options chain viewer
- Earnings calendar integration
- Dividend tracker
- Multi-language localization (i18n)
- Accessibility audit (screen readers, high contrast)
- Plugin/extension system for community indicators
