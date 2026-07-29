/**
 * Public API barrel for `src/types` — shared interfaces and type aliases.
 *
 * The base of the import chain (`types <- domain <- core <- providers <- cards <- ui`):
 * this layer is types-only and must not import from any other `src/` layer.
 */
export type {
  DailyCandle,
  MethodSignal,
  ConsensusResult,
  WatchlistEntry,
  AppConfig,
  AlertRecord,
  Holding,
  MethodWeights,
  CardId,
  CardSettingsMap,
} from "./domain";
export type { SignalDirection, MethodName, SmaPeriod } from "./domain";
export { SMA_PERIODS, DEFAULT_METHOD_WEIGHTS } from "./domain";

export {
  Brands,
  BrandError,
  ticker,
  tryTicker,
  isoDate,
  isoTimestamp,
  uuid,
  nonNegativeInt,
  nonNegativeNumber,
  unitInterval,
  percent,
} from "./branded";
export type {
  Brand,
  Ticker,
  IsoDate,
  IsoTimestamp,
  Uuid,
  NonNegativeInt,
  NonNegativeNumber,
  UnitInterval,
  Percent,
} from "./branded";

export {
  TickerSchema,
  IsoDateSchema,
  IsoTimestampSchema,
  UuidSchema,
  NonNegativeIntSchema,
  NonNegativeNumberSchema,
  UnitIntervalSchema,
  SignalDirectionSchema,
  MethodNameSchema,
  DailyCandleSchema,
  MethodSignalSchema,
  ConsensusResultSchema,
  WatchlistEntrySchema,
  MethodWeightsSchema,
  WatchlistCardSettingsSchema,
  ChartCardSettingsSchema,
  ConsensusCardSettingsSchema,
  ScreenerCardSettingsSchema,
  HeatmapCardSettingsSchema,
  BacktestCardSettingsSchema,
  AlertsCardSettingsSchema,
  PortfolioCardSettingsSchema,
  RiskCardSettingsSchema,
  ThemeSchema,
  AppConfigSchema,
  YahooChartSchema,
  PolygonAggsSchema,
  CoinGeckoOhlcSchema,
  parseOrThrow,
  flattenIssues,
} from "./valibot-schemas";
