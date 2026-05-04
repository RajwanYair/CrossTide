/**
 * G5 — `expect-type` assertions for domain/index.ts public exports.
 *
 * These tests use Vitest's built-in `expectTypeOf` to verify that the
 * exported function signatures and return types are exactly what consumers
 * depend on.  Any breaking signature change will cause a compile error here
 * before it reaches the bundle.
 */
import { describe, it, expectTypeOf } from "vitest";
import type {
  DailyCandle,
  ConsensusResult,
  MethodSignal,
  MethodWeights,
  SignalDirection,
} from "../../../src/types/domain";
import {
  // Calculators
  computeSma,
  computeSmaSeries,
  computeEma,
  computeEmaSeries,
  computeRsi,
  computeRsiSeries,
  computeMacdSeries,
  computeAtr,
  computeAtrSeries,
  computeBollinger,
  computeBollingerSeries,
  computeStochastic,
  computeStochasticSeries,
  computeObv,
  computeObvSeries,
  computeAdx,
  computeAdxSeries,
  computeCci,
  computeCciSeries,
  computeMfi,
  computeMfiSeries,
  computeWilliamsR,
  computeWilliamsRSeries,
  computeSar,
  computeSarSeries,
  computeSuperTrend,
  computeSuperTrendSeries,
  computeVwap,
  computeVwapSeries,
  // Analytics
  dailyReturns,
  sharpeRatio,
  sortinoRatio,
  maxDrawdown,
  // Position sizing
  riskBasedSize,
  kellyFraction,
  halfKellySize,
  // Consensus & signals
  evaluateConsensus,
  aggregateSignals,
  aggregateConsensus,
  // Backtest
  runBacktest,
  computeBacktestMetrics,
  // Alert state machine
  createAlertState,
  evaluateAlerts,
  // Cross-up
  detectCrossUp,
  // Type re-exports (validate they exist)
  isTicker,
  isISODate,
} from "../../../src/domain/index";
import type {
  SmaPoint,
  EmaPoint,
  RsiPoint,
  MacdPoint,
  AtrPoint,
  BollingerPoint,
  StochasticPoint,
  ObvPoint,
  AdxPoint,
  CciPoint,
  MfiPoint,
  WilliamsRPoint,
  SarPoint,
  SuperTrendPoint,
  VwapPoint,
  BacktestConfig,
  BacktestResult,
  BacktestTrade,
  RiskBasedSizingInput,
  CrossUpResult,
} from "../../../src/domain/index";
import type { BacktestMetrics, EquityPoint } from "../../../src/domain/index";
import type { TickerAlertState, FiredAlert } from "../../../src/domain/index";

const candles: DailyCandle[] = [];

