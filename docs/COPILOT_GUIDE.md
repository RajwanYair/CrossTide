# Copilot Guide for CrossTide

Coding conventions, prompt patterns, and guardrails for using GitHub Copilot in this TypeScript/Vite project.

## Stack

| Area     | Tool                          | Version |
| -------- | ----------------------------- | ------- |
| Language | TypeScript (strict)           | 6.0     |
| Build    | Vite                          | 8       |
| Test     | Vitest + happy-dom            | 4       |
| Lint     | ESLint flat config            | 9       |
| CSS      | Vanilla CSS + @layer + @scope | —       |
| Format   | Prettier                      | 3.5+    |
| Worker   | Hono on Cloudflare Workers    | 4       |

## Architecture

```text
src/
  types/      ← shared interfaces only — no imports from other layers
  domain/     ← pure functions only — no DOM, no fetch, no storage, no Date.now()
  core/       ← state, config, caching, fetch — no UI code
  providers/  ← data provider adapters (Yahoo, Finnhub, etc.)
  cards/      ← route cards (CardModule pattern: mount/update/dispose)
  ui/         ← router, theme, toast, dialogs — DOM access allowed
  styles/     ← CSS layers: tokens, base, components, responsive
  locales/    ← i18n translation dictionaries
```

**Dependency rule:** domain → types only. core → domain + types. cards → core + domain + types. ui → all.
ESLint enforces these import directions — no exceptions.

## Coding Conventions

- **Strict TypeScript**: `strict: true`, `noUncheckedIndexedAccess`, `noUnusedLocals`
- **Explicit return types**: ESLint enforces `@typescript-eslint/explicit-function-return-type`
- **No `any`**: Use `unknown` and narrow, or define proper types
- **`const` by default**: `prefer-const` is enforced
- **No `console.log`**: Use `console.warn` or `console.error` only
- **`===` always**: `eqeqeq` rule enforced
- **Readonly types**: Interfaces use `readonly` properties
- **Barrel exports**: Each layer has an `index.ts` that re-exports public API

## Domain Layer Rules

Domain modules (`src/domain/`) must be **pure functions**:

- No DOM access (`document`, `window`)
- No `fetch`, `localStorage`, or other side effects
- No `Date.now()` -- pass timestamps as parameters
- Accept all inputs as parameters, return computed results
- Use `DailyCandle[]` as the standard input type

```typescript
// CORRECT -- pure function
export function computeSma(candles: DailyCandle[], period: number): number | null {
  if (candles.length < period) return null;
  const slice = candles.slice(-period);
  return slice.reduce((sum, c) => sum + c.close, 0) / period;
}

// WRONG -- side effect in domain
export async function computeSma(ticker: string): Promise<number | null> {
  const candles = await fetch(`/api/${ticker}`); // forbidden
}
```

## Trading Methods & Consensus Engine

CrossTide evaluates 12 trading methods combined through a consensus engine:

| Method              | BUY Condition                     | SELL Condition                      |
| ------------------- | --------------------------------- | ----------------------------------- |
| **Micho** (primary) | Price crosses above SMA150        | Price crosses below SMA150          |
| **RSI**             | RSI exits oversold (<30->>=30)    | RSI exits overbought (>70-><=70)    |
| **MACD**            | MACD crosses above signal         | MACD crosses below signal           |
| **Bollinger**       | Price crosses above lower band    | Price crosses below upper band      |
| **Stochastic**      | %K crosses above %D from oversold | %K crosses below %D from overbought |
| **OBV**             | Positive OBV divergence           | Negative OBV divergence             |
| **ADX**             | Strong trend + DI+ > DI-          | Strong trend + DI- > DI+            |
| **CCI**             | CCI exits oversold (>-100)        | CCI exits overbought (<+100)        |
| **SAR**             | Parabolic SAR flips to BUY        | Parabolic SAR flips to SELL         |
| **Williams %R**     | %R exits oversold (>-80)          | %R exits overbought (<-20)          |
| **MFI**             | MFI exits oversold (<20->>=20)    | MFI exits overbought (>80-><=80)    |
| **SuperTrend**      | Direction flip to bullish         | Direction flip to bearish           |

**Consensus rule**: `BUY` = Micho BUY + >=1 other BUY. `SELL` = Micho SELL + >=1 other SELL.

## Route Cards (25 cards)

