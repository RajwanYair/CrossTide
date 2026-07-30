# @crosstide/domain

The analysis engine behind [CrossTide](https://github.com/RajwanYair/CrossTide), extracted as a
standalone package: 200+ technical indicators, 12-method consensus scoring, portfolio analytics
and risk metrics.

**Zero runtime dependencies.** Every module is a pure function — no DOM, no `fetch`, no
`Date.now()`, no `Math.random()`. The same code runs unchanged in a browser, in Node, in a
Cloudflare Worker, or in a Web Worker, and the purity is enforced in CI by
`scripts/arch-check.mjs` rather than by convention.

## Install

```bash
npm install @crosstide/domain
```

## Usage

```ts
import { computeRsi, computeMacdSeries, aggregateConsensus } from "@crosstide/domain";

const candles = [
  { date: "2024-01-02", open: 44.3, high: 44.5, low: 44.1, close: 44.34, volume: 1_200_000 },
  // …
];

const rsi = computeRsi(candles, 14); // 57.91502067008556
const macd = computeMacdSeries(candles);
const consensus = aggregateConsensus(candles);
```

Indicators take `DailyCandle[]` or plain number arrays and return plain values — there is no
client to construct and no state to thread through. The package exports 688 symbols; editor
autocomplete over the shipped TSDoc is the practical reference.

## What is in it

| Area                 | Examples                                                                       |
| -------------------- | ------------------------------------------------------------------------------ |
| Trend                | SMA, EMA, WMA, HMA, KAMA, Supertrend, Ichimoku, Parabolic SAR                  |
| Momentum             | RSI, MACD, Stochastic, CCI, Williams %R, TSI, Awesome Oscillator               |
| Volatility           | Bollinger Bands, ATR, Keltner, Donchian, Chaikin Volatility, GARCH             |
| Volume               | OBV, VWAP, MFI, Accumulation/Distribution, Volume Profile, Force Index         |
| Consensus            | 12-method weighted scoring with per-method confidence and agreement            |
| Portfolio            | Allocation drift, rebalancing trades, correlation matrices, factor exposure    |
| Risk                 | VaR, CVaR, Sharpe, Sortino, Calmar, max drawdown, tail-index estimation        |
| Statistical          | Kalman filters, Hawkes processes, copulas, Granger causality, changepoints     |

The complete, always-current list is the package's own type surface — every export is
documented with TSDoc, so editor autocomplete is the reference.

## Module resolution

The package ships a single ESM bundle plus TypeScript declarations. It resolves under
`moduleResolution: "bundler"` and `"node10"`. It is ESM-only: there is no CommonJS entry, and
`require()` will not work.

## Versioning

The package version tracks the CrossTide application version, so a given
`@crosstide/domain@x.y.z` is exactly the engine that shipped in CrossTide `x.y.z`.

## License

MIT — see [LICENSE](https://github.com/RajwanYair/CrossTide/blob/main/LICENSE).