describe("G5 — domain/index.ts type assertions", () => {
  // ─── SMA ─────────────────────────────────────────────────────────────────
  it("computeSma returns number | null", () => {
    expectTypeOf(computeSma(candles)).toEqualTypeOf<number | null>();
    expectTypeOf(computeSma(candles, 50)).toEqualTypeOf<number | null>();
  });

  it("computeSmaSeries returns SmaPoint[]", () => {
    expectTypeOf(computeSmaSeries(candles)).toEqualTypeOf<SmaPoint[]>();
  });

  // ─── EMA ─────────────────────────────────────────────────────────────────
  it("computeEma returns number | null", () => {
    expectTypeOf(computeEma(candles)).toEqualTypeOf<number | null>();
  });

  it("computeEmaSeries returns EmaPoint[]", () => {
    expectTypeOf(computeEmaSeries(candles)).toEqualTypeOf<EmaPoint[]>();
  });

  // ─── RSI ─────────────────────────────────────────────────────────────────
  it("computeRsi returns number | null", () => {
    expectTypeOf(computeRsi(candles)).toEqualTypeOf<number | null>();
  });

  it("computeRsiSeries returns RsiPoint[]", () => {
    expectTypeOf(computeRsiSeries(candles)).toEqualTypeOf<RsiPoint[]>();
  });

  // ─── MACD ────────────────────────────────────────────────────────────────
  it("computeMacdSeries returns MacdPoint[]", () => {
    expectTypeOf(computeMacdSeries(candles)).toEqualTypeOf<MacdPoint[]>();
  });

  // ─── ATR ─────────────────────────────────────────────────────────────────
  it("computeAtr returns number | null", () => {
    expectTypeOf(computeAtr(candles)).toEqualTypeOf<number | null>();
  });

  it("computeAtrSeries returns AtrPoint[]", () => {
    expectTypeOf(computeAtrSeries(candles)).toEqualTypeOf<AtrPoint[]>();
  });

  // ─── Bollinger ───────────────────────────────────────────────────────────
  it("computeBollinger returns BollingerPoint | null", () => {
    expectTypeOf(computeBollinger(candles)).toEqualTypeOf<BollingerPoint | null>();
  });

  it("computeBollingerSeries returns BollingerPoint[]", () => {
    expectTypeOf(computeBollingerSeries(candles)).toEqualTypeOf<BollingerPoint[]>();
  });

  // ─── Stochastic ──────────────────────────────────────────────────────────
  it("computeStochastic returns StochasticPoint | null", () => {
    expectTypeOf(computeStochastic(candles)).toEqualTypeOf<StochasticPoint | null>();
  });

  it("computeStochasticSeries returns StochasticPoint[]", () => {
    expectTypeOf(computeStochasticSeries(candles)).toEqualTypeOf<StochasticPoint[]>();
  });

  // ─── OBV ─────────────────────────────────────────────────────────────────
  it("computeObv returns number", () => {
    expectTypeOf(computeObv(candles)).toEqualTypeOf<number>();
  });

  it("computeObvSeries returns ObvPoint[]", () => {
    expectTypeOf(computeObvSeries(candles)).toEqualTypeOf<ObvPoint[]>();
  });

  // ─── ADX ─────────────────────────────────────────────────────────────────
  it("computeAdx returns AdxPoint | null", () => {
    expectTypeOf(computeAdx(candles)).toEqualTypeOf<AdxPoint | null>();
  });

  it("computeAdxSeries returns AdxPoint[]", () => {
    expectTypeOf(computeAdxSeries(candles)).toEqualTypeOf<AdxPoint[]>();
  });

  // ─── CCI ─────────────────────────────────────────────────────────────────
  it("computeCci returns number | null", () => {
    expectTypeOf(computeCci(candles)).toEqualTypeOf<number | null>();
  });

  it("computeCciSeries returns CciPoint[]", () => {
    expectTypeOf(computeCciSeries(candles)).toEqualTypeOf<CciPoint[]>();
  });

  // ─── MFI ─────────────────────────────────────────────────────────────────
  it("computeMfi returns number | null", () => {
    expectTypeOf(computeMfi(candles)).toEqualTypeOf<number | null>();
  });

  it("computeMfiSeries returns MfiPoint[]", () => {
    expectTypeOf(computeMfiSeries(candles)).toEqualTypeOf<MfiPoint[]>();
  });

  // ─── Williams %R ─────────────────────────────────────────────────────────
  it("computeWilliamsR returns number | null", () => {
    expectTypeOf(computeWilliamsR(candles)).toEqualTypeOf<number | null>();
  });

  it("computeWilliamsRSeries returns WilliamsRPoint[]", () => {
    expectTypeOf(computeWilliamsRSeries(candles)).toEqualTypeOf<WilliamsRPoint[]>();
  });

  // ─── SAR ─────────────────────────────────────────────────────────────────
  it("computeSar returns number | null", () => {
    expectTypeOf(computeSar(candles)).toEqualTypeOf<number | null>();
  });

  it("computeSarSeries returns SarPoint[]", () => {
    expectTypeOf(computeSarSeries(candles)).toEqualTypeOf<SarPoint[]>();
  });

  // ─── SuperTrend ──────────────────────────────────────────────────────────
  it("computeSuperTrend returns SuperTrendPoint | null", () => {
    expectTypeOf(computeSuperTrend(candles)).toEqualTypeOf<SuperTrendPoint | null>();
  });

  it("computeSuperTrendSeries returns SuperTrendPoint[]", () => {
    expectTypeOf(computeSuperTrendSeries(candles)).toEqualTypeOf<SuperTrendPoint[]>();
  });

  // ─── VWAP ────────────────────────────────────────────────────────────────
  it("computeVwap returns number | null", () => {
    expectTypeOf(computeVwap(candles)).toEqualTypeOf<number | null>();
  });

  it("computeVwapSeries returns VwapPoint[]", () => {
    expectTypeOf(computeVwapSeries(candles)).toEqualTypeOf<VwapPoint[]>();
  });

  // ─── Analytics ───────────────────────────────────────────────────────────
  it("dailyReturns returns number[]", () => {
    expectTypeOf(dailyReturns(candles)).toEqualTypeOf<number[]>();
  });

  it("sharpeRatio returns number | null", () => {
    expectTypeOf(sharpeRatio(candles)).toEqualTypeOf<number | null>();
  });

  it("sortinoRatio returns number | null", () => {
    expectTypeOf(sortinoRatio(candles)).toEqualTypeOf<number | null>();
  });

  it("maxDrawdown returns number", () => {
    expectTypeOf(maxDrawdown(candles)).toEqualTypeOf<number>();
  });

  // ─── Position sizing ─────────────────────────────────────────────────────
  it("riskBasedSize accepts RiskBasedSizingInput and returns number", () => {
    expectTypeOf(riskBasedSize).parameter(0).toEqualTypeOf<RiskBasedSizingInput>();
    expectTypeOf(
      riskBasedSize({
        accountEquity: 10000,
        riskPerTrade: 0.01,
        entry: 150,
        stopLoss: 145,
      }),
    ).toEqualTypeOf<number>();
  });

  it("kellyFraction returns number", () => {
    expectTypeOf(kellyFraction({ winRate: 0.55, avgWin: 2, avgLoss: 1 })).toEqualTypeOf<number>();
  });

  it("halfKellySize returns number", () => {
    expectTypeOf(
      halfKellySize({ winRate: 0.55, avgWin: 2, avgLoss: 1, accountEquity: 10000 }),
    ).toEqualTypeOf<number>();
  });

  // ─── Consensus & signals ─────────────────────────────────────────────────
  it("evaluateConsensus returns ConsensusResult", () => {
    const signals: MethodSignal[] = [];
    const weights: MethodWeights = {};
    expectTypeOf(evaluateConsensus("AAPL", signals, weights)).toEqualTypeOf<ConsensusResult>();
  });

  it("aggregateSignals returns MethodSignal[]", () => {
    expectTypeOf(aggregateSignals(candles, [])).toEqualTypeOf<MethodSignal[]>();
  });

  it("aggregateConsensus returns ConsensusResult", () => {
    expectTypeOf(aggregateConsensus(candles, [])).toEqualTypeOf<ConsensusResult>();
  });

  // ─── Backtest ─────────────────────────────────────────────────────────────
  it("runBacktest returns BacktestResult", () => {
    const config: BacktestConfig = {
      ticker: "AAPL",
      initialCapital: 10000,
      methods: ["RSI"],
      windowSize: 14,
    };
    expectTypeOf(runBacktest(candles, config)).toEqualTypeOf<BacktestResult>();
  });

  it("BacktestResult has correct shape", () => {
    expectTypeOf<BacktestResult["trades"]>().toEqualTypeOf<readonly BacktestTrade[]>();
    expectTypeOf<BacktestResult["totalReturn"]>().toEqualTypeOf<number>();
  });

  it("computeBacktestMetrics returns BacktestMetrics", () => {
    const equityCurve: EquityPoint[] = [];
    const trades: BacktestTrade[] = [];
    expectTypeOf(computeBacktestMetrics(equityCurve, trades)).toEqualTypeOf<BacktestMetrics>();
  });

  // ─── Alert state machine ─────────────────────────────────────────────────
  it("createAlertState returns TickerAlertState", () => {
    expectTypeOf(createAlertState("AAPL")).toEqualTypeOf<TickerAlertState>();
  });

  it("evaluateAlerts returns FiredAlert[]", () => {
    const signals: MethodSignal[] = [];
    const result: ConsensusResult = {
      direction: "BUY" as SignalDirection,
      strength: 1,
      signals: [],
    };
    const state = createAlertState("AAPL");
    expectTypeOf(evaluateAlerts(state, signals, result)).toEqualTypeOf<FiredAlert[]>();
  });

  // ─── Cross-up detector ───────────────────────────────────────────────────
  it("detectCrossUp returns CrossUpResult", () => {
    expectTypeOf(detectCrossUp(candles, candles)).toEqualTypeOf<CrossUpResult>();
  });

  // ─── Branded type constructors ───────────────────────────────────────────
  it("isTicker returns boolean", () => {
    expectTypeOf(isTicker("AAPL")).toEqualTypeOf<boolean>();
  });

  it("isISODate returns boolean", () => {
    expectTypeOf(isISODate("2025-01-01")).toEqualTypeOf<boolean>();
  });
});