| Card                     | Route               | Key feature                           |
| ------------------------ | ------------------- | ------------------------------------- |
| `watchlist-card`         | `watchlist`         | Real-time quotes + consensus scores   |
| `chart-card`             | `chart`             | OHLCV candles + LWC v5                |
| `consensus-card`         | `consensus`         | 12-method signal aggregation          |
| `screener-card`          | `screener`          | Signal DSL-based technical screener   |
| `portfolio-card`         | `portfolio`         | Holdings P/L + sector allocation      |
| `rebalance-card`         | `rebalance`         | Target allocation drift + trade plan  |
| `alerts-card`            | `alerts`            | Price/indicator alert rules           |
| `backtest-card`          | `backtest`          | Web Worker backtester + DSL           |
| `earnings-calendar-card` | `earnings-calendar` | Earnings dates + EPS surprise history |
| `risk-card`              | `risk`              | VaR, beta, Sharpe, drawdown           |
| `signal-dsl-card`        | `signal-dsl`        | Interactive DSL expression editor     |
| (+ 14 more)              | —                   | Heatmap, screener, macro, etc.        |

## Quality Gates -- Zero Tolerance

| Gate       | Command                 | Requirement              |
| ---------- | ----------------------- | ------------------------ |
| Type check | `npm run typecheck`     | Zero errors              |
| ESLint     | `npm run lint`          | Zero warnings            |
| Stylelint  | `npm run lint:css`      | Zero CSS warnings        |
| HTMLHint   | `npm run lint:html`     | Zero issues              |
| Prettier   | `npm run format:check`  | Exit 0                   |
| Tests      | `npm run test:coverage` | All pass, >=90% coverage |
| Build      | `npm run build`         | Successful               |
| Bundle     | `npm run check:bundle`  | Under 200 KB             |

Run all at once: `npm run ci`

## Testing Conventions

- Test files: `tests/unit/<layer>/<module>.test.ts`
- Framework: Vitest with `happy-dom` environment
- Shared helpers: `tests/helpers/` (e.g., `candle-factory.ts`)
- Domain tests are pure -- no mocks needed
- Core tests mock `localStorage` via `vi.stubGlobal`
- Use `it.each` for parameterized tests over constant assertions
- Coverage: v8 provider, 90% threshold for statements/lines/functions, 80% branches

```typescript
// Shared helper for building test candles
import { makeCandles } from "../../helpers/candle-factory";

describe("computeSma", () => {
  it("returns null when fewer candles than period", () => {
    const candles = makeCandles([10, 20, 30]);
    expect(computeSma(candles, 5)).toBeNull();
  });
});
```

## Guardrails

- **No secrets**: Never generate, hardcode, or suggest API keys in code
- **Test-first for domain**: Always write tests alongside domain logic
- **No side effects in domain**: Domain must be pure -- no network, no DOM, no storage
- **No `// eslint-disable`**: Fix the root cause instead
- **No `TODO` in code**: Open a GitHub Issue for deferred work
- **No `any`**: Use `unknown` + type narrowing
- **Readonly by default**: Interfaces use `readonly` properties

## Useful Copilot Prompts

### Add a new technical indicator

```text
Create a pure function in src/domain/indicators/ computing [indicator name].
Follow the computeSma/computeEma pattern: accept DailyCandle[] + params, return number[] | null.
Add unit tests in tests/unit/domain/ using makeCandles from tests/helpers/candle-factory.ts.
Cover: exact values, insufficient data, edge cases.
```

### Add a new worker API route

```text
Create worker/routes/[name].ts following the fundamentals.ts pattern.
Validate input, check KV cache, fetch from provider, cache result, return Response.json().
Add the handler to worker/index.ts with app.get("/api/[path]", ...).
Write tests in tests/unit/worker/[name].test.ts — mock globalThis.fetch.
```

### Add a new card

```text
Create src/cards/[name]-card.ts with a default CardModule export.
Use patchDOM() for rendering. Use data-action for event delegation.
Register it in src/cards/registry.ts and add the route to src/ui/router.ts RouteName.
Add the view section to index.html: <section id="view-[name]" class="view">.
Write tests in tests/unit/cards/[name]-card.test.ts.
```

### Write tests for domain logic

```text
Write Vitest tests for [function] in tests/unit/domain/.
Import makeCandles from tests/helpers/candle-factory.ts.
Cover: normal operation, edge cases (empty/insufficient input), boundary values.
Use it.each for parameterized cases.
```
