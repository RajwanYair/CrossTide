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
- **HealthCheckService** — startup diagnostics: network, database, data freshness
- Clean Architecture (domain → data → application → presentation)
- 205 passing unit tests (domain + data + application layers covered)
- GitHub Actions CI/CD, bump-version workflow, release workflow (ZIP + MSIX + APK)
- Pre-commit hooks (dart format, analyze, secret scan, YAML/JSON/Markdown lint)
- VS Code tasks: quick release bumps via `gh workflow run`
- **Multi-SMA detection** — SMA50/SMA150/SMA200 cross-up alerts + Golden/Death Cross
- **Chart enhancements** — SMA overlay lines, S&P 500 benchmark, volume bars, time-range selector
- **Price target alerts** — per-ticker price-target list, DB-backed, dismissable tiles
- **Percentage-move alerts** — per-ticker % threshold list, ▲/▼ direction
- **Volume spike alerts** — N× 20-day average daily volume; configurable multiplier
- **Alert history timeline** — scrollable log of all past alerts, acknowledge + swipe-to-dismiss
- **Export alert history** — CSV and JSON export to documents directory
- **Upcoming earnings indicator** — `_EarningsBadge` in ticker detail AppBar
- **Dynamic accent color** — 10-color palette picker in settings; persisted, live theme update
- **Deep-link support** — `crosstide://ticker/AAPL` scheme
- **Crash log viewer** — `/crash-logs` screen accessible from Settings
- **Multiple data provider fallback chain** — Yahoo → AlphaVantage → Mock (`FallbackMarketDataProvider`)
- **Rate-limit-aware request scheduler** — `ThrottledMarketDataProvider` (burst + exponential backoff)
- **Intraday quotes** — `IntradayQuote` entity + `_QuoteBar` chip on ticker detail
- **Pre-market/after-hours indicator** — `_InlineMarketState` chip on ticker list cards
- **Offline mode banner** — global connectivity banner via `connectivityProvider`
- **Delta fetch optimization** — only fetches new candles since last cached date
- **Proxy auto-detection** — `proxy_detector.dart` reads HTTPS_PROXY/HTTP_PROXY env vars
- **Alert sensitivity stats** — `AlertSensitivityStats` entity + `_SensitivityStatsCard`
- **Audit log** — `AuditLogTable` (DB schema v12) + `/audit-log` screen
- **State snapshot export** — `SnapshotService` writes JSON to `$TEMP`
- **Alert profile dry-run preview** — diff dialog before applying a profile
- **Watchlist export/import** — `WatchlistExportImportService` with JSON serialization (S53)
- **Telegram/Discord webhook alerts** — `WebhookService` fires on every alert; credentials in secure storage (S54)
- **15 Technical Calculators** — Stochastic, Williams%R, OBV, ROC, CCI, MFI, CMF, Donchian, Keltner, Parabolic SAR, ADX, Ichimoku, Pivot Points, Heikin-Ashi, SuperTrend (S58–S72)
- **5 Method Detectors** — Stochastic, OBV, ADX, CCI, SAR method detectors wired into ConsensusEngine + RefreshService (S73–S79)
- **20+ Domain Analytics** — Fibonacci, Volume Profile, Benchmark, Drawdown, Correlation, Sharpe/Sortino, Risk/Reward, Trend Strength, Signal Replay, Position Sizing, Win/Loss Streaks, Price Distance, Gap Detector, MA Ribbon, Signal Aggregator, Candlestick Patterns, Support/Resistance (S80–S107)
- 808 passing unit tests, 0 analyze issues
- **7 Data Providers** — Yahoo, AlphaVantage, Stooq, MarketWatch, Coinpaprika + Mock + Fallback chain (S108–S132)
- **Backtesting Engine** — `BacktestEngine`, `BacktestConfig`, `BacktestTrade`, `BacktestStat` (S128–S132)

