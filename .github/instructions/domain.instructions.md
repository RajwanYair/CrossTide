---
applyTo: "src/domain/**,tests/unit/domain/**"
---

# Domain Layer Rules

All `src/domain/` functions must be **pure** — deterministic, side-effect-free, testable without mocks.

## Purity Constraints

- No `document`, `window`, `navigator`, `localStorage`, `fetch`, `indexedDB`
- No `Date.now()` — receive `now: number` as parameter
- No `Math.random()` — use deterministic seeded computation
- No module-level mutable state
- Accept all inputs as parameters; return computed results

## Standard Signatures

```typescript
// Indicator: DailyCandle[] → number[] | null
export function computeEma(candles: readonly DailyCandle[], period: number): number[] | null {
  if (candles.length < period) return null;
  // ...
}

// Analytics: structured input → structured result
export function computeSharpe(returns: readonly number[], riskFreeRate: number): number | null { ... }
```

- `DailyCandle` is from `src/types/domain.ts` — always import from there
- Return `null` (not `undefined`) when input is insufficient
- Export from `src/domain/index.ts` barrel — every new function must appear there

## Import Rules

- May import from: `src/types/` only
- Must NOT import: `src/core/`, `src/cards/`, `src/ui/`, `src/providers/`, `worker/`

## Key Modules (read before adding new ones to avoid duplication)

| Module                              | Purpose                               |
| ----------------------------------- | ------------------------------------- |
| `src/domain/indicators/`            | 50+ indicators (SMA, EMA, RSI, MACD…) |
| `src/domain/consensus.ts`           | 12-method signal aggregation engine   |
| `src/domain/portfolio-analytics.ts` | P/L, allocation, concentration        |
| `src/domain/portfolio-rebalance.ts` | Rebalancing trade calculations        |
| `src/domain/risk-metrics.ts`        | VaR, beta, Sharpe, drawdown           |
| `src/domain/backtest.ts`            | Strategy backtesting engine           |
| `src/domain/seasonality.ts`         | Monthly return averages               |
| `src/domain/market-breadth.ts`      | A/D line, McClellan, breadth %        |

## Test Pattern

```typescript
import { describe, it, expect } from "vitest";
import { makeCandles } from "../../helpers/candle-factory";
import { computeMyIndicator } from "../../../src/domain/indicators/my-indicator";

describe("computeMyIndicator", () => {
  it.each([
    {
      prices: [1, 2, 3, 4, 5],
      period: 3,
      expected: [
        /* ... */
      ],
    },
  ])("returns $expected for period $period", ({ prices, period, expected }) => {
    expect(computeMyIndicator(makeCandles(prices), period)).toEqual(expected);
  });

  it("returns null when insufficient data", () => {
    expect(computeMyIndicator(makeCandles([1, 2]), 5)).toBeNull();
  });
});
```

- `makeCandles(prices)` helper is in `tests/helpers/candle-factory.ts`
- Use `it.each` — never repeat `it` blocks with only data differences
- No mocks needed — functions are pure
- Test: normal operation, null on insufficient data, boundary values, negative/zero inputs

## Common Pitfalls

- `import { something } from "../../core/..."` — **forbidden**, breaks layer rules
- `Date.now()` inside function body — breaks determinism, tests will flicker
- Missing barrel export — run `grep -r "export function compute" src/domain/ | grep -v index` to audit
- `any` type — use `unknown` and narrow with type guards
