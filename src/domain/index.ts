/**
 * Domain barrel — public API for the CrossTide analysis engine.
 *
 * @module domain
 */

// ── Technical indicator defaults ─────────────────────────────────────────

export { DEFAULTS } from "./technical-defaults";

// ── Core indicators ──────────────────────────────────────────────────────

/** Simple Moving Average (SMA). */
export { computeSma, computeSmaSeries } from "./sma-calculator";
export type { SmaPoint } from "./sma-calculator";
/** Exponential Moving Average (EMA). */
export { computeEma, computeEmaSeries } from "./ema-calculator";
export type { EmaPoint } from "./ema-calculator";
/** Relative Strength Index (RSI). */
export { computeRsi, computeRsiSeries } from "./rsi-calculator";
export type { RsiPoint } from "./rsi-calculator";
/** Moving Average Convergence Divergence (MACD). */
export { computeMacdSeries } from "./macd-calculator";
export type { MacdPoint } from "./macd-calculator";

// ── Consensus & signals ──────────────────────────────────────────────────

/** 12-method consensus signal engine. */
export { evaluateConsensus } from "./consensus-engine";
/** Bullish/bearish cross-up detection. */
export { detectCrossUp } from "./cross-up-detector";
export type { CrossUpResult } from "./cross-up-detector";
// ── Volatility & range indicators ────────────────────────────────────────

/** Average True Range (ATR) — volatility measurement. */
export { computeAtr, computeAtrSeries } from "./atr-calculator";
export type { AtrPoint } from "./atr-calculator";
/** Bollinger Bands — price envelope using standard deviations. */
export { computeBollinger, computeBollingerSeries } from "./bollinger-calculator";
export type { BollingerPoint } from "./bollinger-calculator";
// ── Oscillators ──────────────────────────────────────────────────────────

/** Stochastic %K / %D oscillator. */
export { computeStochastic, computeStochasticSeries } from "./stochastic-calculator";
export type { StochasticPoint } from "./stochastic-calculator";

// ── Volume indicators ────────────────────────────────────────────────────

/** On-Balance Volume (OBV). */
export { computeObv, computeObvSeries } from "./obv-calculator";
export type { ObvPoint } from "./obv-calculator";
// ── Trend & momentum indicators ──────────────────────────────────────────

/** Average Directional Index (ADX) — trend strength. */
export { computeAdx, computeAdxSeries } from "./adx-calculator";
export type { AdxPoint } from "./adx-calculator";
/** Commodity Channel Index (CCI). */
export { computeCci, computeCciSeries } from "./cci-calculator";
export type { CciPoint } from "./cci-calculator";
/** Money Flow Index (MFI) — volume-weighted RSI. */
export { computeMfi, computeMfiSeries } from "./mfi-calculator";
export type { MfiPoint } from "./mfi-calculator";
/** Williams %R oscillator. */
export { computeWilliamsR, computeWilliamsRSeries } from "./williams-r-calculator";
export type { WilliamsRPoint } from "./williams-r-calculator";
/** Parabolic SAR — trailing stop indicator. */
export { computeSar, computeSarSeries } from "./parabolic-sar-calculator";
export type { SarPoint } from "./parabolic-sar-calculator";
/** SuperTrend — trend-following overlay. */
export { computeSuperTrend, computeSuperTrendSeries } from "./supertrend-calculator";
export type { SuperTrendPoint } from "./supertrend-calculator";
/** Volume-Weighted Average Price (VWAP). */
export { computeVwap, computeVwapSeries } from "./vwap-calculator";
export type { VwapPoint } from "./vwap-calculator";
// ── Method evaluators (consensus inputs) ─────────────────────────────────

export { evaluate as evaluateMicho } from "./micho-method";
export { evaluate as evaluateRsi } from "./rsi-method";
export { evaluate as evaluateMacd } from "./macd-method";
export { evaluate as evaluateBollinger } from "./bollinger-method";
export { createMarketDataEnvelope } from "../types/market-data";
export type {
  MarketDataKind,
  MarketDataStatus,
  MarketDataProvenance,
  MarketDataEnvelope,
} from "../types/market-data";
export { evaluate as evaluateStochastic } from "./stochastic-method";
export { evaluate as evaluateObv } from "./obv-method";
export { evaluate as evaluateAdx } from "./adx-method";
export { evaluate as evaluateCci } from "./cci-method";
export { evaluate as evaluateSar } from "./sar-method";
export { evaluate as evaluateWilliamsR } from "./williams-r-method";
export { evaluate as evaluateMfi } from "./mfi-method";
export { evaluate as evaluateSuperTrend } from "./supertrend-method";
/** Multi-method signal aggregation. */
export { aggregateSignals, aggregateConsensus } from "./signal-aggregator";

// ── Alerts ───────────────────────────────────────────────────────────────

/** State-machine-based price/volume alert engine. */
export { createAlertState, evaluateAlerts, DEFAULT_ENABLED_ALERTS } from "./alert-state-machine";
export type { AlertType, FiredAlert, TickerAlertState } from "./alert-state-machine";

// ── Backtesting ──────────────────────────────────────────────────────────

/** Event-driven backtest engine with commission and slippage. */
export { runBacktest } from "./backtest-engine";
export type { BacktestConfig, BacktestTrade, BacktestResult } from "./backtest-engine";
// ── Risk analytics ───────────────────────────────────────────────────────

/** Daily returns, Sharpe, Sortino, max drawdown, Fibonacci levels. */
export {
  dailyReturns,
  sharpeRatio,
  sortinoRatio,
  maxDrawdown,
  fibonacciRetracement,
} from "./analytics";
export type { FibonacciLevels } from "./analytics";

/** Drawdown recovery analysis — recovery patterns, speeds, and probabilities. */
export { analyzeRecoveries, estimateRecoveryTime } from "./drawdown-recovery";
export type { RecoveryEvent, RecoveryAnalysis } from "./drawdown-recovery";

/** Extended backtest metrics (win rate, expectancy, etc.). */
export { computeMetrics as computeBacktestMetrics } from "./backtest-metrics";
export type { BacktestMetrics, EquityPoint, Trade } from "./backtest-metrics";

// ── Position sizing ──────────────────────────────────────────────────────

/** Risk-based, ATR-based, and Kelly criterion position sizing. */
export {
  riskBasedSize,
  atrBasedSize,
  fixedFractionalSize,
  kellyFraction,
  halfKellySize,
} from "./position-sizing";
export type { RiskBasedSizingInput, AtrSizingInput, KellyInput } from "./position-sizing";

/** Position-level risk metrics — stop distance, R-multiple, portfolio heat. */
export { computePositionRisk, computePortfolioHeat } from "./position-risk";
export type { PositionInput, PositionRisk, PortfolioHeat } from "./position-risk";

// ── Branded types ────────────────────────────────────────────────────────