### Domain Expansion (S133–S180)
- **Sector Analysis** — `SectorRotationScorer`, `SectorCorrelationCalculator`, `SectorHeatmapBuilder`
- **Portfolio Tracking** — `PortfolioSummarizer`, `PortfolioHolding`, `PortfolioRiskScorer` (HHI-based)
- **Alert Rule DSL** — `AlertRuleEvaluator`, `AlertCondition`, `CompareOp`, `RuleContext` (declarative rules engine)
- **Dividend Tracking** — `DividendCalculator`, `DividendPayment`, `DividendSummary`, `DividendProjection`
- **Earnings Calendar** — `EarningsCalendarCalculator`, `EarningsProximity`, `EarningsTiming`
- **Multi-Timeframe Analysis** — `MultiTimeframeAnalyzer`, `CandleAggregator`, `TimeframeBias`
- **Report Builder** — `ReportBuilder`, `TickerReport`, `ReportSection`, `ReportMetadata`
- **Cost Basis Calculator** — `CostBasisCalculator`, `TradeEntry`, `CostBasisResult`
- **Options Heatmap** — `OptionsHeatmapBuilder`, `OptionsStrike`, `OptionsHeatmapSummary`
- **Notification Channel Ranker** — `NotificationChannelRanker`, `ChannelStatus`, `RankedChannel`
- **Forex Calculator** — `ForexCalculator`, `ForexPair`, `PipInfo`, `ForexSummary`
- **News Relevance Scorer** — `NewsRelevanceScorer`, `NewsItem`, `ScoredNewsItem`, `NewsFeedSummary`
- **Watchlist Share Codec** — `WatchlistShareCodec`, `WatchlistSharePayload` (deep-link encode/decode)
- **Locale Resolver** — `LocaleResolver`, `AppLocale` (7 locales), `LocaleResolution`
- **Accessibility Checker** — `AccessibilityChecker`, `ComponentDescriptor`, `A11yAuditResult`
- **Performance Scorer** — `PerformanceScorer`, `PerformanceSample`, `OperationStats`, `PerformanceScore`
- 1172 passing unit tests, 0 analyze issues

### Domain Expansion (S231–S245)
- **NotificationSoundProfile** — per-ticker alert sound + vibration config (`AlertSoundType`, `AlertSoundPriority`) (S231)
- **AndroidWidgetConfig** — home-screen widget layout/badge config (`WidgetLayoutStyle`, `WidgetSignalBadge`) (S232)
- **PrometheusMetric** — Prometheus exposition format: `PrometheusMetric`, `PrometheusMetricsSnapshot.toExpositionFormat()` (S233)
- **EmailDigestConfig** — daily/weekly digest config (`DigestFrequency`, `DigestSection`) (S234)
- **TraderBehaviorProfile** — behavioral profiling: scalper/momentum/position/reversal classifier (S235)
- **SentimentScore** — news/social sentiment aggregation (`SentimentAggregator`, `SentimentDataPoint`, `SentimentDirection`) (S236)
- **CommunityWatchlist** — community curated watchlists with votes, tags, approval rate (S237)
- **LeaderboardEntry** — public leaderboard: `LeaderboardRanker`, tie-aware ranking, `LeaderboardPeriod`/`LeaderboardMetric` (S238)
- **StreamingQuoteSession** — WebSocket streaming config/session/state (`StreamingProtocol`, reconnect) (S239)
- **DeviceSyncManifest** — multi-device sync state (`SyncCategory`, `SyncStatus`, pending categories) (S240)
- **CryptoAsset** — crypto entity + price (`CryptoExchange`, `CryptoPrice.isPositiveDay`) (S241)
- **ThemePreset** — 11 built-in themes via `ThemeRegistry` (midnight, dracula, nord, catppuccin, solarized_dark, terminal, ocean, light, solarized_light, high_contrast, rose_pine) (S242)
- **TaxLotCalculator** — FIFO/LIFO/avgCost/specificId lot matching with `isLongTerm` detection (S243)
- **PortfolioOptimizer** — Monte Carlo maxSharpe/minVol, riskParity (inverse-vol), equalWeight (S244)
- **CandleAnnotation** — chart annotation markers: `CandleAnnotationBuilder`, `AnnotationKind`, `AnnotationShape` (S245)
- **1473 passing unit tests**, 0 analyze issues

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
- [x] **Golden Cross** alert: SMA50 crosses above SMA200
- [x] **Death Cross** alert: SMA50 crosses below SMA200
- [x] User-selectable alert types per ticker

### Alert Profile UX (uses `AlertProfile` already implemented)
- [x] Profile picker chip-row on settings screen (Aggressive / Balanced / Conservative)
- [x] "Custom" chip lights up when user overrides any field
- [x] One-tap reset to profile defaults

---

## v1.2 — Watchlist & Portfolio UX

### Watchlist Improvements
- [x] **Watchlist groups** (e.g., "Tech", "Energy", "My Portfolio")
- [x] Drag-to-reorder tickers
- [x] **Bulk add** tickers — paste comma-separated list
- [x] Ticker search with auto-complete (fuzzy name + symbol)
- [x] Market sector tags and color-coded badges
- [x] **Multi-select + batch actions** (apply profile, enable/disable, delete)

