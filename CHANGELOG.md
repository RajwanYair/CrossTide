# Changelog

All notable changes to CrossTide are documented in this file.  
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).  
Versioning follows [Semantic Versioning](https://semver.org/).

---

## [Unreleased]

## [2.18.0] - 2026-04-12
### Added — S516–S530 Risk, Compliance & ESG Domain Entities
- S516 `ComplianceRuleViolation` — detected rule breach with severity 1–10 + resolution state
- S517 `WashSaleDetection` — IRS wash-sale 30-day window + disallowed loss
- S518 `PositionLimitBreach` — position size limit overage with excess % calc
- S519 `StressTestScenario` — parameterised stress scenario (equity/rate/vol shocks)
- S520 `RiskFactorExposure` — factor beta + contribution % to portfolio risk
- S521 `RegulatoryReportConfig` — SEC/FINRA/ESMA filing config with deadline
- S522 `AmlFlagRecord` — AML screening flag with severity + cleared state
- S523 `ConcentrationRiskAlert` — holding weight threshold breach with excess %
- S524 `CounterpartyRiskScore` — credit grade (AAA–defaulted) + PD + exposure
- S525 `LeverageUtilization` — gross leverage ratio + margin utilization %
- S526 `DrawdownRecoveryPlan` — recovery trajectory with required return estimate
- S527 `AuditTrailHash` — cryptographic audit chain hash with tamper detection
- S528 `PreTradeCheckResult` — pre-trade risk gate (passed/softWarning/hardBlocked)
- S529 `EsgScoreSnapshot` — E/S/G composite scores with provider attribution
- S530 `CarbonExposureEstimate` — Scope 1/2/3 CO2e + weighted carbon intensity

## [2.17.0] - 2026-04-12
### Added — S501–S515 Market Microstructure & Trading Operations Domain Entities
- S501 `OrderRoutingPreference` — smart/direct/DMA/algo order routing config with slip tolerance
- S502 `SlippageEstimate` — market impact + spread-cost slippage model per order
- S503 `ExecutionVenueConfig` — exchange/ECN/dark-pool venue config with fee schedule
- S504 `DarkPoolIndicator` — dark pool volume %, block trades, notional, flow direction
- S505 `TickSizeRule` — exchange tick-size rules with price-range applicability
- S506 `OrderBookImbalance` — bid/ask volume imbalance ratio from order book levels
- S507 `LatencyArbitrageFlag` — inter-venue price discrepancy latency arb detection
- S508 `FillQualityReport` — fill rate, realised slippage, reference mid-price analysis
- S509 `CircuitBreakerStatus` — exchange circuit-breaker level/halt-duration/resume state
- S510 `CrossListingEntry` — primary/foreign ticker cross-listing with ADS conversion ratio
- S511 `CustodyAccountSummary` — custodian account cash/securities/margin snapshot
- S512 `SettlementCycleConfig` — T+N settlement config with DvP flag
- S513 `ClearingHouseMargin` — initial/maintenance/stress margin with concentration surcharge
- S514 `TradeConfirmationRecord` — immutable trade confirmation with gross/net value
- S515 `MarketMicrostructureSnapshot` — live bid/ask/mid/spread with tight-spread detection

---

## [2.16.0] — 2026-04-12

### Added — Domain Entities (S496–S500)
- **ReportDeliveryReceipt** — scheduled report delivery acknowledgement: `ReportDeliveryMethod` (4 methods); `hasFailed`, `hasFailureReason`, `isFastDelivery` (≤2s) (S496)
- **PdfExportConfig** — PDF export layout and content config: `PdfPageOrientation`; `isLandscape`, `hasWatermark`, `isMultiPage` (S497)
- **ScheduledReportResult** — report job execution outcome: `failedDeliveries`, `deliveryRatePercent`, `isFullSuccess`, `hasErrors` (S498)
- **ExportFormatPreference** — user export file format preference: `ExportFileFormat` (5 formats); `isCsvOrXlsx`, `isPdf` (S499)
- **WidgetDataFeed** — home-screen widget data feed config: `WidgetRefreshMode` (4 modes); `isRealtime`, `isHighPriority`, `isFrequentRefresh` (S500)

---

## [2.15.0] — 2026-04-12

### Added — Domain Entities (S481–S495)
- **StrategyComparisonResult** — side-by-side strategy return/Sharpe comparison: `compareOutperforms`, `returnDeltaPercent`, `compareHasBetterSharpe` (S481)
- **WalkForwardSegment** — single in/out-of-sample walk-forward segment: `trainDays`, `testDays`, `isProfitable`, `isGoodFit` (S482)
- **MonteCarloPercentile** — percentile result from Monte Carlo simulation: `isProfitable`, `isTopDecile` (≥90), `isBottomDecile` (≤10) (S483)
- **BacktestEquityPoint** — equity-curve data point with drawdown: `isDrawdown`, `isDeepDrawdown` (≥20%), `isProfitable` (S484)
- **ExitRuleConfig** — declarative trade exit rule: `ExitTriggerType` (5 types); `isStopBased`, `isTimeBased`, `hasDescription` (S485)
- **TutorialStepState** — in-app tutorial step completion: `isFirstStep`, `wasEngaged`, `isDismissed` (S486)
- **FeatureTourConfig** — multi-step in-app feature walkthrough: `isSingleStep`, `isMultiStep`, `repeatOnVersionUpgrade` (S487)
- **AppNotificationBadge** — app section badge counts: `hasItems`, `isHighCount` (≥10), `shouldDisplay` (S488)
- **UserOnboardingProgress** — first-run onboarding checklist: `progressPercent`, `isStarted`, `isComplete` (S489)
- **ContextualHelpEntry** — contextual help/tooltip entry: `hasLearnMoreLink`, `isShortBody` (≤140 chars) (S490)
- **DefiPoolSnapshot** — DeFi liquidity pool TVL/APY snapshot: `isHighYield` (≥20%), `isHighLiquidity` (≥1M USD), `isActivePool` (S491)
- **NftFloorPriceEntry** — NFT collection floor price data: `isBlueChip` (≥1 ETH), `isHighVolume` (≥100 ETH/24h), `hasLargeHolder` (S492)
- **StakingRewardRecord** — validator staking reward record: `isHighApr` (≥10%), `isPending`, `hasSignificantReward` (S493)
- **CacheEvictionPolicy** — cache TTL and eviction strategy config: `EvictionStrategy` (4 types); `isAggressiveEviction`, `isLruOrLfu` (S494)
- **DatabaseMigrationLog** — DB schema migration audit log: `MigrationStatus` (5 states); `isSuccess`, `isFailed`, `hasError`, `isSlowMigration` (>5s) (S495)

---

## [2.14.0] — 2026-04-12

### Added — Domain Entities (S466–S480)
- **SignalExpiryConfig** — method signal TTL and invalidation rules: `isAggressiveExpiry`, `requiresCandelAlignment` (S466)
- **MethodOverrideConfig** — per-ticker method enable/disable/threshold override: `MethodOverrideMode` (3 modes); `isDisabled`, `hasThresholdAdjustment`, `hasReason` (S467)
- **AlertEscalationChain** — multi-channel escalation with delay: `channelCount`, `isMultiChannel`, `isAggressiveEscalation` (<300s) (S468)
- **ConsensusOverrideRecord** — manual consensus signal override audit: `isEscalated` (neutral→buy/sell), `isDemoted` (buy/sell→neutral), `hasReason` (S469)
- **SignalReplayCursor** — historical replay session position: `progressPercent`, `isComplete`, `isRunning` (S470)
- **FeedSubscriptionConfig** — market data feed subscription: `FeedProtocol` (4 protocols); `isStreaming`, `isPolling`, `symbolCount` (S471)
- **QuoteCacheEntry** — bid/ask/last quote with TTL: `midPrice`, `isStale(nowMs)`, `hasSpread` (S472)
- **DataSyncCheckpoint** — data source sync progress: `hasPendingChanges`, `isUpToDate` (S473)
- **DataSchemaVersion** — DB schema migration metadata: `requiresMigration`, `hasDescription` (S474)
- **DataProviderHealthStatus** — provider health level + latency: `DataProviderHealthLevel` (3 levels); `isHealthy`, `isUnavailable`, `hasError`, `isHighLatency` (>2000ms) (S475)
- **AlphaDecayEstimate** — method alpha half-life estimate: `decayPercent`, `isDecayed` (<20% residual), `isViable` (residual>20bps) (S476)
- **InformationRatioResult** — active return vs tracking error: `isPositiveAlpha`, `isGood` (≥0.5), `isExcellent` (≥1.0) (S477)
- **CalmarRatioResult** — return over max drawdown: `isAcceptable` (≥0.5), `isStrong` (≥1.0), `isNegativeReturn` (S478)
- **OmegaRatioResult** — probability-weighted gain/loss ratio: `isFavorable` (>1.0), `isStrong` (≥2.0) (S479)
- **TrackingErrorResult** — portfolio vs benchmark deviation: `isLowTracking` (<2%), `isHighlyCorrelated` (≥0.95), `isActivelyManaged` (≥5%) (S480)

---

## [2.13.0] — 2026-04-12

### Added — Domain Entities (S451–S465)
- **TaxYearSummary** — capital gains/losses summary: `netShortTerm`, `netLongTerm`, `totalNetGain`, `hasNetLoss` (S451)
- **PriceLevelCluster** — volume-concentration price cluster: `isStrongLevel` (≥3 touches), `isHighConcentration` (≥15%) (S452)
- **MarketRegimeClassification** — regime classifier result: `RegimeClassificationType` (5 types); `isTrending`, `isRangebound`, `isHighConfidence` (S453)
- **PortfolioMarginCall** — leverage margin call event: `marginDeficit`, `isUrgent` (≥10% deficit), `isActive` (S454)
- **VolatilityForecast** — volatility forecast: `VolatilityForecastMethod` (4 methods); `isHighVol` (≥40%), `isVolIncreasing` (S455)
- **BetaCalculationResult** — regression beta result: `isHighBeta` (>1.5), `isNegativeBeta`, `isStatisticallySignificant` (R²≥0.7) (S456)
- **ConditionalOrderEntry** — trigger-activated order: `ConditionalOrderTrigger` (5 types); `isPriceTrigger`, `isSellOrder` (S457)
- **OrderExecutionSummary** — order execution result: `OrderExecutionStatus` (5 statuses); `isFullyFilled`, `fillRate`, `totalCost` (S458)
- **BracketOrderConfig** — entry/target/stop bracket config: `riskRewardRatio`, `isFavorableRiskReward` (≥2:1) (S459)
- **SectorValuationSnapshot** — sector PE/PB valuation: `isExpensive` (PE>25), `isCheap` (PE<12), `isGrowthSector`, `isHighYield` (S460)
- **MarketBreadthAlert** — breadth threshold trigger: `BreadthAlertType` (5 types); `isBullish`, `deviationFromThreshold` (S461)
- **MacroSurpriseIndex** — macro consensus surprise composite: `MacroSurpriseDirection`; `isSignificant` (|score|≥25) (S462)
- **TickChartConfig** — non-time chart config: `TickChartType` (4 types); `isRenko`, `isVolumeBased` (S463)
- **RangeExpansionSignal** — ATR range expansion signal: `isSignificant` (≥2×), `isExtreme` (≥3×) (S464)
- **UserWatchlistPreference** — per-watchlist display + notification prefs: `hasCustomDisplay`, `isFullyEnabled` (S465)

### Tests
- Added `test/domain/s451_s465_domain_batch_test.dart` — 45 tests covering all 15 new domain entities.

---


### Added — Domain Entities (S441–S450)
- **UserInsightCard** — personalised dashboard card: `InsightCardType` (5 types); `isWarning`, `isHighPriority` (≥0.7), `isActionable` (visible + high-prio) (S441)
- **UserPreferenceProfile** — UI preference profile: `ColorSchemePreference` (system/light/dark/highContrast); `hasExplicitTheme`, `prefersDark` (S442)
- **ChartAnnotationPreset** — saved chart annotation: `AnnotationPresetType` (5 types); `isLine`, `isThickLine` (≥2px) (S443)
- **SearchHistoryEntry** — ticker search history record: `hasSelection`, `hasResults` (S444)
- **WatchlistQuickFilter** — named watchlist filter preset: RSI thresholds, signal requirements, sector constraint; `hasSignalFilter`, `hasSectorFilter`, `rsiRange` (S445)
- **UserSessionMetric** — per-session engagement metrics: `isLongSession` (>300s), `hasAlertEngagement`, `avgSecondsPerScreen` (S446)
- **FeatureUsageRecord** — feature adoption tracking: `isWidelyAdopted` (≥100 users), `hasUsage`, `activationsPerUser` (S447)
- **AppRuntimeContext** — runtime environment snapshot: `isAndroid`, `isWindows`, `isReleaseBuild` (S448)
- **SpreadSnapshot** — bid-ask spread snapshot: `spread`, `spreadBps`, `midPrice`, `isTight` (≤5 bps) (S449)
- **DrawdownBudget** — drawdown tolerance config: `DrawdownBudgetLevel` (4 levels); `isBreached`, `remainingBudget`, `isCritical` (S450)

### Tests
- Added `test/domain/s441_s450_domain_batch_test.dart` — 36 tests covering all 10 new domain entities.

---


### Added — Domain Entities (S431–S440)
- **DataProviderConfig** — market data provider integration config: `DataProviderTier` (free/basic/professional/enterprise); `isPaidTier`, `isHighThroughput` (≥100 req/min) (S431)
- **TickerNewsSummary** — aggregated ticker news: `TickerNewsSentiment` enum (bullish/bearish/neutral); `isBullish`, `isBearish`, `hasNews` (S432)
- **EarningsEstimate** — analyst EPS consensus: `hasConsensus` (≥3 analysts), `epsRange`, `isHighAgreement` (range ≤0.10) (S433)
- **PriceTargetConsensus** — analyst price-target consensus: `upsidePotential`, `isBuyMajority`, `isAboveCurrentPrice` (S434)
- **MacroEconomicSnapshot** — GDP, CPI, unemployment, rate, yield curve: `isYieldCurveInverted`, `isRecessionarySignal`, `isHighInflation` (S435)
- **SectorPerformanceSnapshot** — sector return map: `leadingSector`, `laggingSector`, `sectorCount` (S436)
- **MarketCalendarEntry** — market calendar events: `MarketCalendarCategory` (holiday/expiration/centralBank/economicRelease/earnings/indexRebalance); `isMarketClosed`, `isHighImpact` (S437)
- **AltDataSignal** — alternative data signals: `AltDataSource` (5 sources); `isBullish` (>0.2), `isBearish` (<−0.2), `isStrong` (abs>0.6) (S438)
- **FundamentalRatioSnapshot** — P/E, P/B, P/S, EV/EBITDA, D/E: `isValueStock`, `isHighLeverage`, `isPremiumValuation` (S439)
- **LiquidityScore** — composite liquidity: `LiquidityTier` (4 levels); `isLiquid`, `isTightSpread` (≤5 bps) (S440)

### Tests
- Added `test/domain/s431_s440_domain_batch_test.dart` — 41 tests covering all 10 new domain entities.

---


### Added — Domain Entities (S416–S430)
- **PositionRiskEntry** — per-position risk assessment: `PositionRiskCategory` (low/moderate/high/extreme); `isHighRisk`, `isExtreme`, `adjustedExposure` (positionValue × betaAdjustedRisk) (S416)
- **TradeExecutionRecord** — post-trade execution audit: `totalValue`, `hasSlippage`, `hasPositiveSlippage` (unfavorable buy-side slippage) (S417)
- **PortfolioHeatmapConfig** — heatmap display configuration: `HeatmapColorScheme` (redGreen/blueOrange/grayScale); `HeatmapMetric` (priceChange/volumeChange/smaDistance/rsi); `isColorBlindFriendly` (S418)
- **MultiBrokerPosition** — aggregated multi-broker position: `BrokerPositionEntry` sub-object with `totalCost`; `totalQuantity`, `totalCost`, `brokerCount`, `isSpread` (>1 broker) (S419)
- **RebalanceEventLog** — portfolio rebalance lifecycle audit: `RebalanceEventType` (triggered/approved/executed/skipped/cancelled); `isTerminal`, `hasTriggerReason` (S420)
- **AllocationDriftReport** — per-position target-weight drift: `AllocationDriftEntry` with `drift`, `isOverweight`; report-level `maxDrift`, `hasMaterialDrift` (>5 pp), `entryCount` (S421)
- **PortfolioRiskReport** — aggregated portfolio risk metrics: `valueAtRisk95`, `expectedShortfall`, `betaToMarket`, `concentrationScore`; `isHighRisk`, `isDiversified`, `isHighBeta` (S422)
- **MarginUsageSnapshot** — brokerage margin utilisation snapshot: `marginUtilizationRate`, `isOverMargin`, `isHighUtilization` (>80%) (S423)
- **TaxHarvestOpportunity** — tax-loss harvest candidate: `lossPercent`, `isSignificant` (abs loss >\$500), `washSaleWindowDays` (30) (S424)
- **PortfolioCorrelationEntry** — pairwise ticker correlation: `isHighlyCorrelated` (abs>0.7), `isNegativelyCorrelated` (<−0.3), `isDiversifying` (S425)
- **TradeSignalAttribution** — post-trade method attribution: `isConsensus` (≥2 contributing methods), `methodCount`, `isPrimaryOnly` (S426)
- **InvestmentThesis** — structured investment thesis: `hasCatalysts`, `hasRisks`, `isBalanced` (both documented) (S427)
- **PortfolioStressScenario** — What-If stress test definition: `isSevere` (>20% drop), `isRateStress` (≥100 bps), `isBearish` (S428)
- **PositionConcentrationRisk** — concentration threshold breach: `isAboveThreshold`, `excessPercent`, `isMaterial` (excess>5 pp) (S429)
- **VarEstimate** — Value at Risk estimate: `VarConfidenceLevel` (p90/p95/p99); `isConservative`, `isOneDay`, `annualizedLoss` (S430)

### Tests
- Added `test/domain/s416_s430_domain_batch_test.dart` — 65 tests covering all 15 new domain entities.

---


### Added — Domain Entities (S401–S415)
- **AlertChannelStatus** — delivery channel health tracking: `AlertChannelType` (push/inApp/email/sms/webhook); `isHealthy`, `isDegraded` (>3 consecutive failures) (S401)
- **AlertResponseLog** — user interaction with an alert action prompt: `isDismissed`, `isEngaged`, optional `durationMs` tracking (S402)
- **AsyncDataState\<T\>** — generic remote data-loading state: `hasData`, `hasError`, `isEmpty`, `isLoading`; fully const-constructible (S403)
- **BatchScanJob** — bulk market-scan job tracker: `BatchScanStatus` (5 states); `progressPct`, `isComplete`, `isRunning`, `errorMessage` (S404)
- **CandleGapEvent** — session price-gap event: `gapPct`, `isGapUp`, `isBigGap` (≥2%) (S405)
- **ChartLayoutConfig** — chart panel layout preset: `mainPanelIndicators`, `subPanels`, `totalPanels`, `isDefault` (S406)
- **MarketMoverEntry** — top-gainers/losers entry: `isGainer`, `isBigMover` (≥5%), optional `sectorName` (S407)
- **NewsAlertConfig** — news-triggered alert configuration: keyword list, allowlist/blocklist sources, `isSourcePermitted()`, `isActive` (S408)
- **OrderBookLevel** — single Level-2 order book price level: `isBid`/`isAsk`, `notional` (S409)
- **PortfolioExposureMap** — asset-class + sector exposure snapshot: `isConcentrated` (>60% in any class), `isSectorConcentrated` (>30%) (S410)
- **PriceLevelBreachLog** — audit log for price-level trigger crossings: `overshoot`, `overshootPct`, `isUpside` (S411)
- **RatioComparisonResult** — peer comparison for any financial ratio: `difference`, `differencePct`, `aIsHigher`, `isSignificant` (>20% diff) (S412)
- **SectorMomentumScore** — sector momentum direction + score: `SectorMomentumDirection` (5 values); `isPositive`, `isOutperforming` (S413)
- **TechnicalSummaryCard** — compact multi-indicator ticker snapshot: `isAboveBothMas`, `isGoldenCross`, `isMacdBullish`, `isOversold`, `isOverbought` (S414)
- **TickerOwnershipRecord** — institutional/insider ownership record: `isSignificantHolder` (≥5%), `isAccumulating` (S415)

### Fixed
- Wired all 15 entities into `domain.dart` barrel (alphabetical order)
- Fixed modified domain files: `api_rate_limit_policy.dart`, `chart_display_config.dart`, `data_provider_metrics.dart`, `economic_calendar_event.dart`, `portfolio_income_projection.dart`, `signal_conflict_analyzer.dart`, `trade_plan_entry.dart`

### Quality
- 85 new unit tests in `test/domain/s401_s415_domain_batch_test.dart`; 0 failures
- `flutter analyze --fatal-infos`: 0 issues
- `dart format`: clean

---

## [2.8.0] — 2026-04-10

### Added — Domain Entities (S391–S400)
- **AlertDeduplicationLog** — audit record for alert dedup checks: `DeduplicationOutcome`, `isSuppressed`, `isAccepted` (S391)
- **DividendReinvestmentPlan** — DRIP config with `DripFrequency` (4 values): `hasFractionalShares`, `minimumCashThreshold` (S392)
- **MarketCapBucket** — market-cap tier classification: `MarketCapTier` (micro/small/mid/large/mega), `tier`, `isLargeOrAbove` (S393)
- **MarketScanResult** — per-ticker scan outcome: `ScanMatchStatus` (4 values), `isMatch`, `passCount` (S394)
- **PortfolioAllocationTarget** — target vs current weight with drift: `needsRebalance`, `isOverweight`, `drift` (S395)
- **PortfolioRebalanceAlert** — drift alert with severity: `RebalanceAlertSeverity`, `isCritical`, `isOverweight` (S396)
- **SymbolMappingEntry** — canonical-to-provider symbol map: `symbolFor()`, `hasMappings` (S397)
- **TradingSessionSummary** — OHLCV session summary: `range`, `changePct`, `isBullishSession` (S398)
- **TrailingStopConfig** — trailing stop with `TrailingStopUnit` (pct/absolute/ATR): `stopPrice`, `isTriggered()` (S399)
- **WatchlistChangeLog** — watchlist audit log: `WatchlistAuditChangeType` (5 values), `isTickerChange` (S400)

### Quality
- 66 new unit tests; 0 failures
- `flutter analyze --fatal-infos`: 0 issues
- `dart format`: clean

---

## [2.7.0] — 2026-04-10

### Added — Domain Entities (S386–S390)
- **AppConfigSnapshot** — serialisable app-configuration snapshot: `hasSettings`, `settingCount` (S386)
- **CryptoNetworkMetrics** — on-chain blockchain metrics (active addresses, hash rate, tx count): `isHighActivity`, `isLargeNetwork` (S387)
- **MultiCurrencyPosition** — multi-currency equity position with live FX conversion: `baseMarketValue`, `unrealisedPnlBase`, `isProfitable` (S388)
- **NotificationTemplateConfig** — parameterised notification template with `{{placeholder}}` resolution: `resolveTitle()`, `resolveBody()`, `isStatic` (S389)
- **SocialSentimentSignal** — social-media sentiment signal (Reddit/Twitter/StockTwits): `SentimentPlatform`, `SocialSentimentDirection`, `isBullish`, `isBearish`, `isHighActivity` (S390)

### Quality
- 36 new unit tests; 0 failures
- `flutter analyze --fatal-infos`: 0 issues
- `dart format`: clean

---

## [2.6.0] — 2026-04-10

### Added — Domain Entities (S371–S385)
- **FeatureAccessPolicy** — per-feature access scope gating (free/subscriber/premium/admin/flagGated) with `isFree`, `isFlagGated` (S371)
- **BacktestComparisonSet** + **BacktestComparisonEntry** — side-by-side strategy comparison: `bestReturn`, `bestSharpe` (S372)
- **IndicatorPresetConfig** — named indicator parameter presets with `parameter()` accessor and `isDefault` flag (S373)
- **CrowdSentimentSurvey** + **SentimentResponseEntry** — crowd poll aggregation: `bullCount`, `bullPct`, `isBullishMajority` (S374)
- **AlertBudgetTracker** — daily/weekly alert-count budget with `isExhausted`, `remainingToday` (S375)
- **MultiLegOrderConfig** + **OrderLeg** — multi-leg options/equity order: `riskReward`, `legCount` (S376)
- **TickerAlertHistogram** + **AlertHistogramBucket** — hourly alert frequency histogram with `peakHour`, `countAt()` (S377)
- **PortfolioStressTestResult** — stress test scenario result: `isLossScenario`, `isSevere` (> 20% drawdown) (S378)
- **ExchangeConnectivityStatus** — exchange/feed connection status: `isConnected`, `isOperational`, `isLowLatency` (S379)
- **ChartAnnotationSet** + **ChartAnnotationEntry** — per-ticker chart annotations with `ofType()` filter (S380)
- **TradingEventEntry** — economic/corporate event with `isHighImpact`, `affectsMarketWide` (S381)
- **MarketRegimeSignal** — bull/bear/range/volatility regime with `hasRegimeChanged`, `isTrending` (S382)
- **AlertSnoozeConfig** — symbol-level snooze with `isActiveAt()`, `isGlobal` (S383)
- **OptionGreeksSnapshot** — delta/gamma/theta/vega/rho + IV with `isDeepInTheMoney` (S384)
- **TickerPeerGroup** + **PeerGroupMember** — correlation-ranked peer group with `topPeers()`, `closestPeer` (S385)

### Quality
- 104 new unit tests; 0 failures
- `flutter analyze --fatal-infos`: 0 issues
- `dart format`: clean

---

## [2.5.0] — 2026-04-10

### Added — Domain Entities (S356–S370)
- **StrategyPerformanceRecord** — backtested strategy results: return %, drawdown, win-rate, Sharpe, `qualityLabel` (S356)
- **AlertPriorityEntry** — user-assigned alert priority with urgency check and sort rank (S357)
- **SectorExposureEntry** + **SectorExposureMap** — sector weight breakdown with `topSector` + dominant count (S358)
- **MarketBreadthSnapshot** — A/D ratio, net advancers, 52-week highs/lows, `isBullish` (S359)
- **KellyCriterionResult** — Kelly Criterion position sizing with `compute()` factory and `isPositiveEV` (S360)
- **DataNormalizationConfig** — field-level normalisation config: minMax/zScore/tanh/none methods with clamping + rolling window (S361)
- **TickerEventTimeline** + **TickerTimelineEvent** — ordered event history with `ofType()` filter and `latestEvent` (S362)
- **RiskMetricsBundle** — Beta, annualised volatility, VaR 95%, Calmar ratio, max drawdown (S363)
- **AlertEscalationPolicy** — unacknowledged-alert escalation: channel, delay, repeat interval, max escalations (S364)
- **CandlestickPatternMatch** — pattern detection result with confidence score and `isHighConfidence`; extended `CandlestickPatternType` with 7 new patterns (S365)
- **DataRetentionPolicy** — per-category data retention rules with archive tier support (S366)
- **MarketImpactEstimate** — order market-impact: participation rate, slippage %, `isMaterial` (S367)
- **SyntheticTickerConfig** — virtual composite ticker weighting with `isNormalised` guard (S368)
- **AlertGroupingRule** — by-ticker/method/type grouping with real-time window flag (S369)
- **WatchlistCuratorProfile** — auto-curation profile with add/prune/full/manual styles and `isActive` guard (S370)

### Changed
- `CandlestickPatternType` extended with `shootingStar`, `piercingLine`, `darkCloudCover`, `threeWhiteSoldiers`, `threeBlackCrows`, `spinningTop`, `marubozu`

### Quality
- 100 new unit tests; 0 failures
- `flutter analyze --fatal-infos`: 0 issues
- `dart format`: clean

---

## [2.4.0] — 2026-04-10

### Added — Domain Entities (S341–S355)
- **WatchlistDiffReport** + **WatchlistChangeEntry** — diff between two watchlist snapshots: added/removed tickers, price changes (S341)
- **AlertDeliveryWindow** — scheduled delivery/quiet time windows with midnight-wrap support; `businessHours` + `overnightQuiet` presets (S342)
- **TickerPriceRange** — 52-week high/low + all-time-high tracking with range position helper (S343)
- **CompositeSignalScore** + **SignalScoreComponent** — 0–100 weighted composite signal index with `SignalScoreGrade` (S344)
- **ProviderSyncState** — per-provider sync health tracking; `recordSuccess()`/`recordFailure()` state transitions (S345)
- **AlertFrequencyStats** — per-ticker alert frequency histogram with buy/sell ratios (S346)
- **RegressionTrendline** — linear regression trendline with R², direction, and `priceAt()` prediction (S347)
- **PortfolioWeightSnapshot** + **PortfolioWeightEntry** — point-in-time portfolio weight allocation with dominant position detection (S348)
- **CurrencyRateEntry** — FX rate with mid/bid/ask, `convert()`, bid-ask spread (S349)
- **NotificationAttemptLog** + **NotificationAttemptEntry** — per-notification delivery tracking with retry audit (S350)
- **ScreenerFilterChain** + **ScreenerFilterStep** — AND/OR chain of screener filter conditions (S351)
- **UserBackupProfile** — serialisable settings snapshot for cloud backup/restore (S352)
- **NewsDigestEntry** + **NewsDigestSummary** — curated market news digest with categories and urgency (S353)
- **OptionChainSummary** — simplified option chain snapshot: OI, IV, put/call ratio (S354)

### Quality
- 89 new unit tests; all passing
- `flutter analyze --fatal-infos`: 0 issues
- `dart format`: clean

## [2.3.0] — 2026-04-10

### Added (S336–S340)
- **TickerTagEntry** + **TickerTagRegistry** + **TickerTagAssignment** — user-defined color+emoji ticker labels; `displayLabel`, `tagFor()`, `tagsWithColor()`, `hasTag()` (S336)
- **EconomicIndicatorRelease** — scheduled macro releases (CPI, GDP, NFP); `EconomicIndicatorCategory` (8) + `EconomicImpactLevel`; `surprise`, `isBeat`, `isHighImpact` (S337)
- **MarketDepthSnapshot** + **MarketDepthLevel** — Level-2 order book snapshot; `bestBid`, `bestAsk`, `spread`, `totalBidNotional`, `totalAskNotional` (S338)
- **TradingHaltEvent** — circuit-breaker & regulatory halts; `TradingHaltReason` (8) + `TradingHaltStatus`; `haltDuration`, `isMarketWide`, `isActive` (S339)
- **IndexCompositeSnapshot** + **IndexConstituentEntry** — ETF/index holdings; `topN()`, `dominantHoldings` (weight ≥ 5%), `totalWeightPct` (S340)



### Added (S321–S335)
- **CorporateActionEvent** — stock splits, reverse splits, dividends, delistings, mergers; `CorporateActionType` (8 values); `isSplit`, `isReverseSplit`, `isDelisting`, `hasNotes` helpers (S321)
- **SystemHealthAlert** — infrastructure health monitoring; `HealthAlertSeverity` (4 levels), `HealthAlertCategory` (7 categories); `requiresAttention`, `resolutionTime`, `resolve()` (S322)
- **PriceMomentumSnapshot** — momentum direction tagging; `MomentumDirection` enum; `isPositive`, `isStrong`, `isAccelerating`, `hasRelativeStrength` (S323)
- **WatchlistGroupMembership** — multi-group membership registry; `GroupMembershipEntry`; `groupIds`, `symbolsInGroup()`, `groupsForSymbol()`, `isMember()` (S324)
- **TickerImportSession** — bulk import tracking; `ImportSessionType` (4 types), `ImportSessionStatus` (5 states); `successRate`, `duration`, `isComplete` (S325)
- **PerformanceMetricSnapshot** — latency/metric regression tracking; `deviationPct`, `isRegression`, `isImprovement`, `tags: Map<String, String>` (S326)
- **InsiderTradeRecord** — SEC Form 4 insider trading data; `InsiderTradeType` (5 values); `totalValue`, `isBuy`, `isSell`, `isSignificant` (>= \$1M) (S327)
- **GeographicExposureMap** — regional portfolio exposure; `MarketRegion` (7 regions), `RegionalExposureEntry`; `dominantRegion`, `isFullyMapped`, `exposureFor()` (S328)
- **FeatureFlagEntry** + **FeatureFlagRegistry** — runtime feature flags; `FeatureFlagStatus` (enabled/disabled/rollout); `enable()`, `disable()`, `isRollout`, `isEnabled()`, `flagFor()` (S329)
- **UserAchievement** + **AchievementTier** — gamification achievement system; `currentTier`, `nextTier`, `isMaxTier`, `progressToNextTier` (0.0–1.0 fraction) (S330)
- **AlertRateLimitRecord** — per-symbol/method rate limiting; `AlertRateLimitInterval` (perMinute/perHour/perDay); `isExhausted`, `remaining`, `increment()`, `reset()` (S331)
- **ChartThemeProfile** — chart color theming; predefined `darkClassic`, `lightClean`; `withDefault()`, `hasGridColor`, `hasVolumeColor` (S332)
- **VolatilitySurface** + **VolatilityDataPoint** — multi-point HV/IV surface; `avgHistoricalVolatility`, `isCurrentlyElevated`, `volSpread`, `latest`, `isEmpty` (S333)
- **TickerSearchResponse** + **TickerSearchResult** — search result model; `topResult`, `hasPagination`, `isEmpty`, `returnedCount`, `hasSector` (S334)
- **SystemAuditEntry** — comprehensive audit trail (actions, actors, targets, metadata); `hasTarget`, `hasMetadata`, `isSystemAction` (S335)



### Added (S306–S320)
- **BenchmarkIndexConfig** — configurable benchmark index (symbol, displayName, `isDefault`, `color`); predefined `sp500`, `nasdaq100`, `dow` constants; `withDefault()` (S306)
- **SignalCalibrationRecord** — per-method signal accuracy tracking (`totalSignals`, `correctSignals`, `accuracy`, `accuracyPercent`, `isReliable`, `isHighlyReliable`); rolling `periodDays` window (S307)
- **PortfolioRebalanceTarget** — target allocation engine (`AllocationTarget` with `targetWeight`, `driftTolerancePct`, `lowerBound`, `upperBound`, `isWithinTolerance()`); container `PortfolioRebalanceTarget` with `totalWeight`, `isFullyAllocated`, `targetFor()` (S308)
- **PaperTradeOrder** — paper trading simulation (`PaperTradeSide`, `PaperTradeStatus`); `fill()`, `slippage`, `notionalValue`; full buy/sell lifecycle (S309)
- **GlobalMarketSnapshot** — major index snapshot (`GlobalIndexLevel` with `isRising`/`isFalling`); container with `risingCount`, `fallingCount`, `isBroadlyUp`, `indexFor()` (S310)
- **MarketSentimentIndex** — composite fear/greed index 0–100 (`SentimentLabel`: extremeFear→extremeGreed, `SentimentComponent` with weight); `isGreedy`, `isFearful`, `isNeutral` (S311)
- **TickerFundamentals** — per-ticker fundamental snapshot (`peRatio`, `eps`, `revenueUsd`, `marketCapUsd`, `beta`, `dividendYieldPct`); `isExpensive`, `isCheap`, `isHighBeta`, `hasLargeCapSize` (S312)
- **RiskBudgetConfig** — strategy risk budget (`StrategyRiskAllocation` with `maxRiskPct`, `isUnallocated`); `usedBudgetPct`, `remainingBudgetPct`, `isOverallocated`, `isFullyAllocated`, `allocationFor()` (S313)
- **AlertNotificationLog** — per-notification delivery log (`NotificationChannel` enum: push/email/sms/webhook/inApp); `isRead`, `isDelivered`, `isFailed`, `markRead()` (S314)
- **HoldingCostAnalysis** — holding period cost analysis (`avgCostBasis`, `currentPrice`, `quantity`, `holdingDays`); `unrealizedPnl`, `unrealizedPnlPct`, `isProfit`, `isLoss`, `isLongTerm` (S315)
- **StrategyRuleSet** — named rule set for strategy activation (rules: `List<String>`, `isActive`, `activatedAt`); `activate()`, `deactivate()`, `ruleCount`, `hasDescription` (S316)
- **TradingJournalEntry** — trade journal with psychology (`TraderEmotion` enum, `TradeOutcome` enum); `isWin`, `isLoss`, `isOpen`, `isEmotional`, `hasPnl` (S317)
- **DataQualityFlag** — per-candle data quality annotation (`DataQualityFlagType`: missing/gap/spike/stale/split/zeroVolume; `DataQualitySeverity`); `isCritical`, `requiresAction` (S318)
- **WatchlistPerformanceSummary** — group-level performance aggregation (`avgReturnPct`, `bestPerformerSymbol`, `worstPerformerSymbol`, `returnSpread`, `isGroupPositive`, `hasHighDispersion`) (S319)
- **OrderFlowImbalance** — buy/sell volume ratio analysis (`ImbalanceDirection`: buyDominated/sellDominated/balanced; `imbalanceRatio`, `isBuyDominated`, `isSellDominated`) (S320)

## [2.0.0] — 2026-04-10

### Added (S291–S305)
- **ApiRateLimitPolicy** — per-provider rate-limit rules: `RateLimitStrategy` (queue/drop/fallback), `effectiveCapacityPerMinute`, `isWithinMinuteLimit()`, `isWithinHourLimit()`, `withStrategy()` (S291)
- **AlertCooldownConfig** — per-ticker alert cooldown + dedup windows: `CooldownScope`, built-in `balanced`/`aggressive`/`conservative` presets, `isWindowExhausted()`, `isInCooldown()` (S292)
- **TradingSignalFilter** — pre/post-filter chain for signal streams: `SignalFilterRule`, `SignalFilterDirection`, `buyRules`, `sellRules`, `hasConsensusRequirement`, `withRule()` (S293)
- **TickerNoteEntry** — per-ticker rich notes with tags + pin: `pin()`, `unpin()`, `withUpdatedBody()`, `hasBeenEdited`, `hasTags` (S294)
- **MarketCapCategory / MarketCapSnapshot** — market-cap tiers (nano→mega) with `classify()` factory, `minUsd`/`maxUsd` thresholds, `isMegaCap`, `isSmallOrSmaller` (S295)
- **AlertSuppressRule** — time-window alert suppression: `SuppressReason`, overnight + intraday window support, `appliesAt()`, `coversWeekend`, `activate()`/`deactivate()` (S296)
- **PriceAlertLevel** — structured price-level alert: `PriceAlertDirection` (above/below/crossUp/crossDown), `wouldTrigger()`, `isExpiredAt()`, `trigger()`/`dismiss()` (S297)
- **DataProviderMetrics** — per-provider health metrics: `DataProviderStatus`, `successRate`, `hasCriticalFailures`, `recordSuccess()`/`recordFailure()` auto-degrading status (S298)
- **TechnicalScanResult / ScanConditionMatch** — screener scan result: `matchCount` (satisfied only), `matchScore`, `isFullMatch`, `hasPartialMatch`, `failedConditions` (S299)
- **EconomicCalendarEvent** — macro events (CPI/FOMC/NFP/GDP): `EconomicEventCategory`, `EconomicImpactLevel`, `isReleased`, `surprise`, `isPositiveSurprise`, `isDue` (S300)
- **PortfolioIncomeProjection / IncomeProjectionEntry** — projected portfolio income calendar: `totalProjectedIncome`, `dividendIncome`, `optionPremiumIncome`, unique `symbols` list (S301)
- **TradePlanEntry** — structured trade plan: `TradePlanStatus`, `riskPerShare`, `rewardPerShare`, `riskRewardRatio`, `activate()`/`execute()` state transitions (S302)
- **AlertBatchSummary / AlertBatchEntry** — aggregated alert batch report: `totalAlerts`, `uniqueSymbols`, `uniqueAlertTypes`, `top(n)` ranking, `reportingPeriod` (S303)
- **SignalConflictAnalyzer / SignalConflict** — cross-method signal conflict detection: `SignalConflictType`, `analyze()` pairwise comparison, `isBuyVsSell` (S304)
- **ChartDisplayConfig / SmaOverlayConfig** — per-ticker chart preferences: `ChartLayoutStyle`, overlay visibility toggles, `withLayout()`/`withSmaOverlay()` immutable copies (S305)
- Updated domain barrel (domain.dart): 15 new alphabetical exports
- **1803 passing tests** (domain + application + data), 0 analyze issues

## [1.9.0] — 2026-04-12

### Added (S276–S290)
- **MarketHolidayCalendar** — exchange trading-holiday database: `TradingExchange` (NYSE/NASDAQ/LSE/TSX/ASX/EURONEXT/HKEX), `MarketHoliday`, `MarketHolidayCalendar.isHoliday()`, `holidaysFor()`, `holidayCountInRange()` (S276)
- **PriceTriggerRule** — declarative price-level triggers: `PriceTriggerCondition` (crossesAbove/crossesBelow/percentChangeUp/percentChangeDown), `PriceTriggerStatus`, `PriceTriggerRule.isActive`, `isExpiredAt()`, `withStatus()` (S277)
- **OnboardingState** — first-run checklist tracker: `OnboardingStep`, `OnboardingState.fresh()`, `completionPct`, `isFullyComplete`, `nextStep`, `completeStep()`, `skipStep()` (S278)
- **AppDiagnosticReport** — runtime app health snapshot: `DiagnosticSeverity`, `DiagnosticEntry.isHealthy`, `AppDiagnosticReport.isHealthy`, `criticalEntries`, `overallSeverity` (S279)
- **TickerCorrelationCluster** — pairwise ticker clustering: `ClusteringMethod` (kMeans/hierarchical/dbscan), `CorrelationCluster.isHighlyCorrelated`, `TickerCorrelationCluster.clusterFor()`, `peersOf()` (S280)
- **SmartAlertSchedule** — engagement-driven delivery timing: `EngagementTimeWindow.containsHour()`, `SmartAlertSchedule.bestWindowForHour()`, `isWithinPeakWindow()` (S281)
- **PortfolioBacktestResult** — multi-ticker portfolio backtest: `PortfolioBacktestTrade.pnl`, `returnPct`, `isWin`; `PortfolioBacktestResult.totalReturn`, `winRate`, `peakEquity`, `maxDrawdown` (S282)
- **ScreenerPreset** — named screener preset management: `ScreenerConditionField`, `ScreenerCompareOp`, `ScreenerCondition`, `ScreenerPreset.hasConditions`, `withCondition()` (S283)
- **DigestContentBlock** — typed digest content layout: `DigestBlockType`, `DigestContentBlock.hasTickerRef`, `hasNumericValue`; `DigestTemplate.sorted`, `isEmpty` (S284)
- **ReportSchedule** — scheduled report delivery: `ReportFrequency`, `ReportDeliveryChannel`, `ReportSchedule.isDueAt()`, `withNextRun()` (S285)
- **WatchlistSnapshot** — point-in-time watchlist capture: `WatchlistTickerSnapshot.pctFromSma200`, `isAboveSma200`; `WatchlistSnapshot.aboveSma200`, `pctAboveSma200`, `tickerSnapshot()` (S286)
- **SyncConflictResolver** — device-sync conflict resolution: `ConflictResolutionPolicy` (lastWriteWins/remoteWins/localWins/mergeByField/requireManual), `ConflictOutcome`, `SyncConflict.localIsNewer`, `ConflictResolution.isResolved`, `SyncConflictResolver.resolve()` (S287)
- **IndicatorAlertConfig** — per-indicator alert thresholds: `IndicatorAlertMode`, `IndicatorAlertThreshold.contains()`, `isBelow()`, `isAbove()`; `IndicatorAlertConfig.shouldAlert()` (S288)
- **UserAnnotation** — arbitrary entity annotations: `AnnotationTarget`, `AnnotationColor`, `UserAnnotation.hasBeenEdited`, `hasTags`, `withText()`, `hide()` (S289)
- **FeedbackSubmission** — in-app user feedback: `FeedbackCategory`, `FeedbackStatus`, `FeedbackSubmission.isPending`, `isResolved`, `hasContactInfo`, `withStatus()` (S290)
- Updated architecture.svg: v1.9, 1688 tests, 190+ domain classes

## [1.8.0] — 2026-04-11

### Added (S261–S275)
- **PrometheusAlertCollector** — alert rate metrics per ticker/window: `AlertRateWindow`, `AlertMetricPoint.alertsPerHour`, `PrometheusAlertCollector.totalAlertsForWindow()` (S261)
- **AlertDeliveryTrace** — per-alert sink delivery results: `DeliveryStatus` (delivered/retrying/failed/skipped), `DeliverySinkResult.wasSuccessful`, `AlertDeliveryTrace.allDelivered`, `pendingRetries` (S262)
- **NewsFeedAggregator** — aggregated news feed with filters: `FeedCategory`, `FeedFilter`, `NewsFeedAggregator.latestArticle`, `highRelevanceArticles` (S263)
- **LeaderboardOptIn** — opt-in consent management: `LeaderboardPrivacyLevel`, `LeaderboardConsent`, `LeaderboardOptIn.optIn()`, `optOut()`, `latestConsent` (S264)
- **CommunityWatchlistSubscription** — community watchlist follow state: `SubscriptionState`, `CommunityWatchlistSubscription.isActive`, `pause()`, `markSynced()` (S265)
- **PatternSignalLibrary** — curated setup library: `SetupTrendContext`, `SetupOutcome.expectedValue`, `SetupOutcome.isHighConfidence`, `SignalSetup`, `PatternSignalLibrary.setupsForContext()`, `highConfidenceSetups` (S266)
- **SignalExplanation** — human-readable signal rationale: `ExplanationConfidenceLevel`, `ExplanationFactor` (weight-validated), `SignalExplanation.supportingFactors`, `conflictingFactors`, `isHighConfidence` (S267)
- **PluginRegistry** — runtime plugin catalogue: `PluginLifecycleState`, `RegistrationEntry.isOperational`, `withError()`, `activate()`, `PluginRegistry.empty()`, `withEntry()`, `activePlugins`, `entryFor()` (S268)
- **AlertRuleTemplate** — reusable alert rule templates: `RuleTemplateCategory`, `TemplateParameter.hasRange`, `AlertRuleTemplate.defaultParameters`, `isBuiltIn` (S269)
- **UserDefinedIndicator** — user-authored indicator metadata: `IndicatorDisplayStyle`, `UserDefinedIndicator.toggleVisibility()` (S270)
- **TierFeatureGate** — subscription-tier feature access control: `UpgradeReason`, `GateDecision.allowed()`, `GateDecision.denied()`, `TierFeatureGate.evaluate()` (S271)
- **RestApiRequestLog** — REST API request audit log: `ApiHttpMethod`, `ApiRequestEntry.isSuccess`, `RestApiRequestLog.successRate`, `avgDurationMs`, `withEntry()` (S272)
- **DataExportManifest** — data export configuration: `ExportFormat`, `ExportField`, `DataExportManifest.dateRange`, `estimatedRowCount` (S273)
- **TechnicalSummarySnapshot** — multi-indicator snapshot: `IndicatorReadings.hasSufficientData`, `TechnicalSummarySnapshot.pctFromSma200`, `isAboveSma200` (S274)
- **UserEngagementEvent** — user interaction event log: `EngagementEventType`, `UserEngagementEvent`, `EngagementSession.duration`, `alertActionCount` (S275)
- Updated architecture.svg: v1.8, 1604 tests, 175+ domain classes

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
