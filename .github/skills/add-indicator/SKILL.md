---
name: add-indicator
description: "Add a new technical indicator to the CrossTide domain layer. Use when: implementing a new calculator (RSI/MACD-style), adding a signal method to the consensus engine, or extending screener/backtest inputs. Covers purity constraints, the calculator + series export pair, consensus registration, property tests and generated docs."
argument-hint: "Describe the indicator: name, formula, period defaults, and whether it should vote in consensus"
---

# 📈 Add Indicator — CrossTide

Two different things are called "an indicator". Decide which you are building before writing code.

| Kind           | Produces                        | Lives in                        | Votes in consensus |
| -------------- | ------------------------------- | ------------------------------- | ------------------ |
| **Calculator** | Numbers (`number`, series)      | `src/domain/<name>-calculator.ts` | No                 |
| **Method**     | A `MethodSignal` (BUY/SELL)     | `src/domain/<name>-method.ts`     | Yes                |

A method almost always wraps a calculator. Build the calculator first.

## 1️⃣ Step 1 — Purity Constraints

`src/domain/` is pure. These are enforced by `node scripts/arch-check.mjs --strict` and the Oxlint/typecheck gates, both of which run in `npm run ci`.

- No `document`, `window`, `navigator`, `localStorage`, `fetch`, `indexedDB`
- No `Date.now()` — accept `now: number` as a parameter
- No `Math.random()` — use deterministic, seeded computation
- No module-level mutable state
- Domain may import **only** from `src/types/`

## 2️⃣ Step 2 — The Calculator

Create `src/domain/<name>-calculator.ts`. Every file needs a leading docblock — `npm run audit:headers` is a CI gate.

```ts
/**
 * CMO Calculator — Pure domain logic.
 *
 * Chande Momentum Oscillator: 100 * (sumGain - sumLoss) / (sumGain + sumLoss).
 */
import type { DailyCandle } from "../types/domain";
import { DEFAULTS } from "./technical-defaults";

/** A single CMO data point aligned to a candle date. */
export interface CmoPoint {
  readonly date: string;
  readonly value: number | null;
}

/**
 * Compute the CMO for the most recent `period` closes.
 * Returns null if fewer than `period + 1` candles are available.
 * Candles must be sorted ascending by date.
 */
export function computeCmo(
  candles: readonly DailyCandle[],
  period = DEFAULTS.period,
): number | null {
  if (candles.length <= period) return null;
  let sumGain = 0;
  let sumLoss = 0;
  for (let i = candles.length - period; i < candles.length; i++) {
    const prev = candles[i - 1];
    const curr = candles[i];
    if (!prev || !curr) continue;
    const change = curr.close - prev.close;
    if (change >= 0) sumGain += change;
    else sumLoss -= change;
  }
  const total = sumGain + sumLoss;
  return total === 0 ? 0 : (100 * (sumGain - sumLoss)) / total;
}

/**
 * Compute a rolling CMO series aligned with the input candles.
 * The first `period` entries have null values (warmup).
 */
export function computeCmoSeries(
  candles: readonly DailyCandle[],
  period = DEFAULTS.period,
): CmoPoint[] {
  // ... same shape: one entry per candle, nulls during warmup
}
```

### Conventions that are not optional

- Export a **pair**: `compute<Name>()` for the latest value and `compute<Name>Series()` for the aligned rolling series.
- The series must return **exactly one entry per input candle**, with `null` values during warmup. Tests assert this.
- Return `null`, never `undefined`, for insufficient data.
- Explicit return types on every export. No `any`.
- `noUncheckedIndexedAccess` is on, so `candles[i]` is `DailyCandle | undefined` — guard before use.
- Take period defaults from `src/domain/technical-defaults.ts` rather than inventing new magic numbers.

## 3️⃣ Step 3 — Register as a Consensus Method (only if it votes)

Create `src/domain/<name>-method.ts` exporting `evaluate`:

```ts
export function evaluate(
  ticker: string,
  candles: readonly DailyCandle[],
): MethodSignal | null { ... }
```