### Dashboard / Home Screen
- [x] At-a-glance dashboard: tickers near SMA200, recent cross-ups, market status
- [x] **Heatmap** — all watchlist tickers colored by distance-from-SMA200
- [x] Sort/filter by: alphabetical, % above/below SMA, market cap, sector
- [x] **Data freshness banner** — stale-data warning + last-updated time

### Progressive Disclosure UI
- [x] **Novice mode** — 3 settings visible: symbols, profile, notification toggle
- [x] **Advanced mode** — all knobs visible (SMA period, TTL, quiet hours, etc.)
- [x] Smooth expand/collapse animation between modes

---

## v1.3 — Advanced Technical Indicators

- [x] **EMA (Exponential Moving Average)** — 12, 26, 50, 200 periods
- [x] **RSI (Relative Strength Index)** — 14-day with overbought/oversold zones
- [x] **MACD** — histogram + signal line
- [x] **Bollinger Bands** — 20-day SMA ± 2σ
- [x] **ATR (Average True Range)** — 14-day volatility overlay (S64)
- [x] **VWAP** — intraday volume-weighted average price (S65)
- [x] Custom indicator period builder — pick any SMA/EMA period (S79)
- [x] Indicator panel below the main chart (split-pane layout)

### Extended Technical Calculators (S58–S72)
- [x] **Stochastic Oscillator** — %K/%D with overbought/oversold zones
- [x] **Williams %R** — momentum oscillator (-100 to 0)
- [x] **OBV (On-Balance Volume)** — cumulative volume flow
- [x] **ROC (Rate of Change)** — N-period % price change
- [x] **CCI (Commodity Channel Index)** — deviation from statistical mean
- [x] **MFI (Money Flow Index)** — volume-weighted RSI
- [x] **CMF (Chaikin Money Flow)** — accumulation/distribution
- [x] **Donchian Channels** — N-period high/low breakout bands
- [x] **Keltner Channels** — ATR-based volatility bands
- [x] **Parabolic SAR** — trend-following stop-and-reverse
- [x] **ADX (Average Directional Index)** — trend strength (+DI/−DI)
- [x] **Ichimoku Cloud** — Tenkan/Kijun/Senkou/Chikou
- [x] **Pivot Points** — Standard, Fibonacci, Woodie, Camarilla, DeMark
- [x] **Heikin-Ashi** — smoothed OHLC candle transformation
- [x] **SuperTrend** — ATR-based trend indicator

### Method Detectors (S73–S79)
- [x] **Stochastic Method** — BUY/SELL on %K/%D crossover from extremes
- [x] **OBV Method** — BUY/SELL on OBV divergence from price
- [x] **ADX Method** — BUY/SELL on strong trend with +DI/−DI cross
- [x] **CCI Method** — BUY/SELL on CCI exit from oversold/overbought
- [x] **SAR Method** — BUY/SELL on Parabolic SAR flip
- [x] All 5 detectors wired into ConsensusEngine and RefreshService

### Domain Analytics & Risk Tools (S80–S107)
- [x] **CustomIndicatorEvaluator** — user-defined SMA/EMA indicators
- [x] **DataFreshness** — track data staleness per ticker
- [x] **DailyMetrics** — daily aggregated analytics snapshot
- [x] **BacktestResult** — backtest trade results with P&L
- [x] **MarketSession** — market open/close/pre-market/after-hours logic
- [x] **TechnicalLevel** — named price levels (support/resistance/pivot)
- [x] **AlertEvent** — domain event for alert lifecycle tracking
- [x] **MeanTimeToAlertCalculator** — data age at alert-fire time
- [x] **FibonacciCalculator** — 7-level retracement from swing high/low
- [x] **VolumeProfileCalculator** — price-volume distribution with POC
- [x] **PerformanceBenchmark** — ticker vs. benchmark % return comparison
- [x] **DrawdownCalculator** — max peak-to-trough decline with dates
- [x] **CorrelationCalculator** — Pearson correlation (price & returns)
- [x] **SharpeRatioCalculator** — annualized risk-adjusted return
- [x] **SortinoRatioCalculator** — downside-only risk-adjusted return
- [x] **RiskRewardCalculator** — long/short trade risk:reward ratio
- [x] **TrendStrengthScorer** — composite 0–100 trend score (ADX+slope+alignment)
- [x] **SignalReplaySimulator** — backtest signal series through candles
- [x] **PositionSizeCalculator** — fixed-fractional & fixed-dollar sizing
- [x] **WinLossStreakCalculator** — max win/loss streaks from P&L list
- [x] **PriceDistanceCalculator** — % distance from any SMA period
- [x] **GapDetector** — detects price gaps with min-% filter
- [x] **MovingAverageRibbonCalculator** — multi-period EMA ribbon
- [x] **SignalAggregator** — multi-method bias summary per ticker
- [x] **CandlestickPatternDetector** — 7 candlestick patterns (Doji, Hammer, Engulfing, etc.)
- [x] **SupportResistanceCalculator** — pivot-based S/R levels with merging