/** Nominal-typed wrappers for Ticker, ISODate, Price, Percent. */
export {
  isTicker,
  asTicker,
  tryTicker,
  isISODate,
  asISODate,
  isPrice,
  asPrice,
  isPercent,
  asPercent,
} from "./branded";
export type { Ticker, ISODate, Price, Percent } from "./branded";

// ── Benchmark & risk ratios ──────────────────────────────────────────────

/** Rebase series, compare to benchmark, compute beta. */
export { rebaseToHundred, compareToBenchmark, beta } from "./benchmark";
export type { SeriesPoint, RelativePoint } from "./benchmark";

/** CAGR and Calmar ratio helpers. */
export { cagr, calmarRatio } from "./risk-ratios";
export type { RatioOptions } from "./risk-ratios";

// ── Signal DSL ───────────────────────────────────────────────────────────

/** Tokenize, parse, and evaluate user-defined signal expressions. */
export { tokenize, parse, evaluate, compileSignal } from "./signal-dsl";
export type { Value, Node, EvalContext, FnImpl } from "./signal-dsl";

// ── Chart helpers ────────────────────────────────────────────────────────

/** Heikin-Ashi smoothed candlesticks. */
export { heikinAshi } from "./heikin-ashi";
export type { Candle, HeikinAshiCandle } from "./heikin-ashi";

/** Bar Replay — step through historical candles with play/pause/speed/seek (R1). */
export { createBarReplay } from "./bar-replay";
export type { ReplayOptions, ReplayState, ReplayTickHandler, BarReplay } from "./bar-replay";

/** Point & Figure chart computation — X/O box columns (R8). */
export { computePnf, autoBoxSize, floorBox } from "./point-and-figure";
export type { PnfInput, PnfOptions, PnfBox, PnfColumn, PnfChart } from "./point-and-figure";
export { computeKagi, autoReversalThreshold } from "./kagi";
export type { KagiInput, KagiOptions, KagiSegment, KagiChart, KagiWeight } from "./kagi";

/** Donchian Channels — high/low price envelope. */
export { computeDonchian } from "./donchian";
export type { DonchianPoint } from "./donchian";

/** Keltner Channels — ATR-based envelope around EMA. */
export { computeKeltner } from "./keltner";
export type { KeltnerPoint, KeltnerOptions } from "./keltner";

/** Ichimoku Kinko Hyo — multi-line trend system. */
export { computeIchimoku } from "./ichimoku";
export type { IchimokuPoint, IchimokuOptions } from "./ichimoku";

/** Classical and Fibonacci pivot points. */
export { computePivots } from "./pivots";
export type { PivotInput, PivotLevels, PivotKind } from "./pivots";

/** ZigZag — swing high/low detection with threshold filter. */
export { computeZigZag } from "./zigzag";
export type { ZigZagPivot, ZigZagOptions, PivotDirection } from "./zigzag";

// ── Divergence detection ─────────────────────────────────────────────────

/** Detect bullish/bearish divergences between price and oscillators. */
export { detectDivergences } from "./divergence-detector";
export type { Divergence, DivergenceType, DivergenceOptions } from "./divergence-detector";

/** Rolling Sharpe ratio — risk-adjusted return over a sliding window. */
export { computeRollingSharpe } from "./rolling-sharpe";
export type { RollingSharpePoint, RollingSharpeOptions } from "./rolling-sharpe";

/** Relative Volume (RVOL) — current volume vs historical average. */
export { computeRelativeVolume, detectVolumeSurges } from "./relative-volume";
export type { RvolPoint, RvolOptions } from "./relative-volume";

/** MFE/MAE — max favorable/adverse excursion analysis for backtest trades. */
export { computeExcursions } from "./mfe-mae";
export type { TradeExcursion, ExcursionTrade, ExcursionSummary } from "./mfe-mae";

/** Volatility-Adjusted Momentum — momentum normalized by ATR. */
export { computeVam } from "./volatility-adj-momentum";
export type { VamPoint, VamOptions } from "./volatility-adj-momentum";

/** Trend Strength Composite — unified 0-100 trend score from ADX + MA + consistency. */
export { computeTrendStrength } from "./trend-strength";
export type { TrendStrengthPoint, TrendStrengthOptions } from "./trend-strength";

/** Rolling Correlation — sliding-window Pearson correlation between two assets. */
export { computeRollingCorrelation } from "./rolling-correlation";
export type { RollingCorrelationPoint, RollingCorrelationOptions } from "./rolling-correlation";

/** Omega Ratio — probability-weighted gain/loss ratio from full return distribution. */
export { computeOmega, omegaFromReturns } from "./omega-ratio";
export type { OmegaResult, OmegaOptions } from "./omega-ratio";

/** Volume-Price Trend (VPT) — cumulative volume-weighted price momentum. */
export { computeVpt } from "./volume-price-trend";
export type { VptPoint, VptOptions } from "./volume-price-trend";

/** Time-Segmented Volume (TSV) — Worden-style accumulation/distribution. */
export { computeTsv } from "./time-segmented-volume";
export type { TsvPoint, TsvOptions } from "./time-segmented-volume";

/** Maximum Diversification Portfolio — weights maximizing diversification ratio. */
export { maxDiversification } from "./max-diversification";
export type { MaxDivResult } from "./max-diversification";

/** Adaptive RSI — volatility-adjusted RSI period using Kaufman efficiency ratio. */
export { computeAdaptiveRsi } from "./adaptive-rsi";
export type { AdaptiveRsiPoint, AdaptiveRsiOptions } from "./adaptive-rsi";

/** Kaufman Efficiency Ratio — trending vs choppy market measure (0–1). */
export { computeEfficiencyRatio } from "./efficiency-ratio";
export type { EfficiencyRatioPoint, EfficiencyRatioOptions } from "./efficiency-ratio";

/** Multi-Timeframe Confluence — unified score from daily/weekly/monthly signals. */
export { computeMtfConfluence } from "./mtf-confluence";
export type { MtfConfluenceResult, MtfSignal, MtfConfluenceOptions } from "./mtf-confluence";

/** Brinson-Fachler Performance Attribution — allocation/selection/interaction effects. */
export { computeAttribution } from "./performance-attribution";
export type { AttributionResult, AttributionEffect, SectorWeight } from "./performance-attribution";

/** Dividend Analytics — yield, CAGR, streak, DRIP simulation. */
export { computeDividendSummary, simulateDrip } from "./dividend-analytics";
export type { DividendPayment, DividendSummary, DripResult } from "./dividend-analytics";

/** Peer Valuation — relative valuation metrics vs peer group. */
export { computePeerValuation } from "./peer-valuation";
export type { CompanyMetrics, PeerMetricComparison, PeerValuationResult } from "./peer-valuation";

