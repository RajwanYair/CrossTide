# Primary Journey Acceptance Matrix

This matrix defines the minimum acceptance path for discovering an instrument,
inspecting its market data, understanding signals and risk, and preserving or
sharing the resulting view. A case is accepted only when the listed outcome is
observable in the UI or URL; a successful HTTP response alone is insufficient.

| Journey | Entry point | User action | Observable acceptance | Required state variants | Test owner |
|---|---|---|---|---|---|
| Discover | `/watchlist` | Search for a ticker and add it | A matching suggestion is shown; submitting a valid symbol creates one watchlist row | Stock, ETF, crypto, forex, index; malformed symbol | `tests/e2e/cards.spec.ts` |
| Inspect | Watchlist row and `/chart` | Select the symbol and open its chart | The selected ticker is visible, the chart or its explicit empty/error state is rendered, and no uncaught app error occurs | Live, cached/stale, empty, upstream error | `tests/e2e/` chart coverage |
| Signal | `/consensus` | Open the symbol's consensus view | The signal summary identifies the symbol, exposes contributing inputs, and labels unavailable inputs instead of presenting them as values | Positive, negative, neutral, unavailable | `tests/e2e/` consensus coverage |
| Risk | `/risk` | Review risk for the selected symbol or portfolio | Risk metrics render with units and a visible limitation or empty state when history is insufficient | Complete history, insufficient history, calculation error | `tests/e2e/` risk coverage |
| Save | Watchlist and route state | Reload after adding a symbol | The saved symbol and active route survive reload, or the UI shows a deterministic empty state when persistence is unavailable | First visit, reload, malformed stored data, offline | `tests/e2e/` persistence coverage |
| Share | Active analysis route | Copy or open the shareable URL | The URL contains the required symbol and route; opening it directly restores the same analysis context | Symbol with punctuation, missing symbol, unknown route | `tests/e2e/` share coverage |

## Execution Rules

- Run the discovery case before inspect, signal, and risk cases when they share a
  symbol.
- Assertions must target rendered state, route state, or accessible names. Do not
  treat provider-specific response fields as user acceptance criteria.
- Every non-live result must remain understandable: show loading, empty, stale,
  error, retry, or offline state as applicable.
- Browser tests must use `waitForAppReady` and must not depend on external market
  data; intercept or fixture network responses for deterministic runs.