### Application Services (S86–S90)
- [x] **DailyMetricsAggregator** — orchestrates daily metric snapshots
- [x] **DataFreshnessTracker** — tracks & reports per-ticker data age

---

## v1.4 — Notifications & Alert Engine

- [x] **Price target alerts** — notify when price hits $X
- [x] **Percentage-move alerts** — notify on ±N% intraday move
- [x] **Volume spike alerts** — 2× average daily volume
- [x] Alert history timeline — scrollable log of all past alerts with price context
- [x] **Export alert history to CSV / JSON**
- [x] **Per-ticker notification sound customization** — `NotificationSoundProfile`, `AlertSoundType` (S231)
- [ ] **Notification channel fallback chain**:  
  push → Windows toast → in-app banner → silent log
- [x] **Telegram / Discord webhook** integration (S54) — `WebhookService`; credentials in secure storage
- [x] **Email digest** — daily summary — `EmailDigestConfig`, `DigestFrequency`, `DigestSection` (S234)

---

## v1.5 — Data & Performance

- [x] **Multiple data provider fallback chain** — Yahoo → AlphaVantage → Mock (`FallbackMarketDataProvider`)
- [x] Intraday data support (1m / 5m / 15m candles) — `IntradayQuote` entity + `_QuoteBar` widget
- [x] Pre-market / after-hours price display — `_InlineMarketState` chip
- [x] **Offline mode** — full SQLite cache, last-known data when offline + connectivity banner
- [x] Background sync optimization — delta fetch (only new candles since last cached date)
- [x] **Data freshness indicator** ("Updated 3 min ago") per ticker (S80)
- [x] Rate-limit-aware request scheduler — `ThrottledMarketDataProvider`
- [x] **Corporate / Intel proxy auto-detection** on Windows — `proxy_detector.dart`

---

## v1.6 — Platform & Distribution

### Android
- [ ] Widget: home-screen ticker card with SMA status (S91 target)
- [ ] Wear OS companion — wrist glance at cross-up alerts

### Windows
- [x] System tray with popup summary — `SystemTrayService` (tray_manager)
- [x] Windows Task Scheduler integration — `WindowsTaskSchedulerService`
- [x] MSIX packaging for Microsoft Store — release CI builds `.msix`
- [ ] Windows Task Scheduler settings UI picker (S76 target)

### Cross-Platform
- [ ] **iOS** target (requires macOS build host)
- [ ] **macOS** desktop target
- [ ] **Web** target (Progressive Web App) — view-only dashboard
- [x] Deep-link / universal-link support — `crosstide://` scheme, GoRouter redirect

---

## v1.7 — Observability, Audit & Export

> **Inspired by:** RegiLattice (snapshot/drift, compliance log), FileProcessor (Prometheus),
> OptimizeBrowsers (dry-run/preview), VHDXCompress (progress tracking), Scripts.OptimizeWIN
> (change-history + rollback)

### Alert Metrics Dashboard
- [x] Per-ticker sensitivity stats: signal count, unique alert types, first/last fired (S49 `AlertSensitivityStats`)
- [x] "Mean time to alert" (data age at alert-fire time) (S88 `MeanTimeToAlertCalculator`)
- [x] Export daily metrics summary as JSON (S86 `DailyMetricsAggregator`)
- [ ] Optional Prometheus endpoint (`/metrics`) for power users with Grafana

### Snapshot & Drift Detection
- [x] Daily JSON snapshot of all `TickerAlertState` values — `SnapshotService` (S51)
- [x] Diff view: alert profile changes previewed before apply — `previewDiff()` (S52)
- [x] Anomaly detection: flag if same ticker cross-ups repeatedly within hours (S55) — `CrossUpAnomalyDetector` + `_AnomalyBanner`
- [x] **Rollback** — revert settings to a previous snapshot (S56) — `SnapshotService.rollbackSettings()` + UI dialog

