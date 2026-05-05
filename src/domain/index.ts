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

// ── ML / ONNX inference ──────────────────────────────────────────────────

/** ONNX Runtime helpers — model loading, tensor preprocessing, inference. */
export {
  onnxSupported,
  preprocessCandles,
  softmax,
  argmax,
  topK,
  buildInputTensor,
  createModelLoader,
} from "./onnx-patterns";
export type {
  OnnxCandle,
  ModelLoaderOptions,
  ModelSession,
  TopKResult,
  TensorSpec,
  OrtLike,
} from "./onnx-patterns";

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
} from "./onnx-pipeline";
export type {
  ModelMeta,
  QuantizationConfig,
  ModelMetrics,
  TrainTestSplit,
  ShapeValidation,
  FeatureNormalization,
} from "./onnx-pipeline";

// ── Candlestick patterns ─────────────────────────────────────────────────

/** Japanese candlestick pattern recognition (engulfing, doji, etc.). */

export {
  bodySize,
  candleRange,
  upperShadow,
  lowerShadow,
  isBullish as isBullishCandle,
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