/** Trade Journal Analytics — win rate, expectancy, R-multiples, streaks. */
export { analyzeTradeJournal } from "./trade-journal";
export type { TradeEntry, TradeStats, TradeResult } from "./trade-journal";

/** Risk-Adjusted Comparison — Sharpe/Sortino/Calmar side-by-side for multiple assets. */
export { compareRiskAdjusted } from "./risk-adjusted-comparison";
export type { AssetRiskMetrics, RiskComparisonResult } from "./risk-adjusted-comparison";

/** Insider Transactions — analyze insider buying/selling sentiment. */
export { analyzeInsiderTransactions } from "./insider-transactions";
export type { InsiderTransaction, InsiderSentiment } from "./insider-transactions";

// ── Resampling & time helpers ────────────────────────────────────────────

/** Resample intraday candles to weekly/monthly timeframes. */
export { resampleCandles, TIMEFRAMES } from "./resample";
export type { ResampleOptions } from "./resample";

// ── Portfolio & equity ───────────────────────────────────────────────────

/** Build equity curve and summarise closed trades. */
export { buildEquityCurve, summarizeTrades, tradePnl } from "./equity-curve";
export type {
  ClosedTrade,
  EquityPoint as EquityCurvePoint,
  CurveStats,
  Side,
} from "./equity-curve";

/** Portfolio analytics — holdings value, sector allocation, concentration. */
export {
  totalValue,
  positionValue,
  unrealizedPnl,
  sectorAllocation,
  positionMetrics,
  topConcentration,
} from "./portfolio-analytics";
export type { Holding, SectorAllocation, PositionMetric } from "./portfolio-analytics";

// ── Volume analysis ──────────────────────────────────────────────────────

/** Volume profile — price level distribution analysis. */
export { computeVolumeProfile } from "./volume-profile";
export type { VolumeProfile, VolumeProfileBin, VolumeProfileOptions } from "./volume-profile";

// ── Correlation ──────────────────────────────────────────────────────────

/** Pearson correlation coefficient and cross-ticker matrix. */
export { pearson, correlationMatrix } from "./correlation-matrix";
export type { CorrelationInput, CorrelationResult } from "./correlation-matrix";

/** Correlation scanner — find highest/lowest correlated pairs across multiple assets. */
export { scanCorrelations } from "./correlation-scanner";
export type {
  CorrelationScanConfig,
  ScannedCorrelation,
  CorrelationScanResult,
} from "./correlation-scanner";

// ── Returns ──────────────────────────────────────────────────────────────

/** Simple, log, cumulative, and rolling return calculations. */
export {
  simpleReturns,
  logReturns,
  cumulativeReturns,
  totalReturn,
  annualizedReturn,
  rollingReturns,
} from "./returns";

// ── Anchored VWAP ────────────────────────────────────────────────────────

/** VWAP anchored to a user-selected date. */
export { anchoredVwap } from "./anchored-vwap";
export type { AnchoredVwapPoint, AnchoredVwapOptions } from "./anchored-vwap";

// ── Moving average crossovers ────────────────────────────────────────────

/** Golden/death cross detection for SMA/EMA pairs. */
export { detectMaCrossovers, crossoverFlags } from "./ma-crossover";
export type { MaCrossEvent, CrossKind } from "./ma-crossover";

// ── Linear regression ────────────────────────────────────────────────────

/** Least-squares regression line and channel for price series. */
export { linearRegression, regressionLine, regressionChannel } from "./linear-regression";
export type { LinearRegression } from "./linear-regression";

// ── Supplementary indicators ─────────────────────────────────────────────

/** Aroon Up/Down — trend age indicator. */
export { computeAroon } from "./aroon";
export type { AroonPoint } from "./aroon";

/** Chaikin Money Flow — accumulation/distribution pressure. */
export { computeChaikinMoneyFlow } from "./chaikin-money-flow";
export type { CmfPoint } from "./chaikin-money-flow";

/** Awesome Oscillator (Bill Williams). */
export { computeAwesomeOscillator } from "./awesome-oscillator";
export type { AoPoint } from "./awesome-oscillator";

/** Rolling statistics — mean, stddev, min, max, z-score. */
export { rollingMean, rollingStdDev, rollingMin, rollingMax, rollingZScore } from "./rolling-stats";

/** Monthly and day-of-week seasonal return patterns. */
export { seasonalityByMonth, seasonalityByDayOfWeek } from "./seasonality";
export type { SeasonalityBucket, DailyReturn } from "./seasonality";

/** Gap scanner — detect price gaps and gap-fill patterns. */
export {
  detectGaps,
  unfilledGaps,
  gapUps,
  gapDowns,
  gapFillRate,
  largestGaps,
  averageGapSize,
  hasRecentGap,
} from "./gap-scanner";
export type { DayData as GapDayData, Gap } from "./gap-scanner";

/** DCA simulator — dollar-cost averaging strategy modelling. */
export { simulateDca, generateDcaSchedule, dcaVsLumpSum } from "./dca-simulator";
export type { DcaInvestment, DcaResult } from "./dca-simulator";

/** Support/resistance level finder — pivot points and price clustering. */
export {
  findSwingLows,
  findSwingHighs,
  clusterLevels,
  findLevels,
  nearestSupport,
  nearestResistance,
} from "./support-resistance";
export type { PriceLevel } from "./support-resistance";

/** Volatility cone — term structure of realized vol with percentile bands. */
export {
  realizedVol,
  historicalVolDistribution,
  buildVolatilityCone,
  volPercentileRank,
} from "./volatility-cone";
export type { VolatilityConePoint, VolatilityConeResult } from "./volatility-cone";

/** Elder Ray — bull/bear power with EMA baseline. */
export { computeElderRay } from "./elder-ray";
export type { ElderRayPoint } from "./elder-ray";

/** TRIX — triple-smoothed EMA momentum oscillator. */
export { computeTrix } from "./trix";
export type { TrixPoint } from "./trix";

/** Ulcer Index — downside volatility measure. */
export { computeUlcerIndex } from "./ulcer-index";

/** Coppock Curve — long-term momentum indicator. */
export { computeCoppockCurve } from "./coppock-curve";

/** DEMA and TEMA — double/triple exponential moving averages. */
export { computeDema, computeTema } from "./dema-tema";

/** Hull Moving Average — reduced-lag weighted MA. */
export { computeHullMA } from "./hull-ma";

/** Percentile rank and rolling percentile rank. */
export { percentile, percentRank, rollingPercentRank } from "./percentile-rank";

/** Chande Momentum Oscillator (CMO). */
export { computeCmo } from "./chande-momentum-oscillator";

/** Connors RSI — composite RSI with streak and percentile rank. */
export { computeConnorsRsi } from "./connors-rsi";

/** Fisher Transform — Gaussian price normalization. */
export { computeFisherTransform } from "./fisher-transform";
export type { FisherPoint } from "./fisher-transform";