Then wire it into **four** places, or it will silently never run:

1. `src/types/domain.ts` — add the name to the `MethodName` union.
2. `src/types/domain.ts` — add a weight to `DEFAULT_METHOD_WEIGHTS`.
3. `src/domain/consensus-engine.ts` — add the name to the `BUY_METHODS` set.
4. `src/domain/signal-aggregator.ts` — import `evaluate as evaluate<Name>` and append it to the `DETECTORS` array.

`MethodSignal.evaluatedAt` is an ISO string — pass the timestamp in as a parameter; do not call `Date.now()` inside the domain.

## 4️⃣ Step 4 — Tests

Indicator tests run in the **`node`** Vitest project (`tests/unit/domain/**`). No DOM globals, and `tests/helpers/node-network.ts` blocks unstubbed `fetch`. Pure functions need no mocks.

### Example-based — `tests/unit/domain/<name>-calculator.test.ts`

```ts
/**
 * CMO Calculator tests.
 */
import { describe, it, expect } from "vitest";
import { computeCmo, computeCmoSeries } from "../../../src/domain/cmo-calculator";
import { makeCandles } from "../../helpers/candle-factory";

describe("computeCmo", () => {
  it("returns null when fewer candles than period", () => {
    expect(computeCmo(makeCandles([10, 20, 30]), 5)).toBeNull();
  });

  it("returns 100 when every change is positive", () => {
    const candles = makeCandles(Array.from({ length: 16 }, (_, i) => 100 + i));
    expect(computeCmo(candles, 14)).toBeCloseTo(100, 6);
  });
});

describe("computeCmoSeries", () => {
  it("emits one entry per candle with a null warmup", () => {
    const series = computeCmoSeries(makeCandles([10, 20, 30, 40, 50]), 3);
    expect(series).toHaveLength(5);
    expect(series[0]?.value).toBeNull();
  });
});
```

Cover: insufficient data, exact-period length, `period = 1`, empty array, series length, and warmup nulls.

### Property-based — `tests/unit/domain/indicator-properties.test.ts`

Bounded oscillators must have their bounds fuzzed. Add to the existing property suite:

```ts
import * as fc from "fast-check";

it("CMO always lies within [-100, 100]", () => {
  fc.assert(
    fc.property(
      fc.array(positivePrice, { minLength: 20, maxLength: 200 }),
      (closes) => {
        const value = computeCmo(makeArbitraryCandles(closes), 14);
        if (value !== null) {
          expect(value).toBeGreaterThanOrEqual(-100);
          expect(value).toBeLessThanOrEqual(100);
        }
      },
    ),
  );
});
```

Good invariants: output bounds, scale invariance, constant-input identity, series length equals input length, and monotonic input producing a saturated reading.

## 5️⃣ Step 5 — Docs

`scripts/generate-indicator-docs.ts` scrapes `src/domain/*.ts` for the leading file docblock, exported function JSDoc, and exported interfaces to build `docs/INDICATORS.md`. Nothing is registered manually — but a missing or `@`-only docblock yields an empty description, so write a real one-line summary.

```powershell
./node_modules/.bin/tsx scripts/generate-indicator-docs.ts
```

## 6️⃣ Step 6 — Verify

```powershell
./node_modules/.bin/vitest run tests/unit/domain
node scripts/arch-check.mjs --strict
npm run ci
```

## ✅ Definition of Done

- [ ] `src/domain/<name>-calculator.ts` has a leading docblock and the `compute` / `computeSeries` pair
- [ ] No DOM, `fetch`, `Date.now()`, `Math.random()` or module-level mutable state
- [ ] Series returns one entry per candle with null warmup
- [ ] If it votes: `MethodName`, `DEFAULT_METHOD_WEIGHTS`, `BUY_METHODS` and `DETECTORS` all updated
- [ ] Example tests cover edge cases; property tests cover invariants
- [ ] `docs/INDICATORS.md` regenerated
- [ ] `npm run ci` passes with coverage still at or above the gate