### Audit Log
- [x] Every setting change recorded: `{timestamp, field, old_value, new_value}` — `AuditLogTable` (S50)
- [x] Surfaced in Settings → Audit Log screen (sortable, filterable) — `/audit-log` (S50)
- [ ] Scrollable alert-event log: `{symbol, time, price, sma200, trigger_type}`

### Dry-Run / Preview Mode
- [x] Before enabling a profile: diff dialog with field-level old → new preview (S52)
- [x] Confirm / Cancel dialog with impact summary
- [x] Preview applies in-memory, no DB write until confirmed

---

## v1.8 — Social & Community Features

- [x] **Share watchlist** — export/import as JSON — `WatchlistExportImportService` (S53)
- [x] Shareable link — `WatchlistShareCodec` deep-link encode/decode (S169–S171)
- [x] **Public leaderboard** — opt-in consent: `LeaderboardOptIn`, `LeaderboardEntry` (S238/S264)
- [x] Community-curated watchlists — `CommunityWatchlistSubscription` (S265)
- [x] In-app news feed for watchlist tickers — `NewsFeedAggregator`, `NewsRelevanceScorer` (S263)

---

## v1.9 — AI & Smart Features

> **Inspired by:** DupDetector's ML confidence scoring, behavioral profiling, intent
> classification; GitHub Copilot Chat integration; RegiLattice's dependency resolver

- [x] **Signal confidence score** — `SignalConfidenceCalculator`, `SignalConfidenceScore` (S248)
- [x] **Trader behavioral profiling** — `TraderBehaviorClassifier`, `TraderStyle` (scalper/momentum/position/reversal) (S235)
- [x] **AI-powered pattern recognition** — `PatternSignalLibrary`, `SignalExplanation` (S266–S267)
- [x] **Sentiment analysis** — `SentimentAggregator`, `SentimentScore`, `SentimentDataPoint` (S236)
- [x] **Smart notification timing** — `EngagementTimeWindow`, `SmartAlertSchedule.bestWindowForHour()` (S281)
- [x] **Natural language ticker search** — `NaturalLanguageQuery` domain model (S249)
- [ ] **Copilot Chat integration** — ask questions about your watchlist in-app

---

## v2.0 — Plugin System & Extensibility

> **Inspired by:** FileProcessor's 5-plugin-type architecture, DupDetector's custom handlers,
> OptimizeBrowsers' profile customization, Scripts.PPA's multi-package-manager abstraction

- [ ] **Alert handler plugin interface** — users add custom notification sinks  
  (Slack, Discord, Webhook, email, SMS, custom REST endpoint) without app update
- [x] Plugin registry — `PluginRegistry`, `PluginDescriptor`, `PluginLifecycleState` (S268)
- [x] **Declarative alert rule DSL**: `IF sma50 > sma200 AND rsi < 30 THEN alert` — `AlertRuleEvaluator` (S139–S141)  
  *Natural evolution of the `AlertStateMachine` to a data-driven rules engine*
- [x] User-defined indicators — `UserDefinedIndicator`, `IndicatorFormula`, `IndicatorAlertConfig` (S270/S288)
- [x] **Multi-device sync** — `DeviceSyncManifest`, `DeviceSyncEntry`, `SyncCategory`, `SyncConflictResolver` (S240/S287)
- [x] **Real-time streaming quotes** (WebSocket) — `StreamingQuoteSession`, `StreamingQuoteConfig` (S239)
- [x] PDF report generation — domain model: `ReportBuilder` + `TickerReport` (S151–S153)
- [x] **Backtesting engine** — `PortfolioBacktestResult`, `PortfolioBacktestTrade`, equity curve + maxDrawdown (S282)
- [ ] Unlimited watchlist tickers (free tier: 10)

---

## Future Backlog