/** Vortex Indicator — trend direction and strength. */
export { computeVortex } from "./vortex-indicator";
export type { VortexPoint } from "./vortex-indicator";

/** Mass Index — reversal signal based on range expansion. */
export { computeMassIndex } from "./mass-index";

/** Know Sure Thing (KST) — multi-timeframe momentum. */
export { computeKst } from "./kst";
export type { KstPoint, KstOptions } from "./kst";

/** Detrended Price Oscillator — removes trend to isolate cycles. */
export { computeDpo } from "./dpo";

/** Percentage Price Oscillator — normalized MACD. */
export { computePpo } from "./ppo";
export type { PpoPoint } from "./ppo";

// ── Accumulation / distribution ──────────────────────────────────────────

/** Accumulation/Distribution line. */
export { computeAdLine } from "./ad-line";
export type { AdCandle } from "./ad-line";

/** Force Index — price × volume momentum. */
export { computeForceIndex, computeForceIndexRaw } from "./force-index";
export type { ForceCandle } from "./force-index";

/** Stochastic RSI — RSI fed through stochastic formula. */
export { computeStochRsi } from "./stochastic-rsi";
export type { StochRsiPoint, StochRsiOptions } from "./stochastic-rsi";

/** True Strength Index (TSI) — double-smoothed momentum. */
export { computeTsi } from "./tsi";
export type { TsiPoint, TsiOptions } from "./tsi";

/** Weighted Moving Average (WMA). */
export { computeWma } from "./wma";

/** Chaikin Oscillator — MACD of A/D line. */
export { computeChaikinOscillator } from "./chaikin-oscillator";

/** Elder Impulse System — trend + momentum color classification. */
export { computeElderImpulse } from "./elder-impulse";
export type { Impulse, ElderImpulseOptions } from "./elder-impulse";

/** Momentum — N-period price change. */
export { computeMomentum } from "./momentum";

/** Rate of Change (ROC) — percentage price change. */
export { computeRoc } from "./roc";

/** Rolling standard deviation. */
export { computeStdDev } from "./standard-deviation";
export type { StdDevOptions } from "./standard-deviation";

/** Price envelope — percentage bands around moving average. */
export { computeEnvelope } from "./envelope";
export type { EnvelopePoint } from "./envelope";

/** Williams Fractals — swing point identification. */
export { computeFractals } from "./fractals";
export type { FractalPoint } from "./fractals";

/** Ultimate Oscillator — multi-timeframe buying pressure. */
export { computeUltimateOscillator } from "./ultimate-oscillator";
export type { UltimateOscillatorOptions } from "./ultimate-oscillator";

/** Klinger Volume Oscillator — volume trend confirmation. */
export { computeKlingerOscillator } from "./klinger-oscillator";
export type { KlingerOptions, VolumeCandle } from "./klinger-oscillator";

/** Choppiness Index — trend vs range-bound classifier. */
export { computeChoppinessIndex } from "./choppiness-index";

/** Ease of Movement — price/volume relationship. */
export { computeEaseOfMovement } from "./ease-of-movement";
export type { EaseOfMovementOptions } from "./ease-of-movement";

/** Kaufman Adaptive Moving Average (KAMA). */
export { computeKama } from "./kama";
export type { KamaOptions } from "./kama";

/** ONNX pipeline — model versioning, normalization, metrics. */
export {
  DEFAULT_LABELS,
  DEFAULT_QUANTIZATION,
  createModelMeta,
  updateMetrics,
  validateTensorShape,
  shapeSize,
  trainTestSplit,
  computeNormalization,
  normalizeZScore,
  normalizeMinMax,
  computeF1,
  computeAccuracy,
} from "./_experimental/onnx-pipeline";
export type {
  ModelMeta,
  QuantizationConfig,
  ModelMetrics,
  TrainTestSplit,
  ShapeValidation,
  FeatureNormalization,
} from "./_experimental/onnx-pipeline";

// ── Candlestick patterns ─────────────────────────────────────────────────

/** Japanese candlestick pattern recognition (engulfing, doji, etc.). */

export {
  bodySize,
  candleRange,
  upperShadow,
  lowerShadow,
  isDoji,
  isHammer,
  isShootingStar,
  isSpinningTop,
  isMarubozu,
  isBullishEngulfing,
  isBearishEngulfing,
  isMorningStar,
  isEveningStar,
  isThreeWhiteSoldiers,
  isThreeBlackCrows,
  detectAllPatterns,
} from "./pattern-recognition";
export type { PatternCandle, PatternDirection, DetectedPattern } from "./pattern-recognition";

/** Backtest pattern trade statistics. */
export { evaluatePatternTrade, aggregatePatternStats, backtestPatterns } from "./pattern-backtest";
export type {
  PatternBacktestConfig,
  PatternTradeResult,
  PatternStats,
  PatternBacktestReport,
} from "./pattern-backtest";

// ── Market regime ────────────────────────────────────────────────────────

/** Classify market regime (bull/bear/neutral) using VIX, breadth, yield. */
export {
  Regime,
  classifyVix,
  classifyBreadth,
  classifyYieldCurve,
  classifyDollar,
  trendRegime,
  volatilityRegime,
  combinedRegime,
  regimeScore,
  regimeLabel,
  regimeColor,
} from "./market-regime";
export type { RegimeSignal } from "./market-regime";

// ── Economic calendar ────────────────────────────────────────────────────

/** Parse, filter, and classify economic events (FOMC, NFP, CPI, etc.). */
export {
  EventImpact,
  EventCategory,
  parseEconEvent,
  filterByImpact,
  filterByCountry,
  filterByDateRange,
  groupByDate,
  groupByCountry,
  nextEvent,
  classifyImpact,
  classifyCategory,
  formatSurprise,
  surprisePct,
  isMarketMoving,
} from "./economic-calendar";
export type { EconEvent, RawEconEvent, SurpriseDirection } from "./economic-calendar";

// ── News digest ──────────────────────────────────────────────────────────

/** RSS/Atom feed parsing, ticker extraction, and sentiment scoring. */
export {
  detectFormat,
  parseRssFeed,
  parseAtomFeed,
  parseFeed,
  extractTickers,
  groupByTicker,
  scoreSentiment,
  classifySentiment,
  deduplicateItems,
  sortByDate,
  summariseDigest,
} from "./news-digest";
export type { FeedItem, FeedFormat, SentimentLabel, DigestSummary } from "./news-digest";

// ── Strategy import/export ───────────────────────────────────────────────

/** Serialize, deserialize, and share signal strategies as URLs. */
export {
  exportStrategy,
  importStrategy,
  exportBundle,
  importBundle,
  validateExpression,
  validateVars,
  checksumPayload,
  encodeShareUrl,
  decodeShareUrl,
  payloadToClipboardText,
} from "./signal-strategy-io";
export type { StrategyPayload, StrategyBundle, ImportResult } from "./signal-strategy-io";

