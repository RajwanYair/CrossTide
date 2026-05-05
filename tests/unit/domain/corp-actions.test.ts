import { describe, it, expect } from "vitest";
import { makeCandles } from "../../helpers/candle-factory";
import {
  applySplits,
  applyDividends,
  applyCorpActions,
  cumulativeSplitFactor,
  type SplitEvent,
  type DividendEvent,
} from "../../../src/domain/corp-actions";

describe("applySplits", () => {
  it("returns copy when no splits", () => {
    const candles = makeCandles([100, 110, 120]);
    const result = applySplits(candles, []);
    expect(result).toEqual(candles);
    expect(result).not.toBe(candles);
  });

  it("returns copy when no candles", () => {
    const splits: SplitEvent[] = [{ date: "2024-01-02", numerator: 2, denominator: 1 }];
    expect(applySplits([], splits)).toEqual([]);
  });

  it.each([
    {
      desc: "2-for-1 split: prices before split halved, volume doubled",
      closes: [200, 200, 100, 100],
      splits: [{ date: "2024-01-03", numerator: 2, denominator: 1 }],
      expectedCloses: [100, 100, 100, 100],
      expectedVolumes: [2000, 2000, 1000, 1000],
    },
    {
      desc: "3-for-1 split: prices before split divided by 3",
      closes: [300, 300, 100],
      splits: [{ date: "2024-01-03", numerator: 3, denominator: 1 }],
      expectedCloses: [100, 100, 100],
      expectedVolumes: [3000, 3000, 1000],
    },
    {
      desc: "reverse 1-for-2 split: prices before split doubled, volume halved",
      closes: [50, 50, 100],
      splits: [{ date: "2024-01-03", numerator: 1, denominator: 2 }],
      expectedCloses: [100, 100, 100],
      expectedVolumes: [500, 500, 1000],
    },
  ])("$desc", ({ closes, splits, expectedCloses, expectedVolumes }) => {
    const candles = makeCandles(closes);
    const result = applySplits(candles, splits);
    expect(result.map((c) => c.close)).toEqual(expectedCloses);
    expect(result.map((c) => c.volume)).toEqual(expectedVolumes);
  });

  it("applies two splits correctly in order", () => {
    // Candles at $400 → 2-for-1 split on day 3 → 2-for-1 split on day 5
    const candles = makeCandles([400, 400, 400, 200, 200]);
    const splits: SplitEvent[] = [
      { date: "2024-01-03", numerator: 2, denominator: 1 },
      { date: "2024-01-05", numerator: 2, denominator: 1 },
    ];
    const result = applySplits(candles, splits);
    // Candles before day 3 (adjusted by both splits ×4): $100
    expect(result[0]!.close).toBe(100);
    expect(result[1]!.close).toBe(100);
    // Candle ON day 3 (ex-date of split1): only split2 applies ($400/2 = $200)
    expect(result[2]!.close).toBe(200);
    // Candle on day 4 (between splits): only split2 applies ($200/2 = $100)
    expect(result[3]!.close).toBe(100);
    // Candle on day 5 (ex-date of split2): no adjustment
    expect(result[4]!.close).toBe(200);
  });

  it("does not mutate the input candles", () => {
    const candles = makeCandles([200, 200]);
    const before = candles.map((c) => ({ ...c }));
    applySplits(candles, [{ date: "2024-01-02", numerator: 2, denominator: 1 }]);
    expect(candles).toEqual(before);
  });
});

describe("applyDividends", () => {
  it("returns copy when no dividends", () => {
    const candles = makeCandles([100, 110]);
    const result = applyDividends(candles, []);
    expect(result).toEqual(candles);
  });

  it.each([
    {
      desc: "dividend on day 3 reduces all prior closes by dividend amount",
      closes: [100, 100, 100],
      dividends: [{ date: "2024-01-03", amount: 5 }] as DividendEvent[],
      expectedCloses: [95, 95, 100],
    },
    {
      desc: "two dividends both subtracted from earliest candles",
      closes: [100, 100, 100, 100],
      dividends: [
        { date: "2024-01-02", amount: 2 },
        { date: "2024-01-04", amount: 3 },
      ] as DividendEvent[],
      // candle[0] (day 1): both dividends applied → 100 - 2 - 3 = 95
      // candle[1] (day 2): only second dividend applied (day 1 < day 2) → 100 - 3 = 97
      // candle[2] (day 3): only second dividend applied → 100 - 3 = 97
      // candle[3] (day 4): no adjustment → 100
      expectedCloses: [95, 97, 97, 100],
    },
  ])("$desc", ({ closes, dividends, expectedCloses }) => {
    const candles = makeCandles(closes);
    const result = applyDividends(candles, dividends);
    expect(result.map((c) => c.close)).toEqual(expectedCloses);
  });
});

describe("applyCorpActions", () => {
  it("with defaults applies only splits", () => {
    const candles = makeCandles([200, 100]);
    const splits: SplitEvent[] = [{ date: "2024-01-02", numerator: 2, denominator: 1 }];
    const divs: DividendEvent[] = [{ date: "2024-01-02", amount: 5 }];
    const result = applyCorpActions(candles, splits, divs);
    // Split applied: candle[0] goes from 200→100; dividend NOT applied (default)
    expect(result[0]!.close).toBe(100);
    expect(result[1]!.close).toBe(100);
  });

  it("with dividends:true applies both splits and dividends", () => {
    const candles = makeCandles([200, 100]);
    const splits: SplitEvent[] = [{ date: "2024-01-02", numerator: 2, denominator: 1 }];
    const divs: DividendEvent[] = [{ date: "2024-01-02", amount: 5 }];
    const result = applyCorpActions(candles, splits, divs, { dividends: true });
    // Split: candle[0] → 100; then dividend: 100 - 5 = 95
    expect(result[0]!.close).toBe(95);
    expect(result[1]!.close).toBe(100);
  });

  it("with splits:false skips split adjustment", () => {
    const candles = makeCandles([200, 100]);
    const splits: SplitEvent[] = [{ date: "2024-01-02", numerator: 2, denominator: 1 }];
    const result = applyCorpActions(candles, splits, [], { splits: false });
    expect(result[0]!.close).toBe(200); // unchanged
  });
});

describe("cumulativeSplitFactor", () => {
  it("returns 1 for empty splits", () => {
    expect(cumulativeSplitFactor([])).toBe(1);
  });

  it.each([
    { splits: [{ date: "2024-01-01", numerator: 2, denominator: 1 }], expected: 2 },
    {
      splits: [
        { date: "2024-01-01", numerator: 2, denominator: 1 },
        { date: "2024-06-01", numerator: 3, denominator: 1 },
      ],
      expected: 6,
    },
  ])("cumulative factor for $splits.length split(s) = $expected", ({ splits, expected }) => {
    expect(cumulativeSplitFactor(splits)).toBe(expected);
  });

  it("filters splits after asOfDate", () => {
    const splits: SplitEvent[] = [
      { date: "2024-01-01", numerator: 2, denominator: 1 },
      { date: "2024-06-01", numerator: 3, denominator: 1 },
    ];
    // Only include split on or before 2024-03-01
    expect(cumulativeSplitFactor(splits, "2024-03-01")).toBe(2);
  });
});