| Idea | Source inspiration |
|------|-------------------|
| ~~Crypto support (BTC, ETH via CoinGecko)~~ | ✅ domain: `CryptoAsset`, `CryptoPrice` (S241) |
| ~~Forex pairs~~ | ✅ domain: `ForexCalculator` (S163–S165) |
| ~~Options chain viewer~~ | ✅ domain: `OptionsHeatmapBuilder` (S157–S159) |
| ~~Earnings calendar integration~~ | ✅ domain: `EarningsCalendarCalculator` (S145–S147) |
| ~~Dividend tracker~~ | ✅ domain: `DividendCalculator` (S142–S144) |
| ~~Multi-language localization (i18n)~~ | ✅ domain: `LocaleResolver` (S172–S174) |
| ~~Accessibility audit~~ | ✅ domain: `AccessibilityChecker` (S175–S177) |
| GPU-accelerated chart rendering (DirectX/Vulkan on Windows) | ExplorerLens GPU pipeline |
| Docker Compose dev stack (PostgreSQL history, Redis cache, exchange simulator) | FileProcessor docker-compose |
| In-app REST API (`/api/alerts`, `/api/config`, `/api/metrics`) | FileNameManipulator FastAPI dashboard |
| Web dashboard companion (view-only) | PPA + VHDXCompress web GUI pattern |
| ~~11-theme support (Catppuccin, Nord, Dracula, Solarized…)~~ | ✅ domain: `ThemeRegistry` — 11 presets (S242) |

---

## Engineering Conventions (Cross-Workspace Learnings)

| Convention | Status |
|------------|--------|
| Pre-commit hooks (format, analyze, secret scan) | ✅ `.pre-commit-config.yaml` added |
| Strict analysis_options + avoid_dynamic_calls | ✅ |
| 100% domain test coverage enforced in CI | ✅ |
| Declarative alert profiles (not imperative if/else) | ✅ `AlertProfile` enum + extension |
| Startup health checks (network, DB, freshness) | ✅ `HealthCheckService` |
| Snapshot/rollback architecture | ✅ `SnapshotService` (v1.7) |
| YAML-based user config (human-editable) | Planned v1.7 |
| Graceful fallback chain (provider → mock) | ✅ `FallbackMarketDataProvider` (v1.5) |
| Batch operations with multi-select | ✅ (v1.2) |
| Corporate proxy auto-detection | ✅ `proxy_detector.dart` (v1.5) |


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
- [x] **Per-ticker notification sound customization** — `NotificationSoundProfile` (S231)
- [ ] **Telegram / Discord webhook** integration (push alerts to chat)
- [x] **Email digest** — daily summary — `EmailDigestConfig` (S234)

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
- [x] **Public leaderboard** — `LeaderboardRanker`, `LeaderboardEntry` (S238)
- [x] **Community-curated watchlists** — `CommunityWatchlist`, votes, tags (S237)
- [ ] In-app news feed for watchlist tickers (RSS/Atom aggregation)

---

## v1.8 — AI & Smart Features

- [x] **AI-powered pattern recognition** — `PatternSignalLibrary`, `PatternRecognitionResult` (S266)
- [x] **Sentiment analysis** — `SentimentAggregator`, `SentimentScore` (S236)
- [x] Smart notification timing — `SmartAlertSchedule`, `EngagementTimeWindow` (S281)
- [x] Natural language ticker search — `NaturalLanguageQuery` (S249)
- [ ] Copilot Chat integration — ask questions about your watchlist in-app

---

## v2.0 — Premium & Monetization (Optional)

- [ ] Unlimited watchlist tickers (free tier: 10)
- [x] **Real-time streaming quotes** (WebSocket) — `StreamingQuoteSession` (S239)
- [x] **Multi-device sync** — `DeviceSyncManifest`, `SyncCategory`, `SyncConflictResolver` (S240/S287)
- [x] Custom alert rules DSL — `AlertRuleEvaluator`, `AlertRuleTemplate` (S139–S141/S269)
- [x] PDF report generation — `ReportBuilder`, `ReportSchedule` (S151–S153/S285)
- [x] Backtesting engine — `PortfolioBacktestResult`, equity curve, maxDrawdown (S282)

---

## Future Ideas (Backlog)

- ~~Crypto support (BTC, ETH — via CoinGecko free API)~~ ✅ `CryptoAsset`, `CryptoPrice` (S241)
- ~~Forex pairs~~ ✅ `ForexCalculator`, pip/spread/range analysis (S163–S165)
- ~~Options chain viewer~~ ✅ `OptionsHeatmapBuilder` (S157–S159)
- ~~Earnings calendar integration~~ ✅ `EarningsCalendarCalculator` (S145–S147)
- ~~Dividend tracker~~ ✅ `DividendCalculator` (S142–S144)
- ~~Multi-language localization (i18n)~~ ✅ `LocaleResolver` (S172–S174)
- ~~Accessibility audit~~ ✅ `AccessibilityChecker` (S175–S177)
- Plugin/extension system for community indicators