// ── Watchlist sharing ────────────────────────────────────────────────────

/** Encode/decode watchlists as shareable URLs and merge snapshots. */
export {
  createWatchlistSnapshot,
  encodeWatchlistUrl,
  decodeWatchlistUrl,
  decodeWatchlistPayload,
  mergeWatchlists,
  snapshotToText,
} from "./watchlist-share";
export type { WatchlistSnapshot, WatchlistImportResult, MergeResult } from "./watchlist-share";
/** URL-safe Base64 (RFC 4648 §5) — the transport encoding behind share links. */
export {
  base64UrlEncode,
  base64UrlDecode,
  base64UrlEncodeBytes,
  base64UrlDecodeBytes,
} from "./base64-url";

// ── Ticker catalog ───────────────────────────────────────────────────────

/** Offline symbol catalog + fuzzy matcher backing the ticker search box. */
export { getTickerCatalog, searchTickerCatalog, isSupportedSymbol } from "./ticker-catalog";
export type { TickerCatalogEntry, CatalogInstrument } from "./ticker-catalog";

// ── Market hours ─────────────────────────────────────────────────────────

/** Exchange schedules, open/close detection, and WebSocket gating. */
export {
  SCHEDULES,
  isMarketOpen,
  marketStatus,
  allMarketStatuses,
  isAnyMarketOpen,
  openExchanges,
  shouldConnectWs,
} from "./market-hours";
export type { MarketSchedule, ExchangeCode, MarketStatus } from "./market-hours";

/** Black-Scholes option pricing — call/put prices and Greeks. */
export { blackScholes, callGreeks, putGreeks, impliedVolatility } from "./black-scholes";
export type { BlackScholesInput, OptionPrice, Greeks } from "./black-scholes";

/** Monte Carlo portfolio simulation — path generation, percentile bands. */
export { runSimulation, estimateParams } from "./monte-carlo";
export type { MonteCarloConfig, MonteCarloResult } from "./monte-carlo";

/** Walk-forward backtesting — rolling in/out-of-sample window analysis. */
export { walkForward, anchoredWalkForward } from "./walk-forward";
export type { WalkForwardWindow, WalkForwardResult } from "./walk-forward";

/** Drawdown analysis — underwater equity curves, worst periods, recovery time. */
export {
  drawdownSeries,
  findDrawdownPeriods,
  drawdownSummary,
  worstDrawdowns,
  timeUnderwater,
} from "./drawdown-analyzer";
export type { DrawdownPeriod, DrawdownSummary } from "./drawdown-analyzer";

/** Fama-French factor model — three-factor regression, factor attribution, CAPM beta. */
export { famaFrench3Factor, factorAttribution, capmBeta } from "./factor-model";
export type { FactorExposures, FactorAttribution } from "./factor-model";

/** GARCH volatility — parameter estimation, conditional variance forecast. */
export { estimateGarch, garchVolatility, garchForecast, garchAnalysis } from "./garch";
export type { GarchParams, GarchResult } from "./garch";

/** Realized volatility estimators — Parkinson, Rogers-Satchell, Yang-Zhang, close-to-close. */
export {
  parkinsonVol,
  rogersSatchellVol,
  yangZhangVol,
  closeToCloseVol,
  allVolEstimates,
} from "./realized-volatility";
export type { OHLCBar, VolEstimates } from "./realized-volatility";

/** Volatility ranking — annualized vol, daily vol, rank, classify, least-volatile screening.
 *  Note: `dailyReturns` is already exported from `analytics`. */
export {
  standardDeviation,
  annualizedVolatility,
  dailyVolatility,
  rankByVolatility,
  classifyVolatility,
  getLeastVolatile,
} from "./volatility-rank";
export type { VolatilityRank } from "./volatility-rank";

/** Cointegration tests — Engle-Granger, ADF statistic, OLS regression, half-life. */
export { ols, adfStatistic, ADF_CRITICAL_VALUES, engleGranger, halfLife } from "./cointegration";

/** Pairs trading signals — hedge ratio, spread construction, z-score windows, signal generation. */
export { hedgeRatio, pairsSpread, pairsSignals } from "./pairs-trading";
export type { PairsSignal, PairsTradeSignal, PairsConfig } from "./pairs-trading";

/** Pair correlation — Pearson correlation, matrix building, most/least correlated pairs.
 *  Note: `dailyReturns` already exported from `analytics`. */
export {
  pearsonCorrelation,
  tickerCorrelation,
  buildCorrelationMatrix,
  mostCorrelatedPairs,
  leastCorrelatedPairs,
} from "./pair-correlation";
export type { CorrelationPair, CorrelationMatrix } from "./pair-correlation";

/** Dispersion trading — implied correlation, realized correlation, dispersion analysis. */
export {
  impliedCorrelation,
  realizedCorrelation,
  dispersionAnalysis,
  indexVarianceFromConstituents,
} from "./dispersion-trading";
export type { DispersionMetrics, ConstituentData } from "./dispersion-trading";

/** Regime-switching model — Markov-switching EM, Hamilton filter, Kim smoother. */
export {
  estimateRegimeParams,
  hamiltonFilter,
  kimSmoother,
  regimeSwitching,
} from "./regime-switching";
export type { RegimeParams, RegimeResult } from "./regime-switching";

/** Markov chain analysis — transition matrix estimation, stationary distribution, regime sequences. */
export {
  estimateTransitionMatrix,
  stationaryDistribution,
  meanRecurrenceTime,
  classifyRegimes,
  buildMarkovChain,
  simulateMarkovChain,
} from "./markov-chain";
export type { MarkovChain, RegimeSequence } from "./markov-chain";

/** Hurst exponent — R/S analysis, trend/mean-reversion classification. */
export { hurstExponent, isTrending, isMeanReverting } from "./hurst-exponent";
export type { HurstResult } from "./hurst-exponent";

/** Risk parity allocation — inverse-vol weights, risk contributions, allocation comparison. */
export {
  inverseVolWeights,
  riskContributions,
  riskParityAllocate,
  equalWeight,
  compareAllocations,
} from "./risk-parity";
export type { RiskParityInput, RiskParityResult } from "./risk-parity";

/** Risk contribution decomposition — Euler decomposition, incremental VaR, risk-parity weights. */
export { eulerDecomposition, riskParityWeights, incrementalVaR } from "./risk-contribution";
export type { RiskDecomposition } from "./risk-contribution";

/** Entropy measures — Shannon, permutation, sample entropy; complexity classification. */
export {
  shannonEntropy,
  normalizedEntropy,
  permutationEntropy,
  normalizedPermutationEntropy,
  sampleEntropy,
  interpretEntropy,
} from "./entropy";

