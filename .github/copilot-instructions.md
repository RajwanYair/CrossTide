# CrossTide — Copilot Workspace Instructions

## Project Overview
CrossTide is a cross-platform Flutter app (Android + Windows) that monitors stock tickers for **SMA crossover events** and **multi-method trading signals** (Micho Method, RSI, MACD, Bollinger Bands, Golden Cross) with a **Consensus Engine** that fires local notifications when methods agree. Uses Yahoo Finance — no API key required.

## Architecture
Clean Architecture with strict layer boundaries. Dependencies flow inward only.

| Layer | Path | Depends On | Never Depends On |
|-------|------|------------|------------------|
| **Domain** | `lib/src/domain/` | Nothing (pure Dart) | Data, Application, Presentation |
| **Data** | `lib/src/data/` | Domain | Application, Presentation |
| **Application** | `lib/src/application/` | Domain, Data | Presentation |
| **Presentation** | `lib/src/presentation/` | All layers | — |

## Tech Stack
- **State Management**: Riverpod (not Bloc, not Provider)
- **Navigation**: GoRouter
- **Database**: Drift (SQLite) — generated code in `*.g.dart`
- **HTTP**: Dio with `IOHttpClientAdapter` (not deprecated `onHttpClientCreate`)
- **Notifications**: flutter_local_notifications
- **Background**: WorkManager (Android), Timer.periodic (Windows)
- **Charts**: fl_chart
- **Secrets**: flutter_secure_storage (never hardcode API keys)
- **Java SDK**: 21 (Temurin LTS) — in both Gradle and CI

## Trading Methods & Consensus Engine
- **Micho Method** (primary): BUY when price crosses above MA150 while MA150 is flat/rising within ~5%; SELL when price crosses below MA150.
- **RSI Method**: BUY when RSI exits oversold (<30→≥30); SELL when exits overbought (>70→≤70).
- **MACD Crossover**: BUY when MACD crosses above signal; SELL when below.
- **Bollinger Bands**: BUY when price crosses above lower band; SELL when below upper band.
- **Stochastic Method**: BUY when %K crosses above %D from oversold; SELL from overbought.
- **OBV Method**: BUY on positive OBV divergence; SELL on negative divergence.
- **ADX Method**: BUY on strong trend with +DI > −DI; SELL with −DI > +DI.
- **CCI Method**: BUY when CCI exits oversold (crosses above −100); SELL when exits overbought.
- **SAR Method**: BUY/SELL on Parabolic SAR flip direction.
- **Williams %R Method**: BUY when %R exits oversold (crosses above −80); SELL when exits overbought.
- **MFI Method**: BUY when MFI exits oversold (<20→≥20); SELL when exits overbought (>80→≤80).
- **SuperTrend Method**: BUY/SELL on SuperTrend direction flip.
- **Consensus Engine**: GREEN (consensus BUY) = Micho BUY + ≥1 other BUY; RED (consensus SELL) = Micho SELL + ≥1 other SELL. Micho is always the primary method.
- All methods produce `MethodSignal` objects (extensible pattern in `micho_method_detector.dart`).
- New methods: implement a detector class → return `MethodSignal` → wire into `RefreshService` → add to `ConsensusEngine`.

## Code Conventions
- Dart 3.11+, null-safe, prefer `const` constructors
- Single quotes for strings
- 80-char line length (`dart format`)
- Domain entities use `Equatable` — no mutable state in domain layer
- Generated files (`*.g.dart`, `*.freezed.dart`) are gitignored from search
- Use `library;` directive when file has doc comments above imports
- Explicit loop variable types required: `for (final MyType x in list)` — not `for (final x in list)`
- Notifier mutation methods must use a descriptive verb, not `set` (e.g. `applyFilter`, `update`)

## Quality Gates — Zero Tolerance
- **`flutter analyze --fatal-infos` must report zero issues** — zero errors, zero warnings, zero infos.
- **`dart format --set-exit-if-changed lib test` must exit 0** — always format `lib test`, never `.`.
- **No `// ignore:` or `// ignore_for_file:` pragmas anywhere in `lib/` or `test/`.** Resolve the lint with a real code change.
- **No `TODO` / `FIXME` / `HACK` comments in production code.** Track work in GitHub Issues.
- **No suppressed lints, no waivers, no skipped tests.**

