# Changelog

All notable changes to CrossTide are documented in this file.  
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).  
Versioning follows [Semantic Versioning](https://semver.org/).

---

## [Unreleased]

### Added
- `domain-feature` Copilot agent for pure-domain work
- `add-domain-feature` prompt for guided domain feature workflow
- `dev: domain coverage check` VS Code task (verifies 100% domain coverage locally)
- `github-pull-request` MCP server in `.vscode/mcp.json`
- Console Ninja extension recommendation for runtime debugging
- **15 Technical Calculators** (S58–S72): Stochastic, Williams%R, OBV, ROC, CCI, MFI, CMF, Donchian, Keltner, Parabolic SAR, ADX, Ichimoku, Pivot Points, Heikin-Ashi, SuperTrend
- **5 Method Detectors** (S73–S77): Stochastic, OBV, ADX, CCI, SAR — all wired into ConsensusEngine and RefreshService
- **ConsensusEngine** expanded: now supports 9 trading methods (was 4)
- **6 Domain Entities** (S80–S85): CustomIndicatorEvaluator, DataFreshness, DailyMetrics, BacktestResult, MarketSession, TechnicalLevel
- **AlertEvent** domain entity for alert lifecycle tracking (S86)
- **MeanTimeToAlertCalculator** — measures data age at alert fire time (S88)
- **FibonacciCalculator** — 7-level retracement from swing high/low (S90)
- **VolumeProfileCalculator** — price-volume distribution with POC detection (S91)
- **PerformanceBenchmark** — ticker vs. benchmark % return comparison (S92)
- **DrawdownCalculator** — max peak-to-trough decline with dates (S93)
- **CorrelationCalculator** — Pearson correlation on prices and returns (S94)
- **SharpeRatioCalculator** — annualized risk-adjusted return (S95)
- **SortinoRatioCalculator** — downside-only risk-adjusted return (S96)
- **RiskRewardCalculator** — long/short trade risk:reward ratio (S97)
- **TrendStrengthScorer** — composite 0–100 trend score (S98)
- **SignalReplaySimulator** — backtest signals through historical candles (S99)
- **PositionSizeCalculator** — fixed-fractional & fixed-dollar sizing (S100)
- **WinLossStreakCalculator** — max win/loss streaks (S101)
- **PriceDistanceCalculator** — % distance from any SMA period (S102)
- **GapDetector** — detects price gaps with min-% filter (S103)
- **MovingAverageRibbonCalculator** — multi-period EMA ribbon (S104)
- **SignalAggregator** — multi-method bias summary per ticker (S105)
- **CandlestickPatternDetector** — 7 candlestick patterns (S106)
- **SupportResistanceCalculator** — pivot-based S/R levels (S107)
- **DailyMetricsAggregator** (application) — orchestrates daily metric snapshots (S86)
- **DataFreshnessTracker** (application) — tracks per-ticker data age (S87)
- 10 new `AlertType` enum values for 5 new method buy/sell pairs
- Test count: 808 passing (was 413 at v1.4.0)

### Changed
- `dart format` scope narrowed to `lib test` everywhere (CI, pre-commit, tasks) — avoids `PathNotFoundException` on stale `build/` paths
- `flutter analyze` now always passes `--fatal-infos` in all CI and VS Code tasks
- `flutter test --coverage` gets `--timeout 30s` in all contexts
- Coverage bar threshold raised: yellow ≥ 90% (was 80%)
- Copilot code-generation, test-generation and commit-message inline instructions added to `.vscode/settings.json`
- Java 17 → 21 in `android/app/build.gradle.kts` and all CI `setup-java` steps
- `proxy_detector.dart`: deprecated `onHttpClientCreate` / `dynamic` cast replaced with `IOHttpClientAdapter.createHttpClient` from `package:dio/io.dart`
- `providers.dart`: explicit `IMarketDataProvider` type on for-loop; `set()` → `applyFilter()` (resolves `use_setters_to_change_properties`)
- PR template and issue templates updated with quality-gate checklist

---

## [1.2.1] — 2025-08-12

### Added
- **Micho Method BUY/SELL alerts** (S56) — `MichoMethodDetector` evaluates price vs MA150: BUY when price crosses above with MA flat/rising and within 5%; SELL when price crosses below. `AlertType.michoMethodBuy` and `michoMethodSell` added. `MethodSignal` value object in domain.
- **CrossUp Anomaly Detector** (S55) — `CrossUpAnomalyDetector` flags tickers that trigger multiple cross-up alerts within a configurable window (default 24h). `CrossUpAnomaly` entity; `_AnomalyBanner` shown at top of ticker list when anomalies detected.
- **Settings rollback** (S54 cont.) — `SnapshotService.rollbackSettings()` applies a previous JSON snapshot; confirmation dialog in Settings screen.

### Changed
- DB schema v12 — `AuditLogTable` migration added
- All workflows: `timeout-minutes` added to every job; Java 21; Gradle cache
- CI cost optimization: codegen artifact shared across build jobs (no re-codegen)
- `auto-release.yml`: `paths-ignore` prevents doc-only pushes from counting toward the 10-commit threshold

---

## [1.2.0] — 2025-08-01

### Added
- **Telegram / Discord webhook alerts** (S53) — `WebhookService` fires `POST` for every alert; Telegram bot-token + chat-id, Discord webhook URL stored in `FlutterSecureStorage`. `WebhookKeys` constants; credentials editable in Settings.
- **Watchlist export / import** (S52) — `WatchlistExportImportService` serializes the entire watchlist (tickers + groups + settings) to JSON. Import via clipboard paste dialog. Export copies JSON to clipboard or saves to Documents directory.
- **Alert profile dry-run preview** (S51) — `AlertProfileDiffService.previewDiff()` computes field-level old→new diff before any DB write. Confirmation dialog with impact summary; cancelled applies nothing.
- **State snapshot & rollback** (S50) — `SnapshotService` writes daily JSON snapshots of all `TickerAlertState` values to `getApplicationDocumentsDirectory()/snapshots/`. Rollback restores settings from any past snapshot.
- **Audit log** (S49) — `AuditLogTable` (DB schema v12); every settings change records `{timestamp, field, oldValue, newValue, screen}`. `/audit-log` route with sortable, filterable `ListView`.

### Changed
- `SettingsScreen`: new Audit Log, Webhooks, Watchlist Export/Import sections
- `router.dart`: `/audit-log` route added

---

## [1.1.2] — 2025-07-28

### Added
- **Alert sensitivity stats** (S48) — `AlertSensitivityStats` entity: `totalAlerts`, `firstFiredAt`, `lastFiredAt`, `avgDaysBetweenAlerts`, `alertsByType` map. `_SensitivityStatsCard` on ticker detail screen. `alertSensitivityProvider` computes from `alertHistoryProvider`.
- **Multiple data provider fallback chain** (S47) — `FallbackMarketDataProvider` tries providers in order; `ThrottledMarketDataProvider` adds burst-limit + exponential back-off. `AlphaVantageProvider` and `StooqProvider` available as secondary sources.
- **Rate-limit-aware scheduler** (S46) — `ThrottledMarketDataProvider` (burst + exponential backoff, configurable `maxBurst`, `minIntervalMs`). Throttle state is in-memory; resets on app restart.
- **Delta fetch** (S45) — `StockRepository.fetchAndCacheCandles()` queries the latest cached date; only fetches new candles since then. Dramatically reduces API calls for existing tickers.
- **Corporate/Intel proxy auto-detection** (S44) — `proxy_detector.dart` reads `HTTPS_PROXY` / `HTTP_PROXY` environment variables and applies them to the Dio HTTP client adapter at startup.

### Changed
- `marketDataProviderProvider`: selects Yahoo → AlphaVantage → Mock based on `providerName` setting; wrapped with `FallbackMarketDataProvider` + `ThrottledMarketDataProvider`
- Settings screen: provider picker dropdown (Yahoo Finance / Alpha Vantage)
- DB schema v11: `AppSettingsTable.accentColorValue`

---

## [1.1.1] — 2025-07-21

### Added
- **Intraday quotes** (S43) — `IntradayQuote` entity: symbol, price, change, changePct, volume, marketState, timestamp. `_QuoteBar` chip row on ticker detail. `intradayQuoteProvider` walks `FallbackMarketDataProvider` chain to find `YahooFinanceProvider`.
- **Pre-market / after-hours indicator** (S42) — `MarketState` enum (preMarket, regular, postMarket, closed). `_InlineMarketState` chip on ticker list cards; color-coded (amber/green/blue/grey).
- **Offline mode banner** (S41) — `connectivityProvider` performs DNS lookup to `query1.finance.yahoo.com` every 15 s. `_OfflineBannerScope` wrapper shows persistent amber banner when offline.
- **Progress tracking** (S40) — `_StaleBanner` warns when any ticker data is > 24h old. `_DashboardBanner` shows above/below SMA200 counts + last-updated time.

### Changed
- DB schema v10 — `tickers.nextEarningsAt` added

---

## [1.1.0] — 2025-07-14

### Added
- **Volume spike alerts** (S33) — fires when today's volume exceeds N× the 20-day
  average; configurable multiplier (1.5×–5.0×) in Settings. `VolumeCalculator`
  domain class with `averageVolume`, `isSpike`, `spikeRatio` methods. K/M volume
  formatting in notification body.
- **Alert history timeline** (S34) — `/alert-history` screen showing every fired alert
  with timestamp, symbol, type badge, and message. Swipe-to-dismiss acknowledges.
  `AlertHistoryTable` (Drift schema v9).
- **Export alert history** (S35) — export CSV or JSON from the history screen
  `PopupMenuButton`. Files saved to `getApplicationDocumentsDirectory()` with
  timestamp in filename. Copy path action in SnackBar. RFC 4180 CSV escaping.
- **Upcoming earnings indicator** (S36) — `_EarningsBadge` chip in the ticker detail
  AppBar title row. Fetches `calendarEvents` from Yahoo Finance quoteSummary API;
  red ≤3 days, orange ≤7 days, green otherwise. `TickerEntry.nextEarningsAt`
  nullable field; `isEarningsSoon()` helper. Drift schema v10.
- **Dynamic accent color** (S37) — 10-swatch color palette picker in Settings
  (Ocean Blue, Sky Blue, Teal, Green, Purple, Indigo, Deep Orange, Pink, Amber,
  Slate). Persisted as `AppSettings.accentColorValue` (Drift schema v11). Live
  `colorSchemeSeed` updates for both light and dark `MaterialApp` themes.
- **Deep-link support** (S38) — custom `crosstide://` URI scheme registered in
  Android `AndroidManifest.xml`. GoRouter `redirect` normalises
  `crosstide://ticker/AAPL` → `/ticker/AAPL`. `parseNotificationPayload` updated.
- **Crash log viewer** (S39) — `/crash-logs` route; full-screen monospace log viewer
  backed by `CrashLogService`. AppBar actions: copy to clipboard, delete with
  confirmation. Accessible via "View Crash Logs" button in Settings.

### Changed
- AppSettings now has 10 Equatable props (was 9) — added `accentColorValue`.
- TickerEntry now has 11 Equatable props (was 10) — added `nextEarningsAt`.
- Drift database schema bumped v9 → v10 → v11 with backward-compatible migrations.
- Settings screen: new Theme section (ThemeMode picker already present) extended
  with `_AccentColorPicker`; "View Crash Logs" diagnostic button added above footer.
- `MaterialApp.router` `colorSchemeSeed` driven by `accentColorProvider` (was
  hardcoded `const Color(0xFF0D47A1)`).
- `Color.value` → `.toARGB32()` and `withOpacity` → `withValues(alpha:)` to align
  with Flutter 3.27+ deprecations.

### Fixed
- `DailyCandle.volume` (`int`) properly converted to `double` throughout
  `VolumeCalculator` and notification service formatting.
- `AlertHistoryEntry` entity insertion order in `entities.dart` fixed after
  accidental overwrite.
- Package name in test imports corrected: `stock_alert` → `cross_tide`.

---

## [1.0.0] — 2025-07-08

### Added
- Initial release.
- SMA50 / SMA150 / SMA200 cross-up detection with idempotent alerting.
- Golden Cross / Death Cross alerts.
- Yahoo Finance provider — no API key required.
- Drift SQLite database with TTL cache.
- Riverpod state management, GoRouter navigation.
- Local notifications — Android channels + Windows desktop toasts.
- WorkManager background service (Android) + Timer (Windows, while app is running).
- Alert profiles: Aggressive / Balanced / Conservative / Custom presets.
- HealthCheckService — startup diagnostics (network, DB, data freshness).
- S&P 500 benchmark overlay chart (normalized %).
- SMA overlay lines on ticker-detail chart (SMA50/150/200, togglable).
- Volume bars below price chart.
- Time-range selector: 3M / 6M / 1Y / 2Y / 5Y.
- Watchlist groups — organize tickers by sector/strategy.
- Drag-to-reorder tickers; bulk add (comma-separated).
- Price target alerts — per-ticker, DB-backed, dismissable.
- Percentage-move alerts — per-ticker ±% threshold, ▲/▼ direction.
- Advanced mode toggle (hide/show expert settings).
- MACD + RSI indicator panels below chart.
- Bollinger Bands overlay.
- EMA overlay lines (12/26/50/200).
- GitHub Actions CI/CD: lint, test, build MSIX (Windows) + APK (Android), release.
- Pre-commit hooks: dart format, analyze, secret scan.
- Clean Architecture (domain / data / application / presentation) with strict
  layer-boundary enforcement.
- 147 passing unit tests (domain layer fully covered).


### Added
- **Volume spike alerts** (S33) — fires when today's volume exceeds N× the 20-day
  average; configurable multiplier (1.5×–5.0×) in Settings. `VolumeCalculator`
  domain class with `averageVolume`, `isSpike`, `spikeRatio` methods. K/M volume
  formatting in notification body.
- **Alert history timeline** (S34) — `/alert-history` screen showing every fired alert
  with timestamp, symbol, type badge, and message. Swipe-to-dismiss acknowledges.
  `AlertHistoryTable` (Drift schema v9).
- **Export alert history** (S35) — export CSV or JSON from the history screen
  `PopupMenuButton`. Files saved to `getApplicationDocumentsDirectory()` with
  timestamp in filename. Copy path action in SnackBar. RFC 4180 CSV escaping.
- **Upcoming earnings indicator** (S36) — `_EarningsBadge` chip in the ticker detail
  AppBar title row. Fetches `calendarEvents` from Yahoo Finance quoteSummary API;
  red ≤3 days, orange ≤7 days, green otherwise. `TickerEntry.nextEarningsAt`
  nullable field; `isEarningsSoon()` helper. Drift schema v10.
- **Dynamic accent color** (S37) — 10-swatch color palette picker in Settings
  (Ocean Blue, Sky Blue, Teal, Green, Purple, Indigo, Deep Orange, Pink, Amber,
  Slate). Persisted as `AppSettings.accentColorValue` (Drift schema v11). Live
  `colorSchemeSeed` updates for both light and dark `MaterialApp` themes.
- **Deep-link support** (S38) — custom `crosstide://` URI scheme registered in
  Android `AndroidManifest.xml`. GoRouter `redirect` normalises
  `crosstide://ticker/AAPL` → `/ticker/AAPL`. `parseNotificationPayload` updated.
- **Crash log viewer** (S39) — `/crash-logs` route; full-screen monospace log viewer
  backed by `CrashLogService`. AppBar actions: copy to clipboard, delete with
  confirmation. Accessible via "View Crash Logs" button in Settings.

### Changed
- AppSettings now has 10 Equatable props (was 9) — added `accentColorValue`.
- TickerEntry now has 11 Equatable props (was 10) — added `nextEarningsAt`.
- Drift database schema bumped v9 → v10 → v11 with backward-compatible migrations.
- Settings screen: new Theme section (ThemeMode picker already present) extended
  with `_AccentColorPicker`; "View Crash Logs" diagnostic button added above footer.
- `MaterialApp.router` `colorSchemeSeed` driven by `accentColorProvider` (was
  hardcoded `const Color(0xFF0D47A1)`).
- `Color.value` → `.toARGB32()` and `withOpacity` → `withValues(alpha:)` to align
  with Flutter 3.27+ deprecations.

### Fixed
- `DailyCandle.volume` (`int`) properly converted to `double` throughout
  `VolumeCalculator` and notification service formatting.
- `AlertHistoryEntry` entity insertion order in `entities.dart` fixed after
  accidental overwrite.
- Package name in test imports corrected: `stock_alert` → `cross_tide`.

---

## [1.0.0] — 2025-07-08

### Added
- Initial release.
- SMA50 / SMA150 / SMA200 cross-up detection with idempotent alerting.
- Golden Cross / Death Cross alerts.
- Yahoo Finance provider — no API key required.
- Drift SQLite database with TTL cache.
- Riverpod state management, GoRouter navigation.
- Local notifications — Android channels + Windows desktop toasts.
- WorkManager background service (Android) + Timer  (Windows, while app is running).
- Alert profiles: Aggressive / Balanced / Conservative / Custom presets.
- HealthCheckService — startup diagnostics (network, DB, data freshness).
- S&P 500 benchmark overlay chart (normalized %).
- SMA overlay lines on ticker-detail chart (SMA50/150/200, togglable).
- Volume bars below price chart.
- Time-range selector: 3M / 6M / 1Y / 2Y / 5Y.
- Watchlist groups — organize tickers by sector/strategy.
- Drag-to-reorder tickers; bulk add (comma-separated).
- Price target alerts — per-ticker, DB-backed, dismissable.
- Percentage-move alerts — per-ticker ±% threshold, ▲/▼ direction.
- Advanced mode toggle (hide/show expert settings).
- MACD + RSI indicator panels below chart.
- Bollinger Bands overlay.
- EMA overlay lines (12/26/50/200).
- GitHub Actions CI/CD: lint, test, build MSIX (Windows) + APK (Android), release.
- Pre-commit hooks: dart format, analyze, secret scan.
- Clean Architecture (domain / data / application / presentation) with strict
  layer-boundary enforcement.
- 147 passing unit tests (domain layer fully covered).