/** Spectral density — periodogram, Welch PSD estimate, peak detection. */
export { periodogram, welchSpectrum, detectPeaks } from "./spectral-density";
export type { SpectralDensity } from "./spectral-density";

/** Wavelet analysis — Haar transform, multi-level decomposition, denoising, energy. */
export {
  haarForward,
  haarInverse,
  waveletDecompose,
  waveletDenoise,
  waveletEnergy,
} from "./wavelet";
export type { WaveletLevel, WaveletDecomposition } from "./wavelet";

/** Fourier cycle analysis — DFT, dominant cycles, signal reconstruction, phase estimate. */
export {
  dft,
  dominantCycles,
  spectralDensity,
  reconstructSignal,
  cyclePhaseEstimate,
} from "./fourier-cycles";
export type { FourierComponent } from "./fourier-cycles";

/** Autocorrelation — ACF, PACF, Ljung-Box test, correlation analysis. */
export {
  autocorrelation,
  acf,
  partialAutocorrelation,
  pacf,
  ljungBox,
  autocorrelationAnalysis,
} from "./autocorrelation";

/** Corporate action adjustment — split-adjust and dividend-adjust OHLCV series. */
export {
  applyCorpActions,
  applySplits,
  applyDividends,
  cumulativeSplitFactor,
} from "./corp-actions";
export type { SplitEvent, DividendEvent, AdjustmentOptions } from "./corp-actions";

// ── Fundamental screener filters (Q3) ────────────────────────────────────
export {
  matchesFundamentalFilters,
  applyFundamentalFilters,
  GICS_SECTORS,
} from "./screener-fundamentals";
export type { FundamentalFilterParams, GicsSector } from "./screener-fundamentals";

// ── Indicator configuration schema (Q4 / RF9) ─────────────────────────────
export { DEFAULT_INDICATOR_CONFIGS, validateIndicatorConfig } from "./indicator-config";
export type {
  IndicatorConfig,
  IndicatorType,
  IndicatorConfigBase,
  SmaConfig,
  EmaConfig,
  RsiConfig,
  MacdConfig,
  BollingerConfig,
  StochasticConfig,
  AdxConfig,
  AtrConfig,
  VwapConfig,
  HexColor,
  ConfigValidationResult,
} from "./indicator-config";

// ============================================================================
// P10 — modules that were tested but absent from the public API surface.
// Every file under src/domain/ must be reachable from this barrel; see
// tests/unit/domain/barrel-completeness.test.ts for the guard.
// ============================================================================