## Key Business Rules
- **Cross-up rule**: `close[t-1] <= SMA200[t-1] AND close[t] > SMA200[t]`
- Alerts are **idempotent** — same cross-up event fires only once (candle-date dedup)
- `AlertStateMachine` governs state transitions (below/above/alerted)
- Quiet hours suppress notifications but still update state
- Consensus alerts require Micho + at least one other method to agree

## Testing & Coverage
- Domain logic must have unit tests (`test/domain/`)
- **Domain coverage: 100%** — enforced in CI
- **Overall coverage target: ≥ 90%** — do not merge below this
- Use `AppDatabase.forTesting()` for in-memory DB tests
- `MockMarketDataProvider` provides deterministic synthetic data
- Run: `flutter test --coverage --timeout 30s`

Currently: **~3175+ passing tests**, 0 analyze issues.

## Build & Run
```bash
flutter pub get
dart run build_runner build --delete-conflicting-outputs  # Drift codegen
flutter run -d windows    # Desktop
flutter run -d <device>   # Android
flutter analyze --fatal-infos   # Static analysis (must be zero issues)
dart format lib test            # Formatting (scope to lib/test only)
```

## Important Files
- `lib/main.dart` — Entry point, service wiring
- `lib/src/domain/entities.dart` — Core types: DailyCandle, TickerAlertState, AlertType (28 values), AppSettings
- `lib/src/domain/micho_method_detector.dart` — Micho Method + MethodSignal base class
- `lib/src/domain/consensus_engine.dart` — Multi-method consensus BUY/SELL engine (12 methods)
- `lib/src/domain/rsi_method_detector.dart` — RSI oversold/overbought exit signals
- `lib/src/domain/macd_method_detector.dart` — MACD/Signal crossover signals
- `lib/src/domain/bollinger_method_detector.dart` — Bollinger Band breakout signals
- `lib/src/domain/stochastic_method_detector.dart` — Stochastic %K/%D crossover signals
- `lib/src/domain/obv_method_detector.dart` — OBV divergence signals
- `lib/src/domain/adx_method_detector.dart` — ADX trend strength + DI crossover signals
- `lib/src/domain/cci_method_detector.dart` — CCI oversold/overbought exit signals
- `lib/src/domain/sar_method_detector.dart` — Parabolic SAR flip signals
- `lib/src/domain/williams_r_method_detector.dart` — Williams %R exit signals (S226)
- `lib/src/domain/mfi_method_detector.dart` — MFI oversold/overbought exit signals (S228)
- `lib/src/domain/supertrend_method_detector.dart` — SuperTrend direction flip signals (S229)
- `lib/src/domain/domain.dart` — Barrel export (520 domain classes)
- `lib/src/domain/alert_rule_evaluator.dart` — Declarative alert rule DSL (S139–S141)
- `lib/src/domain/dividend_calculator.dart` — Dividend tracking + income projection (S142–S144)
- `lib/src/domain/earnings_calendar_calculator.dart` — Earnings proximity detection (S145–S147)
- `lib/src/domain/multi_timeframe_analyzer.dart` — Daily/weekly/monthly candle aggregation (S148–S150)
- `lib/src/domain/forex_calculator.dart` — Forex pip/spread/range analysis (S163–S165)
- `lib/src/domain/watchlist_share_codec.dart` — Deep-link share URL encode/decode (S169–S171)
- `lib/src/domain/locale_resolver.dart` — i18n locale resolution (S172–S174)
- `lib/src/domain/market_holiday_calendar.dart` — Exchange trading-holiday DB (S276)
- `lib/src/domain/price_trigger_rule.dart` — Declarative price-level triggers (S277)
- `lib/src/domain/onboarding_state.dart` — First-run checklist state (S278)
- `lib/src/domain/app_diagnostic_report.dart` — Runtime app health snapshot (S279)
- `lib/src/domain/ticker_correlation_cluster.dart` — Pairwise ticker clustering (S280)
- `lib/src/domain/smart_alert_schedule.dart` — Engagement-driven delivery windows (S281)
- `lib/src/domain/portfolio_backtest_result.dart` — Multi-ticker backtest equity curve (S282)
- `lib/src/domain/screener_preset.dart` — Named screener presets (S283)
- `lib/src/domain/digest_content_block.dart` — Typed digest content layout (S284)
- `lib/src/domain/report_schedule.dart` — Scheduled report delivery (S285)
- `lib/src/domain/watchlist_snapshot.dart` — Point-in-time watchlist capture (S286)
- `lib/src/domain/sync_conflict_resolver.dart` — Device-sync conflict resolution (S287)
- `lib/src/domain/indicator_alert_config.dart` — Per-indicator alert thresholds (S288)
- `lib/src/domain/user_annotation.dart` — Entity annotations with color + tags (S289)
- `lib/src/domain/feedback_submission.dart` — In-app user feedback (S290)
- `lib/src/domain/benchmark_index_config.dart` — Configurable benchmark index presets (S306)
- `lib/src/domain/signal_calibration_record.dart` — Per-method signal accuracy + reliability (S307)
- `lib/src/domain/portfolio_rebalance_target.dart` — Rebalance drift tolerance (S308)
- `lib/src/domain/paper_trade_order.dart` — Simulated paper trading orders (S309)
- `lib/src/domain/global_market_snapshot.dart` — Multi-market snapshot (S310)
- `lib/src/domain/market_sentiment_index.dart` — Composite sentiment index (S311)
- `lib/src/domain/ticker_fundamentals.dart` — P/E, EPS, market cap, dividend yield (S312)
- `lib/src/domain/risk_budget_config.dart` — Risk budget per strategy (S313)
- `lib/src/domain/alert_notification_log.dart` — Alert delivery audit trail (S314)
- `lib/src/domain/holding_cost_analysis.dart` — Unrealised P&L + cost basis (S315)
- `lib/src/domain/strategy_rule_set.dart` — Rule-based strategy config (S316)
- `lib/src/domain/trading_journal_entry.dart` — Trade journal + TraderEmotion/TradeOutcome (S317)
- `lib/src/domain/data_quality_flag.dart` — Data quality flags + severity (S318)
- `lib/src/domain/watchlist_performance_summary.dart` — Watchlist-level perf aggregation (S319)
- `lib/src/domain/order_flow_imbalance.dart` — Cumulative order flow imbalance (S320)
- `lib/src/domain/corporate_action_event.dart` — Splits, mergers, delistings (S321)
- `lib/src/domain/system_health_alert.dart` — Infrastructure health alerts (S322)
- `lib/src/domain/price_momentum_snapshot.dart` — Momentum direction + strength (S323)
- `lib/src/domain/watchlist_group_membership.dart` — Multi-group membership registry (S324)
- `lib/src/domain/ticker_import_session.dart` — Bulk import tracking (S325)
- `lib/src/domain/performance_metric_snapshot.dart` — Latency regression tracking (S326)
- `lib/src/domain/insider_trade_record.dart` — SEC Form 4 insider trades (S327)
- `lib/src/domain/geographic_exposure_map.dart` — Regional portfolio exposure (S328)
- `lib/src/domain/feature_flag_entry.dart` — Runtime feature flags registry (S329)
- `lib/src/domain/user_achievement.dart` — Gamification achievement system (S330)
- `lib/src/domain/alert_rate_limit_record.dart` — Per-symbol/method rate limiting (S331)
- `lib/src/domain/chart_theme_profile.dart` — Chart color theming presets (S332)
- `lib/src/domain/volatility_surface.dart` — Multi-point HV/IV surface (S333)
- `lib/src/domain/ticker_search_response.dart` — TickerQueryResult + TickerSearchResponse (S334)
- `lib/src/domain/audit_log_entry.dart` — SystemAuditEntry audit trail (S335)
- `lib/src/domain/ticker_tag_registry.dart` — User-defined color+emoji ticker tags (S336)
- `lib/src/domain/economic_indicator_release.dart` — Macro releases CPI/GDP/NFP (S337)
- `lib/src/domain/market_depth_snapshot.dart` — Level-2 order book snapshot (S338)
- `lib/src/domain/trading_halt_event.dart` — Circuit-breaker & regulatory halts (S339)
- `lib/src/domain/index_composite_snapshot.dart` — ETF/index constituent holdings (S340)
- `lib/src/domain/order_routing_preference.dart` — Smart/DMA/TWAP/VWAP routing + slippage (S501-S502)
- `lib/src/domain/execution_venue_config.dart` — Exchange/ECN/dark-pool venue config (S503)
- `lib/src/domain/market_microstructure_snapshot.dart` — Spread/depth/mid-price snapshot (S515)
- `lib/src/domain/compliance_rule_violation.dart` — Severity-scored compliance breach (S516)
- `lib/src/domain/esg_score_snapshot.dart` — E/S/G composite scores (S529)
- `lib/src/domain/yield_curve_snapshot.dart` — 2Y/5Y/10Y/30Y rates with inversion/flat flags (S533)
- `lib/src/domain/macro_regime_indicator.dart` — Goldilocks/Stagflation/Deflation/Recession phases (S535)
- `lib/src/domain/intrinsic_value_estimate.dart` — DCF/Graham blend with margin of safety (S545)
- `lib/src/domain/app_update_manifest.dart` — OTA update metadata (S546)
- `lib/src/domain/remote_config_snapshot.dart` — Runtime remote feature config (S547)
- `lib/src/domain/crash_report_summary.dart` — Aggregated crash analytics (S548)
- `lib/src/domain/ab_test_assignment.dart` — A/B experiment variant assignment (S549)
- `lib/src/domain/user_cohort_definition.dart` — User segmentation cohort (S550)
- `lib/src/domain/signal_funnel_summary.dart` — Signal detection funnel stages (S551)
- `lib/src/domain/signal_generator_config.dart` — Composite signal generator with MethodWeightEntry (S552)
- `lib/src/domain/signal_divergence_alert.dart` — Price/indicator divergence with DivergenceDirection (S553)
- `lib/src/domain/app_health_monitor.dart` — Runtime health events with HealthEvent + HealthEventSeverity (S554)
- `lib/src/domain/data_lineage_record.dart` — Data provenance tracking with DataQualityTier enum (S555)
- `lib/src/domain/network_quality_snapshot.dart` — Latency/jitter measurement with NetworkQualityRating (S556)
- `lib/src/domain/backtest_sensitivity_result.dart` — Parameter sensitivity grid with SensitivityCell (S557)
- `lib/src/domain/cache_warmup_config.dart` — Cache pre-warming config with WarmupStrategy enum (S558)
- `lib/src/domain/price_gap_analysis.dart` — Gap classification with PriceGapType enum (S559)
- `lib/src/domain/portfolio_health_score.dart` — 0–100 composite score with PortfolioHealthComponent (S560)
- `lib/src/domain/rebalance_execution.dart` — Rebalance trade plan with RebalanceLeg + RebalanceLegStatus (S561)
- `lib/src/domain/technical_alert_summary.dart` — Roll-up of active technical alerts per ticker (S562)
- `lib/src/domain/earnings_surprise_record.dart` — EPS actual vs consensus with EarningsSurpriseDirection (S563)
- `lib/src/domain/analyst_rating_change.dart` — Broker upgrade/downgrade with RatingChangeDirection + AnalystRatingTier (S564)
- `lib/src/domain/index_rebalance_event.dart` — Index reconstitution events with IndexRebalanceType (S565)
- `lib/src/domain/short_interest_snapshot.dart` — Short % float + days-to-cover snapshot (S566)
- `lib/src/domain/dividend_cut_alert.dart` — Dividend change alerts with DividendChangeType enum (S567)
- `lib/src/domain/stock_split_event.dart` — Stock split details with StockSplitType (forward/reverse) (S568)
- `lib/src/domain/options_expiry_date.dart` — Options expiry schedule with OptionsExpiryStyle enum (S569)
- `lib/src/domain/implied_move_estimate.dart` — Options-implied earnings move estimate (S570)
- `lib/src/domain/institutional_ownership_entry.dart` — 13F ownership change with OwnershipChangeDirection (S571)
- `lib/src/domain/sec_filing_entry.dart` — SEC EDGAR filing metadata with SecFilingType enum (S572)
- `lib/src/domain/regime_switch_alert.dart` — Macro regime transition alert (S573)
- `lib/src/domain/cross_asset_correlation.dart` — Equity/bond/commodity correlations with CorrelationAssetClass (S574)
- `lib/src/domain/market_impact_model.dart` — Almgren-Chriss/square-root/Kyle impact with MarketImpactModelType (S575)
- `lib/src/domain/data_ingestion_event.dart` — Single data ingestion event log (S576)
- `lib/src/domain/alert_channel_metrics.dart` — Delivery channel aggregate metrics (S577)
- `lib/src/domain/sector_rotation_signal.dart` — Cross-sector capital rotation with SectorRotationDirection (S578)
- `lib/src/domain/context_aware_signal.dart` — Enriched signal with SignalContextSource (S579)
- `lib/src/domain/data_freshness_policy.dart` — Data freshness enforcement with StaleDataPolicy (S580)
- `lib/src/domain/backtest_parameter_grid.dart` — Multi-dimensional grid search with GridAxis + GridCell (S581)
- `lib/src/domain/portfolio_turnover_metric.dart` — Annualised portfolio turnover metric (S582)
- `lib/src/domain/market_liquidity_rating.dart` — Composite liquidity score with LiquidityRatingGrade (S583)
- `lib/src/domain/volatility_regime_alert.dart` — HV regime transition with VolatilityRegimeTransition (S584)
- `lib/src/domain/news_event_entry.dart` — Structured news event with NewsEventSentiment (S585)
- `lib/src/domain/trade_idea_record.dart` — Trade thesis with TradeIdeaConviction + TradeIdeaDirection (S586)
- `lib/src/domain/user_alert_preference.dart` — Per-user alert delivery preferences (S587)
- `lib/src/domain/watchlist_health_check.dart` — Watchlist data freshness with WatchlistHealthStatus (S588)
- `lib/src/domain/platform_build_info.dart` — OS/Flutter/Dart version snapshot (S589)
- `lib/src/domain/quote_quality_metric.dart` — Quote freshness and spread quality (S590)
- `lib/src/domain/real_time_session_config.dart` — WebSocket/SSE session config with RealTimeTransport (S591)
- `lib/src/domain/ticker_lifecycle_event.dart` — Ticker lifecycle events with TickerLifecycleEventType (S592)
- `lib/src/domain/market_cap_tier_classifier.dart` — Market cap tier with CapSizeTier enum (S593)
- `lib/src/domain/heat_map_color_scale.dart` — Heat-map gradient with ColorStop value/hex pairs (S594)
- `lib/src/domain/feature_flag_override.dart` — Runtime flag override with auditor + timestamp (S595)
- `lib/src/domain/onboarding_checklist_item.dart` — First-run checklist with OnboardingItemStatus (S596)
- `lib/src/domain/quick_action_config.dart` — Home-screen quick action with QuickActionPlatform (S597)
- `lib/src/domain/widget_refresh_policy.dart` — Home-screen widget refresh with WidgetRefreshTrigger (S598)
- `lib/src/domain/platform_performance_budget.dart` — Frame-time and jank detection thresholds (S599)
- `lib/src/domain/app_locale_override.dart` — Per-user locale override (S600)
- `lib/src/data/database/database.dart` — Drift schema v15 (regenerate after changes)
- `lib/src/application/refresh_service.dart` — Orchestrates all 12 method evaluations + consensus
- `lib/src/presentation/providers.dart` — All Riverpod providers
- `docs/COPILOT_GUIDE.md` — Detailed coding guide and architecture decisions

