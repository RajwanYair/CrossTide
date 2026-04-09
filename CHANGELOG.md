# Changelog

All notable changes to CrossTide are documented in this file.  
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).  
Versioning follows [Semantic Versioning](https://semver.org/).

---

## [Unreleased]

## [1.7.0] — 2026-04-10

### Added (S246–S260)
- **CopilotQueryResult** — AI/Copilot chat response: `QueryIntent`, `QueryCitation`, `CopilotQueryResult.isHighConfidence` (S246)
- **NewsArticle** — in-app news feed: `NewsSource`, `NewsSentimentHint`, `NewsArticle.isHighRelevance`, `NewsFeedConfig` (S247)
- **NaturalLanguageQuery** — natural-language ticker search: `NlQueryIntent`, `NlQueryConstraint`, `NaturalLanguageQuery.isParsed` (S248)
- **PatternRecognitionResult** — historical pattern matching: `PatternCategory`, `PatternFingerprint`, `PatternOutcome.winRate`, `PatternRecognitionResult.isHighConfidence` (S249)
- **PluginDescriptor** — plugin system metadata: `PluginType`, `PluginStatus`, `PluginVersion.parse()`, `PluginDescriptor.withStatus()` (S250)
- **PrometheusEndpointConfig** — Prometheus scrape endpoint config: `MetricsAuthScheme`, `PrometheusEndpointConfig.defaults()`, `requiresAuth` (S251)
- **PwaManifestConfig** — Progressive Web App manifest: `PwaDisplayMode`, `PwaOrientation`, `PwaShortcutAction`, `PwaManifestConfig.defaults()` (S252)
- **AlertConfidenceScore** — ML-estimated alert quality: `ConfidenceFactorType`, `ConfidenceFactor`, `AlertConfidenceScore.computeScore()`, `isHighConfidence` (S253)
- **NotificationTimingProfile** — smart timing: `EngagementWindow`, `EngagementObservation`, `withObservation()`, `derivePreferred()` (S254)
- **AlertHandlerConfig** — pluggable notification sinks: `AlertSinkType`, `AlertHandlerConfig.inApp()`, `requiresCredential` (S255)
- **CustomIndicatorFormula** — user-defined indicator DSL: `FormulaOperation`, `FormulaOperand`, `FormulaStep`, `CustomIndicatorFormula.outputName` (S256)
- **RestApiConfig** — in-app REST API server config: `RestApiAuthMode`, `RestApiRoute`, `RestApiConfig.defaults()`, `isPublic` (S257)
- **SubscriptionTier** — free/pro/enterprise tiers: `AppTier`, `TierFeature`, `SubscriptionTier.free/pro/enterprise()`, `hasFeature()`, `isActiveAt()` (S258)
- **ContainerComposeConfig** — dev stack service descriptors: `ContainerRuntime`, `ServiceRole`, `ContainerService.imageRef`, `ContainerComposeConfig.devStack()` (S259)
- **WidgetRefreshSchedule** — widget/tile refresh config: `RefreshTrigger`, `RefreshInterval`, `RefreshIntervalMinutes` extension, `isOverdueAt()` (S260)
- **PrometheusMetric** also now exported from barrel (was missing from S233 batch) (S233 fix)
- Updated architecture.svg: v1.7, 1543 tests, 160+ domain classes

### Tests
- 55 new tests in `test/domain/s246_s260_domain_batch_test.dart`
- Total: **1543 passing tests**, 0 analyze issues

## [1.6.0] — 2026-04-09

### Added (S231–S245)
- **NotificationSoundProfile** — per-ticker alert sound customization: `AlertSoundType`, `AlertSoundPriority`, `NotificationSoundProfile.silent()` factory (S231)
- **AndroidWidgetConfig** — home-screen widget config: `WidgetLayoutStyle`, `WidgetSignalBadge`, `AndroidWidgetConfig` (S232)
- **PrometheusMetric** — Prometheus exposition format: `PrometheusMetricType`, `PrometheusMetric`, `PrometheusMetricsSnapshot.toExpositionFormat()` (S233)
- **EmailDigestConfig** — newsletter digest config: `DigestFrequency`, `DigestSection`, `EmailDigestConfig.toggleEnabled()` (S234)
- **TraderBehaviorProfile** — behavioral profiling: `TraderStyle`, `RiskAppetite`, `TraderBehaviorClassifier` classifies scalper/momentum/position/reversal from observation history (S235)
- **SentimentScore** — news/social sentiment aggregation: `SentimentDirection`, `SentimentSource`, `SentimentDataPoint`, `SentimentScore`, `SentimentAggregator` with configurable time window (S236)
- **CommunityWatchlist** — community curated lists: `CommunityWatchlistTag`, `CommunityWatchlistVote`, `CommunityWatchlist` with `netScore` and `approvalRate` (S237)
- **LeaderboardEntry** — public opt-in leaderboard: `LeaderboardPeriod`, `LeaderboardMetric`, `LeaderboardEntry`, `LeaderboardRanker` with tie-aware ranking (S238)
- **StreamingQuoteSession** — WebSocket/SSE quote streaming model: `StreamingProtocol`, `StreamingSessionState`, `StreamingQuoteConfig`, `StreamingQuoteSession.isActive` (S239)
- **DeviceSyncManifest** — multi-device sync state: `SyncCategory`, `SyncStatus`, `DeviceSyncEntry`, `DeviceSyncManifest.pendingCategories` (S240)
- **CryptoAsset** — crypto-asset domain entity: `CryptoExchange`, `CryptoAsset`, `CryptoPrice.isPositiveDay` (S241)
- **ThemePreset** — 11 built-in themes via `ThemeRegistry.byId()`: midnight, dracula, nord, catppuccin, solarized_dark, terminal, ocean, light, solarized_light, high_contrast, rose_pine (S242)
- **TaxLotCalculator** — lot-matching: `TaxLotMethod` (FIFO/LIFO/avgCost/specificId), `TaxLot`, `TaxLotSaleResult.isLongTerm`, `TaxLotCalculator.compute()` (S243)
- **PortfolioOptimizer** — Monte Carlo portfolio optimization: `OptimizationObjective`, `AssetWeight`, `OptimizationResult`, `PortfolioOptimizer` (maxSharpe/minVol/riskParity/equalWeight) (S244)
- **CandleAnnotation** — chart overlay markers: `AnnotationShape`, `AnnotationKind`, `CandleAnnotation`, `CandleAnnotationBuilder.build()` with sorted output (S245)
- **release.yml** now builds ZIP + MSIX + APK — three artifacts per version tag
- Updated `architecture.svg` and `signal_chart.svg` to reflect 12-method consensus, 130+ domain classes, 1473 tests

### Tests
- 56 new tests in `test/domain/s231_s245_domain_batch_test.dart`
- Total: **1473 passing tests**, 0 analyze issues

## [1.6.0] — 2026-04-09

### Added (S231–S245)
- **NotificationSoundProfile** — per-ticker alert sound customization: `AlertSoundType`, `AlertSoundPriority`, `NotificationSoundProfile.silent()` factory (S231)
- **AndroidWidgetConfig** — home-screen widget config: `WidgetLayoutStyle`, `WidgetSignalBadge`, `AndroidWidgetConfig` (S232)
- **PrometheusMetric** — Prometheus exposition format: `PrometheusMetricType`, `PrometheusMetric`, `PrometheusMetricsSnapshot.toExpositionFormat()` (S233)
- **EmailDigestConfig** — newsletter digest config: `DigestFrequency`, `DigestSection`, `EmailDigestConfig.toggleEnabled()` (S234)
- **TraderBehaviorProfile** — behavioral profiling: `TraderStyle`, `RiskAppetite`, `TraderBehaviorClassifier` classifies scalper/momentum/position/reversal from observation history (S235)
- **SentimentScore** — news/social sentiment aggregation: `SentimentDirection`, `SentimentSource`, `SentimentDataPoint`, `SentimentScore`, `SentimentAggregator` with configurable time window (S236)
- **CommunityWatchlist** — community curated lists: `CommunityWatchlistTag`, `CommunityWatchlistVote`, `CommunityWatchlist` with `netScore` and `approvalRate` (S237)
- **LeaderboardEntry** — public opt-in leaderboard: `LeaderboardPeriod`, `LeaderboardMetric`, `LeaderboardEntry`, `LeaderboardRanker` with tie-aware ranking (S238)
- **StreamingQuoteSession** — WebSocket/SSE quote streaming model: `StreamingProtocol`, `StreamingSessionState`, `StreamingQuoteConfig`, `StreamingQuoteSession.isActive` (S239)
- **DeviceSyncManifest** — multi-device sync state: `SyncCategory`, `SyncStatus`, `DeviceSyncEntry`, `DeviceSyncManifest.pendingCategories` (S240)
- **CryptoAsset** — crypto-asset domain entity: `CryptoExchange`, `CryptoAsset`, `CryptoPrice.isPositiveDay` (S241)
- **ThemePreset** — 11 built-in themes via `ThemeRegistry.byId()`: midnight, dracula, nord, catppuccin, solarized_dark, terminal, ocean, light, solarized_light, high_contrast, rose_pine (S242)
- **TaxLotCalculator** — lot-matching: `TaxLotMethod` (FIFO/LIFO/avgCost/specificId), `TaxLot`, `TaxLotSaleResult.isLongTerm`, `TaxLotCalculator.compute()` (S243)
- **PortfolioOptimizer** — Monte Carlo portfolio optimization: `OptimizationObjective`, `AssetWeight`, `OptimizationResult`, `PortfolioOptimizer` (maxSharpe/minVol/riskParity/equalWeight) (S244)
- **CandleAnnotation** — chart overlay markers: `AnnotationShape`, `AnnotationKind`, `CandleAnnotation`, `CandleAnnotationBuilder.build()` with sorted output (S245)
- **release.yml** now builds ZIP + MSIX + APK — three artifacts per version tag
- Updated `architecture.svg` and `signal_chart.svg` to reflect 12-method consensus, 130+ domain classes, 1473 tests

### Tests
- 56 new tests in `test/domain/s231_s245_domain_batch_test.dart`
- Total: **1473 passing tests**, 0 analyze issues

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

### Added (S108–S132: Data Providers)
- **MarketWatch provider** (CSV scraping, rate-limited)
- **Coinpaprika provider** (crypto, no API key)
- **7 providers total** in fallback chains: Yahoo → AlphaVantage → Stooq → MarketWatch → Coinpaprika → Mock
- 14 provider tests

### Added (S133–S180: Domain Expansion)
- **SectorRotationScorer** — ranks sectors by normalized relative momentum (S133)
- **SectorCorrelationCalculator** — Pearson pairwise correlation (S134)
- **SectorHeatmapBuilder** — per-sector heatmap cells from ticker returns (S135)
- **PortfolioSummarizer** — `PortfolioHolding` + `PortfolioSummary` (sector weights, top gainer/loser) (S136–S137)
- **PortfolioRiskScorer** — composite 0–100 risk score (HHI concentration, volatility) (S138)
- **AlertRuleEvaluator** — declarative rule DSL: `IF sma50 > sma200 AND rsi < 30 THEN BUY` (S139–S141)
- **DividendCalculator** — trailing 12-month summary + portfolio income projection (S142–S144)
- **EarningsCalendarCalculator** — next earnings proximity with alert window (S145–S147)
- **MultiTimeframeAnalyzer** — daily/weekly/monthly candle aggregation + weighted confluence (S148–S150)
- **ReportBuilder** — structured report domain model (sections, rows, metadata) (S151–S153)
- **CostBasisCalculator** — FIFO-like average cost, sells reduce proportionally (S154–S156)
- **OptionsHeatmapBuilder** — call/put OI grouping, max-pain strike, put/call ratio (S157–S159)
- **NotificationChannelRanker** — priority × reliability scoring for 6 channel types (S160–S162)
- **ForexCalculator** — pip size, average daily range, spread, summary (S163–S165)
- **NewsRelevanceScorer** — ticker/title/recency/sentiment scoring + ranking (S166–S168)
- **WatchlistShareCodec** — `crosstide://share` deep-link encode/decode (S169–S171)
- **LocaleResolver** — 7 locales (en/he/es/de/fr/ja/zh) with fallback (S172–S174)
- **AccessibilityChecker** — WCAG AA checks (semantic label, tap target, contrast, tooltip) (S175–S177)
- **PerformanceScorer** — per-operation P95 scoring with EXCELLENT/GOOD/FAIR/POOR rating (S178–S180)
- 16 new domain barrel exports in `domain.dart`
- 150 new domain tests (16 test files)
- Test count: 1172 passing (was 1022)

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