/** Price alert proximity check — determine how close current prices are to configured alert levels for watchlist overview display. */
export {
  calculateProximity,
  checkAlertProximity,
  checkMultipleAlerts,
  getAlertsWithinThreshold,
  formatProximity,
} from "./alert-proximity";
export type { AlertProximity } from "./alert-proximity";
/** ATR trailing stop — dynamic stop-loss levels based on Average True Range for volatility-adjusted exits. */
export {
  trueRange,
  atr,
  longTrailingStop,
  shortTrailingStop,
  trailingStopSeries,
} from "./atr-trailing-stop";
export type { TrailingStopResult } from "./atr-trailing-stop";
/** Breakout detector — identify price breakouts above resistance or below support with optional volume confirmation. */
export {
  rollingHigh,
  rollingLow,
  detectBreakouts,
  confirmedBreakouts,
  lastBreakout,
} from "./breakout-detector";
export type { BreakoutCandle, BreakoutEvent } from "./breakout-detector";
/** Candlestick pattern detector — identify common bullish/bearish single and multi-bar patterns from OHLC data. */
export { isEngulfing, scanPatterns, filterByType, lastPattern } from "./candlestick-patterns";
export type { PatternMatch } from "./candlestick-patterns";
/** Causal impact analysis — simplified Bayesian structural time series. */
export { causalImpact } from "./causal-impact";
export type { CausalImpactResult, CausalImpactConfig } from "./causal-impact";
/** Bayesian changepoint detection — identifies structural breaks in time series. */
export { bayesianChangepoints, cusumChangepoints } from "./changepoint-detection";
export type { Changepoint, ChangepointResult } from "./changepoint-detection";
/** Commission & slippage model for backtesting. */
export {
  calculateCommission,
  applySlippage,
  netTradePnl,
  totalFees,
  DEFAULT_COMMISSION,
  ZERO_COMMISSION,
} from "./commission";
export type { CommissionConfig } from "./commission";
/** Copula dependence — models joint tail dependence between assets. */
export {
  fitClayton,
  fitGumbel,
  fitGaussian,
  dependenceAnalysis,
  toUniform,
  kendallTau,
} from "./copula";
export type { CopulaFit, DependenceAnalysis } from "./copula";
/** Ticker correlation quick-check — compute Pearson correlation coefficient between two price series without needing the full correlation matrix card. */
export { computeReturns, interpretCorrelation, correlationCheck } from "./correlation-check";
/** Correlation Heatmap render-data helpers (G22). */
export { rToHslColor, buildHeatmapRenderData, sliceCorrelationResult } from "./correlation-heatmap";
export type { HeatmapCell, HeatmapRenderData } from "./correlation-heatmap";
/** Custom index builder — create equal-weighted or cap-weighted custom indices from a basket of assets. */
export { equalWeightedIndex, capWeightedIndex, rebalanceWeights } from "./custom-index";
export type { IndexComponent, IndexResult } from "./custom-index";
/** Dividend Discount Model (DDM) — intrinsic value estimation. */
export { gordonGrowthModel, twoStageDDM, hModelDDM, impliedGrowthRate, ddmAnalysis } from "./ddm";
export type { DDMResult } from "./ddm";
/** Distribution fitting tests — Kolmogorov-Smirnov and Anderson-Darling. */
export {
  kolmogorovSmirnov,
  andersonDarling,
  normalCdf,
  normalityTest,
  exponentialTest,
} from "./distribution-fit";
export type { GoodnessOfFitResult } from "./distribution-fit";
/** Dividend calendar planner — track ex-dividend dates, payment schedules, and projected annual income from holdings. */
export {
  projectIncome,
  totalAnnualIncome,
  monthlyBreakdown,
  upcomingExDates,
  dividendYield,
} from "./dividend-calendar";
export type { DividendEntry, DividendProjection, MonthlyBreakdown } from "./dividend-calendar";
/** Earnings surprise tracker — record and analyze actual vs estimated EPS for post-earnings momentum analysis. */
export {
  calculateSurprise,
  batchSurprises,
  beatRate,
  averageSurprise,
  topBeats,
  topMisses,
  beatStreak,
  classifySurprise,
} from "./earnings-surprise";
export type { EarningsResult, EarningsSurprise } from "./earnings-surprise";
/** Efficient frontier — Markowitz mean-variance portfolio optimization. */
export {
  assetStatsFromReturns,
  covarianceMatrix,
  portfolioVolatility,
  portfolioReturn,
  efficientFrontier,
} from "./efficient-frontier";
export type { AssetStats, PortfolioPoint } from "./efficient-frontier";
/** ETF Constituent Drilldown domain (G18). */
export {
  buildEtfDrilldown,
  topHoldingsByWeight,
  topHoldersByContribution,
  positiveContributors,
  negativeContributors,
} from "./etf-drilldown";
export type { EtfHolding, EtfDrilldownEntry, EtfDrilldownResult } from "./etf-drilldown";
/** Fractal dimension — measures market complexity and roughness. */
export {
  higuchiFractalDimension,
  boxCountingDimension,
  katzFractalDimension,
  interpretFractalDimension,
} from "./fractal-dimension";
/** Garman-Klass and related intraday volatility estimators. */
export { garmanKlassSingle, garmanKlassVol, compareEstimators } from "./garman-klass";
/** Granger causality — test whether one time series helps predict another. */
export { grangerCausality, bidirectionalGranger, selectLagOrder } from "./granger-causality";
export type { GrangerResult, BidirectionalGranger } from "./granger-causality";
/** Hawkes process — self-exciting point process for event clustering. */
export { fitHawkes, simulateHawkes, hawkesIntensity } from "./hawkes-process";
export type { HawkesParams, HawkesResult } from "./hawkes-process";
/** Heatmap Sector Drill-down domain helpers (G21). */
export {
  computeAbsoluteMove,
  buildDrilldownEntries,
  sortDrilldown,
  buildBreadcrumb,
  buildDrilldown,
  computeAttributionBar,
} from "./heatmap-drilldown";
export type { DrilldownSortKey, DrilldownEntry, DrilldownResult } from "./heatmap-drilldown";
/** Implied volatility surface — construct vol smile/skew from option prices. */
export { buildVolSurface } from "./implied-volatility";
export type { OptionQuote, IVPoint, VolSurface } from "./implied-volatility";
/** Information ratio and related performance metrics. */
export {
  informationRatio,
  trackingError,
  activeReturn,
  treynorRatio,
  computeBeta,
  mSquared,
  performanceAttribution,
} from "./information-ratio";
/** Intraday high/low distance — calculate how far the current price is from the day's high and low, useful for timing entries. */
export {
  calculateRangeDistance,
  batchRangeDistance,
  nearHigh,
  nearLow,
  widestRange,
  narrowestRange,
  averagePositionInRange,
} from "./intraday-range";
export type { IntradayRange, RangeDistance } from "./intraday-range";
/** Merton Jump Diffusion model — extends geometric Brownian motion with Poisson jumps. */
export { estimateJumpDiffusion, mertonCallPrice, detectJumps } from "./jump-diffusion";
export type { JumpDiffusionParams, JumpDiffusionResult } from "./jump-diffusion";
/** Kalman filter — adaptive price smoothing and trend estimation. */
export {
  initKalman,
  kalmanStep,
  kalmanFilter,
  adaptiveKalmanFilter,
  kalmanTrendSignal,
} from "./kalman-filter";
export type { KalmanState, KalmanParams } from "./kalman-filter";
/** Kelly criterion calculator — determine optimal position sizing based on win rate and win/loss ratio. */
export { kellyAnalysis, kellyFromTrades, kellyPositionSize } from "./kelly-criterion";
export type { KellyResult } from "./kelly-criterion";
/** Liquidity metrics — measures of market liquidity and trading costs. */
export {
  amihudIlliquidity,
  rollSpread,
  turnoverRatio,
  kyleLambda,
  liquidityScore,
  liquidityAnalysis,
} from "./liquidity-metrics";
export type { LiquidityMetrics } from "./liquidity-metrics";
/** Moving average ribbon — compute multiple MAs (5,10,20,50,100,200) with spread/convergence metrics for trend analysis. */
export { computeRibbon, ribbonSummary, findCrossovers } from "./ma-ribbon";
export type { RibbonPoint, RibbonSummary } from "./ma-ribbon";
/** Market impact model (Almgren-Chriss) — optimal execution with price impact. */
export { optimalExecution, squareRootImpact, vwapParticipation } from "./market-impact";
export type { MarketImpactParams, ExecutionSchedule } from "./market-impact";
/** Mean reversion scanner — identify assets that are far from their moving average (z-score based) for potential reversion trades. */
export {
  zScore,
  deviationFromMa,
  analyzeReversion,
  scanForReversion,
  mostOversold,
  mostOverbought,
} from "./mean-reversion";
export type { MeanReversionSignal } from "./mean-reversion";
/** Multi-ticker momentum rank — rank tickers by rate-of-change performance over configurable lookback periods for relative strength comparison. */
export {
  rateOfChange,
  rankByMomentum,
  compositeMomentum,
  rankByCompositeMomentum,
  getMomentumLeaders,
  getMomentumLaggards,
} from "./momentum-rank";
export type { MomentumRank } from "./momentum-rank";
/** Multi-timeframe trend — consolidate trend signals across daily, weekly, and monthly timeframes for confluence. */
export {
  detectTrend,
  resampleWeekly,
  resampleMonthly,
  multiTimeframeTrend,
  isFullyAligned,
} from "./multi-timeframe";
export type {
  Timeframe,
  TrendDirection,
  TimeframeTrend,
  MultiTrendResult,
} from "./multi-timeframe";
/** Company name enrichment helpers (G19). */
export {
  normaliseCompanyName,
  extractShortName,
  formatDisplayName,
  enrichWatchlistEntry,
  buildNameMap,
} from "./name-enrichment";
/** Optimal portfolio turnover — transaction cost-aware rebalancing. */
export {
  optimalRebalance,
  computeTurnover,
  breakEvenFrequency,
  cumulativeTurnover,
} from "./optimal-turnover";
export type { TurnoverResult, RebalanceConfig } from "./optimal-turnover";
/** Order flow imbalance — buy/sell pressure from tick-level trade classification. */
export {
  tickRuleClassify,
  bulkVolumeClassify,
  orderFlowImbalance,
  computeVPIN,
  flowBuckets,
} from "./order-flow";
export type { OrderFlowMetrics, FlowBucket } from "./order-flow";
/** Ornstein-Uhlenbeck (OU) process — mean-reversion parameter estimation. */
export { estimateOU, ouAnalysis, simulateOU, expectedTimeToMean } from "./ornstein-uhlenbeck";
export type { OUParams, OUResult } from "./ornstein-uhlenbeck";
/** Profit factor and trade performance metrics from a list of trades. */
export { profitFactor, equityCurve } from "./profit-factor";
export type { ProfitFactorResult } from "./profit-factor";
/** Range bar chart computation. */
export { computeRangeBars, suggestRangeSize } from "./range-bars";
export type { RangeBar, RangeBarInput } from "./range-bars";
/** Renko chart brick computation. */
export { computeRenko, suggestBrickSize } from "./renko";
export type { RenkoBrick, RenkoInput } from "./renko";
/** Risk/reward ratio calculator — evaluate trade setups with entry, stop loss, and target price. */
export {
  analyzeRiskReward,
  positionSizeFromRisk,
  dollarRisk,
  expectedValue,
  batchAnalyze,
  filterFavorable,
  sortByRatio,
} from "./risk-reward";
export type { TradeSetup, RiskRewardAnalysis } from "./risk-reward";
/** Sector allocation calculator — compute sector weightings and concentration metrics for a portfolio of holdings. */
export {
  calculateAllocations,
  herfindahlIndex,
  allocationSummary,
  overweightSectors,
  underweightSectors,
  deviationFromEqual,
} from "./sector-allocation";
export type { AllocationSummary } from "./sector-allocation";
/** Data snapshot diffing — compare two point-in-time ticker data snapshots to highlight what changed (price, volume, signal flips). */
export {
  diffSnapshots,
  summarizeDiff,
  getSignificantMovers,
  sortByLargestMove,
  getSignalFlips,
} from "./snapshot-diff";
export type { TickerData, SnapshotDiff, DiffSummary } from "./snapshot-diff";
/** Gain/loss streak tracker — analyze consecutive up/down days for streak detection and pattern awareness. */
export {
  currentStreak,
  longestGainStreak,
  longestLossStreak,
  analyzeStreak,
  rankByStreak,
  getGainStreaks,
  getLossStreaks,
} from "./streak-tracker";
export type { StreakResult } from "./streak-tracker";
/** Tail index estimation (Extreme Value Theory) — Hill estimator, peaks-over-threshold. */
export {
  hillEstimator,
  peaksOverThreshold,
  meanExcessFunction,
  gpdRiskMeasures,
} from "./tail-index";
export type { TailIndexResult, PeaksOverThreshold } from "./tail-index";
/** Tail risk metrics — CVaR (Conditional Value at Risk) / Expected Shortfall. */
export {
  historicalVaR,
  cvar,
  parametricVaR,
  cornishFisherVaR,
  tailRiskAnalysis,
} from "./tail-risk";
/** Ticker comparison table — side-by-side data comparison for multiple tickers across various metrics. */
export {
  buildComparison,
  rankByMetric,
  distanceFrom52WeekHigh,
  distanceFrom52WeekLow,
  performanceRank,
} from "./ticker-comparison";
export type { TickerMetrics, ComparisonColumn, ComparisonResult } from "./ticker-comparison";
/** Trade performance stats — calculate key trading metrics from a history of completed trades. */
export { computeStats, streaks, avgReturnPercent } from "./trade-stats";
/** Turtle Trading System — Donchian breakout trend-following with position sizing. */
export { donchianChannel, computeATR, turtleTrading } from "./turtle-trading";
export type { TurtleConfig, TurtleSignal, TurtleResult } from "./turtle-trading";
/** VaR backtest — Kupiec POF test and Christoffersen independence/conditional coverage tests. */
export { kupiecTest, christoffersenTest, varBacktest } from "./var-backtest";
export type { KupiecResult, ChristoffersenResult, VarBacktestResult } from "./var-backtest";
/** Chart comparison — normalizes multiple ticker candle series to percentage change from their respective starting prices. */
export { normalizeForComparison, computeComparisonStats } from "./chart-comparison";
export type { ComparisonPoint, ComparisonSeries, ComparisonStats } from "./chart-comparison";
export { validateOhlcv } from "./validate-ohlcv";
export type { OhlcvQualityIssue, OhlcvQualityOptions, OhlcvQualityReport } from "./validate-ohlcv";
/** Earnings Calendar domain — pure types and transforms (H18). */
export { parseEarningsResponse, filterUpcoming, getDaysUntilEarnings } from "./earnings-calendar";
export type { EarningsEntry, RawEarningsItem } from "./earnings-calendar";
/** Fibonacci retracement & extension calculator — compute key Fibonacci levels from swing high/low points. */
export { fibRetracements, fibExtensions, fibAnalysis, nearestFibLevel, autoFib } from "./fibonacci";
export type { FibLevel, FibResult } from "./fibonacci";
/** Macro Dashboard domain — pure regime classification and formatters (H19). */
export {
  getMacroTicker,
  classifyMacroRegime,
  classifyMacroRegimeExtended,
  formatMacroChange,
  regimeCssClass,
  MACRO_TICKERS,
} from "./macro-dashboard";
export type { MacroRegime, MacroTicker, MacroSnapshot } from "./macro-dashboard";
/** Market Breadth domain — pure computation layer (G23). */
export { computeMarketBreadth, classifyBreadthCondition } from "./market-breadth";
export type { BreadthTicker, BreadthResult } from "./market-breadth";
/** Portfolio benchmark comparison — compare portfolio returns against a market index. */
export {
  computeBenchmarkComparison,
  buildReturnSeries,
  BENCHMARK_OPTIONS,
  DEFAULT_BENCHMARK,
} from "./portfolio-benchmark";
export type { BenchmarkComparison, ReturnSeries, BenchmarkTicker } from "./portfolio-benchmark";
/** Portfolio rebalance calculator — compute trades needed to bring a portfolio back to target allocation weights. */
export {
  calculateRebalance,
  actionableTrades,
  totalBuyAmount,
  totalSellAmount,
  sharesToTrade,
  validateTargets,
} from "./portfolio-rebalance";
export type {
  CurrentHolding,
  TargetAllocation,
  RebalanceTrade,
  RebalancePlan,
} from "./portfolio-rebalance";
/** Relative Strength Comparison domain helpers (H21). */
export {
  normalizeSeries,
  windowStartDate,
  computeRelativeStrengths,
  findOutperformer,
  findUnderperformer,
  summariseReturns,
} from "./relative-strength";
export type { RSPoint, RSeries, RSComparisonResult, RSInput } from "./relative-strength";
/** Sector Rotation domain — relative strength ranking (H20). */
export {
  computeReturn,
  computeRelativeReturn,
  classifySectorPerformance,
  rankSectors,
  SECTOR_ETFS,
} from "./sector-rotation";
export type { SectorEtf, SectorReturnInput, SectorRankEntry } from "./sector-rotation";
/** Strategy comparison — run two backtest configurations side-by-side on the same candle data and produce comparative metrics. */
export { compareStrategies, renderComparisonTable } from "./strategy-comparison";
export type {
  StrategyComparisonInput,
  StrategyComparisonResult,
  StrategyDelta,
} from "./strategy-comparison";
/** Volume-weighted price calculations — VWAP and TWAP from intraday price/volume data. */
export { vwap, runningVwap, vwapWithBands, twap, simpleTwap, vwapDeviation } from "./vwap";
export type { PriceVolume, TimedPrice, VwapResult } from "./vwap";