## Known Anti-Patterns (from S501–S600)

- **`$` in test names**: use raw string `r'price >= $1M'` — not `'price >= $1M'` (GH #21, fixed 65aa724)
- **IEEE 754 boundary**: avoid test data that arithmetically hits a threshold exactly, e.g., `(4.7-4.5)*100 == 20.000...018`, not `20.0` (GH #22, fixed 8ab88dc)
- **Barrel deep-prefix pitfall**: `market_microstructure` (market_m) must go AFTER `market_impact` (market_i) — compare char-by-char past the shared prefix (GH #23, fixed 65aa724)
- **Naming conflicts new**: `MarketRegimeType` → `RegimeClassificationType`; `ProviderHealthStatus` → `DataProviderHealthStatus` (GH #24, docs a3849d0)
- **PowerShell `$` interpolation in double-quoted here-strings**: `@"..."@` interpolates `$1`, `$2` as empty strings — use `@'...'@` (single-quoted) for any Node.js/regex scripts containing `$` back-references (GH #25, fixed S551-S600 session)
- **`fix_const` regex pattern**: never pipe a `String.replace()` result via a PowerShell double-quoted here-string if the replacement contains `$1`/`$2` — the variables are silently expanded to empty, corrupting all replaced files

## Agents, Prompts & Skills
- **`data-integration`** agent — add/modify market data providers
- **`domain-feature`** agent — add/modify domain entities, SMA calc, alert state machine
- **`reviewer`** agent — architecture + quality audit (read-only)
- `/add-data-provider` prompt — step-by-step guide for new providers
- `/add-domain-feature` prompt — step-by-step guide for new domain rules
- `/add-trading-method` prompt — step-by-step guide for new MethodSignal-based methods
- `/generate-tests` prompt — generate domain unit tests
- `/health-check` prompt — full project quality gate run
- `/consensus-check` prompt — verify consensus engine coverage and wiring
- `add-trading-method` skill — full workflow for creating a new method detector
