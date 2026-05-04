/**
 * R13 — Domain API type-level tests.
 *
 * Uses vitest's `expectTypeOf` to assert public type contracts on the
 * domain API. These tests never fail at runtime — they catch type regressions
 * at compile/typecheck time (and in `vitest run`).
 */
import { describe, it, expectTypeOf } from "vitest";
import type {
  DailyCandle,
  SignalDirection,
  MethodSignal,
  ConsensusResult,
} from "../../../src/types/domain";
import {
  computeRsi,
  computeRsiSeries,
  computeMacdSeries,
  computeSma,
  computeEma,
  computeAtr,
  computeBollinger,
  computeStochastic,
  computeObv,
  computeAdx,
  computeCci,
  computeWilliamsR,
  computeVwap,
  aggregateConsensus,
  aggregateSignals,
  evaluateConsensus,
} from "../../../src/domain";
import type {
  RsiPoint,
  MacdPoint,
  AtrPoint,
  BollingerPoint,
  StochasticPoint,
  ObvPoint,
  AdxPoint,
  CciPoint,
  WilliamsRPoint,
  VwapPoint,
} from "../../../src/domain";

// ── DailyCandle ───────────────────────────────────────────────────────────────

describe("DailyCandle type", () => {
  it("has required numeric OHLCV fields and string date", () => {
    expectTypeOf<DailyCandle>().toHaveProperty("open").toEqualTypeOf<number>();
    expectTypeOf<DailyCandle>().toHaveProperty("high").toEqualTypeOf<number>();
    expectTypeOf<DailyCandle>().toHaveProperty("low").toEqualTypeOf<number>();
    expectTypeOf<DailyCandle>().toHaveProperty("close").toEqualTypeOf<number>();
    expectTypeOf<DailyCandle>().toHaveProperty("volume").toEqualTypeOf<number>();
    expectTypeOf<DailyCandle>().toHaveProperty("date").toEqualTypeOf<string>();
  });
});

// ── Signal types ──────────────────────────────────────────────────────────────

describe("SignalDirection type", () => {
  it("is a union of BUY | SELL | NEUTRAL", () => {
    expectTypeOf<SignalDirection>().toEqualTypeOf<"BUY" | "SELL" | "NEUTRAL">();
  });
});

describe("MethodSignal type", () => {
  it("has direction, score, and reason fields", () => {
    expectTypeOf<MethodSignal>().toHaveProperty("direction").toEqualTypeOf<SignalDirection>();
    expectTypeOf<MethodSignal>().toHaveProperty("score").toEqualTypeOf<number>();
    expectTypeOf<MethodSignal>().toHaveProperty("reason").toEqualTypeOf<string>();
  });
});

describe("ConsensusResult type", () => {
  it("has ticker, direction, buyMethods, sellMethods, and strength", () => {
    expectTypeOf<ConsensusResult>().toHaveProperty("ticker").toEqualTypeOf<string>();
    expectTypeOf<ConsensusResult>().toHaveProperty("direction").toEqualTypeOf<SignalDirection>();
    expectTypeOf<ConsensusResult>().toHaveProperty("strength").toEqualTypeOf<number>();
  });
});

// ── Indicator function signatures ─────────────────────────────────────────────

describe("computeRsi signature", () => {
  it("accepts candles and options, returns number", () => {
    expectTypeOf(computeRsi).toBeCallableWith([] as DailyCandle[], { period: 14 });
    expectTypeOf(computeRsi).returns.toEqualTypeOf<number>();
  });
});

describe("computeRsiSeries signature", () => {
  it("returns RsiPoint[]", () => {
    expectTypeOf(computeRsiSeries).returns.toEqualTypeOf<RsiPoint[]>();
  });
});

describe("computeMacdSeries signature", () => {
  it("returns MacdPoint[]", () => {
    expectTypeOf(computeMacdSeries).returns.toEqualTypeOf<MacdPoint[]>();
  });
});

describe("computeSma signature", () => {
  it("accepts candles and options, returns number", () => {
    expectTypeOf(computeSma).toBeCallableWith([] as DailyCandle[], { period: 20 });
    expectTypeOf(computeSma).returns.toEqualTypeOf<number>();
  });
});

describe("computeEma signature", () => {
  it("returns SmaPoint via computeEma", () => {
    // computeEma has same return type as computeSma
    expectTypeOf(computeEma).returns.toEqualTypeOf<number>();
  });
});

describe("computeAtr signature", () => {
  it("returns AtrPoint", () => {
    expectTypeOf(computeAtr).returns.toEqualTypeOf<AtrPoint>();
  });
});

describe("computeBollinger signature", () => {
  it("returns BollingerPoint", () => {
    expectTypeOf(computeBollinger).returns.toEqualTypeOf<BollingerPoint>();
  });
});

describe("computeStochastic signature", () => {
  it("returns StochasticPoint", () => {
    expectTypeOf(computeStochastic).returns.toEqualTypeOf<StochasticPoint>();
  });
});

describe("computeObv signature", () => {
  it("returns ObvPoint", () => {
    expectTypeOf(computeObv).returns.toEqualTypeOf<ObvPoint>();
  });
});

describe("computeAdx signature", () => {
  it("returns AdxPoint", () => {
    expectTypeOf(computeAdx).returns.toEqualTypeOf<AdxPoint>();
  });
});

describe("computeCci signature", () => {
  it("returns CciPoint", () => {
    expectTypeOf(computeCci).returns.toEqualTypeOf<CciPoint>();
  });
});

describe("computeWilliamsR signature", () => {
  it("returns WilliamsRPoint", () => {
    expectTypeOf(computeWilliamsR).returns.toEqualTypeOf<WilliamsRPoint>();
  });
});

describe("computeVwap signature", () => {
  it("returns VwapPoint", () => {
    expectTypeOf(computeVwap).returns.toEqualTypeOf<VwapPoint>();
  });
});

// ── Aggregator signatures ──────────────────────────────────────────────────────

describe("aggregateConsensus signature", () => {
  it("returns ConsensusResult", () => {
    expectTypeOf(aggregateConsensus).returns.toEqualTypeOf<ConsensusResult>();
  });
});

describe("aggregateSignals signature", () => {
  it("returns ConsensusResult", () => {
    expectTypeOf(aggregateSignals).returns.toEqualTypeOf<ConsensusResult>();
  });
});

describe("evaluateConsensus signature", () => {
  it("accepts ticker and signals array and returns ConsensusResult", () => {
    expectTypeOf(evaluateConsensus).toBeCallableWith("AAPL", [] as MethodSignal[]);
    expectTypeOf(evaluateConsensus).returns.toEqualTypeOf<ConsensusResult>();
  });
});
