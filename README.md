# CrossTide Web

> **Catch the cross. Ride the tide.**

Browser-based stock monitoring dashboard with 12-method consensus signals,
interactive charting, and offline-first PWA support.

[![CI](https://img.shields.io/github/actions/workflow/status/RajwanYair/CrossTide/ci.yml?label=CI&logo=github-actions)](https://github.com/RajwanYair/CrossTide/actions/workflows/ci.yml)
[![Release](https://img.shields.io/github/v/release/RajwanYair/CrossTide?logo=github)](https://github.com/RajwanYair/CrossTide/releases/latest)
[![License: MIT](https://img.shields.io/badge/License-MIT-green)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?logo=typescript)](tsconfig.json)
[![Bundle](https://img.shields.io/badge/Bundle-%3C200KB_gzip-brightgreen)](scripts/check-bundle-size.mjs)
[![Docs](https://img.shields.io/badge/Docs-Indicator%20Reference-blue)](https://rajwanyair.github.io/CrossTide/docs/)

> **Disclaimer**: CrossTide is for informational and educational purposes only. It is NOT financial advice.

---

## Features

| Category                | Highlights                                                                                                                                          |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Consensus Engine**    | 12 technical methods (SMA, EMA, MACD, RSI, Bollinger, Stochastic, ADX, OBV, VWAP, Ichimoku, Williams %R, CCI) with aggregated BUY/SELL/HOLD signals |
| **Interactive Charts**  | Candlestick + overlay indicators, drawing tools (trendline, fib, rectangle, channel, ray, hline, text), multi-chart layouts                         |
| **Backtesting**         | Strategy comparison engine, performance metrics (Sharpe, Sortino, max drawdown), equity curve visualization                                         |
| **Screening**           | Custom filters with preset strategies, real-time sorting, virtual-scrolled 10K+ row tables                                                          |
| **Portfolio Tracking**  | Holdings management, allocation pie chart, P&L tracking, sector exposure analysis                                                                   |
| **Market Intelligence** | Heatmap, sector rotation, relative strength, market breadth, correlation matrix, seasonality patterns                                               |
| **Alerts**              | Price/indicator alerts with browser notifications, alert history, signal DSL for custom conditions                                                  |
| **Data Providers**      | Yahoo Finance, Finnhub, CoinGecko, Polygon.io — automatic failover with provider health monitoring                                                  |
| **PWA / Offline**       | Service worker with Workbox, IndexedDB caching, background sync, installable on mobile                                                              |
| **Accessibility**       | WCAG 2.1 AA, keyboard navigation, screen reader support, color-blind palettes, skip links                                                           |
| **Performance**         | < 200 KB gzipped, virtual scrolling, lazy-loaded cards, view transitions, < 2s LCP                                                                  |
| **i18n**                | English, Hebrew (RTL), with expansion to ES/DE/ZH                                                                                                   |

---

## Quick Start

```bash
npm install
npm run dev        # http://localhost:5173
```

## Screenshots

|            Watchlist & Consensus             |          Interactive Chart           |                 Heatmap                  |
| :------------------------------------------: | :----------------------------------: | :--------------------------------------: |
| ![Watchlist](docs/screenshots/watchlist.png) | ![Chart](docs/screenshots/chart.png) | ![Heatmap](docs/screenshots/heatmap.png) |

> Screenshots are from the latest release. Run locally with `npm run dev` to explore all 22 card views.

### Card Gallery

CrossTide ships with **23 route cards**, each accessible from the sidebar navigation:

| Card                | Description                                                    |
| ------------------- | -------------------------------------------------------------- |
| Watchlist           | Real-time ticker table with sparklines, volume bars, 52W range |
| Consensus           | 12-method signal aggregation with confidence meter             |
| Chart               | Candlestick + 8 overlay indicators + drawing tools             |
| Multi-Chart         | Side-by-side 2–4 chart grid layout                             |
| Backtest            | SMA crossover backtest with equity curve + trade log           |
| Strategy Comparison | Compare two backtest strategies side-by-side                   |
| Screener            | Filter + sort 10K+ tickers with virtual scrolling              |
| Portfolio           | Holdings, allocation chart, P&L, sector exposure               |
| Risk Metrics        | VaR, Sharpe, Sortino, max drawdown analysis                    |
| Heatmap             | Treemap by sector cap, drill-down to constituents              |
| Sector Rotation     | RRG-style sector momentum quadrant chart                       |
| Relative Strength   | Normalized multi-ticker performance comparison                 |
| Market Breadth      | Advance/decline, new highs/lows, McClellan                     |
| Correlation Matrix  | Cross-ticker correlation heatmap                               |
| Seasonality         | Month-over-month historical return patterns                    |
| Earnings Calendar   | Upcoming earnings dates for watchlist                          |
| Macro Dashboard     | Economic indicators and Fed data                               |
| Consensus Timeline  | Historical signal timeline per ticker                          |
| Alerts              | Multi-condition alert rules (AND/OR), history log              |
| Signal DSL          | Custom indicator expressions with live evaluation              |
| Comparison          | Multi-ticker normalized price overlay                          |
| Provider Health     | Data provider latency, error rates, and uptime monitor         |
| Settings            | Theme, API keys, export/import, locale, a11y                   |

## Why CrossTide?

|                         | CrossTide | TradingView | Yahoo Finance | Finviz  |
| ----------------------- | :-------: | :---------: | :-----------: | :-----: |
| Free & open source      |    ✅     |     ❌      |      ❌       | Partial |
| Self-hostable / offline |    ✅     |     ❌      |      ❌       |   ❌    |
| No account required     |    ✅     |     ❌      |      ❌       |   ✅    |
| 12-method consensus     |    ✅     |     ❌      |      ❌       |   ❌    |
| Custom signal DSL       |    ✅     | Pine Script |      ❌       |   ❌    |
| < 200 KB bundle         |    ✅     |     ❌      |      ❌       |   ❌    |
| PWA installable         |    ✅     |     ❌      |      ❌       |   ❌    |
| Strategy backtesting    |    ✅     |     ✅      |      ❌       |   ❌    |
| Accessibility (WCAG AA) |    ✅     |   Partial   |    Partial    |   ❌    |

## Scripts

| Command                  | Description                                                          |
| ------------------------ | -------------------------------------------------------------------- |
| `npm run dev`            | Start dev server (<http://localhost:5173>)                           |
| `npm run dev:components` | Component preview grid (<http://localhost:5173/dev/components.html>) |
| `npm run build`          | TypeScript check + production build                                  |
| `npm test`               | Run unit tests                                                       |
| `npm run test:coverage`  | Tests with v8 coverage                                               |
| `npm run lint`           | ESLint                                                               |
| `npm run lint:all`       | ESLint + Stylelint + HTMLHint + markdownlint                         |
| `npm run format`         | Prettier auto-format                                                 |
| `npm run ci`             | Full CI pipeline (typecheck + lint + test + build + bundle check)    |

## Tech Stack

- **TypeScript 5.9** strict mode (`exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`,
  `forceConsistentCasingInFileNames`, `verbatimModuleSyntax`).
- **Vite 8** build tool (oxc minifier, ES2022 target).
- **Vitest 4.1** testing — happy-dom environment, v8 coverage, 90% statement / 80% branch / 90% function / 90% line thresholds.
- **ESLint 10** flat config + **typescript-eslint 8**.
- **Prettier 3** code formatting (single source of truth in `.prettierrc`).
- **Stylelint 17**, **HTMLHint 1.9**, **markdownlint-cli2** for non-TS assets.
- **Vanilla CSS** with custom properties (dark/light themes), no UI framework — pure TypeScript + DOM APIs.

## Release & Deployment

- Tag `vX.Y.Z` on `main` triggers `.github/workflows/release.yml`, which:
  1. Re-runs typecheck, lint, tests, and build.
  2. Zips `dist/` into `crosstide-vX.Y.Z.zip` plus a SHA-256 sidecar.
  3. Publishes a GitHub Release with auto-generated notes and the artifacts attached.
- Push to `main` also triggers `.github/workflows/pages.yml`, deploying the
  current build to GitHub Pages.

## Architecture

```text
src/
  domain/   Pure calculators (30+ indicators, consensus, backtest, risk)
  core/     Signals, cache, config, fetch, idb, i18n, storage-manager
  providers/ Market-data adapters (Yahoo, Finnhub, CoinGecko, Polygon, chain)
  cards/    Composable UI cards — 13 route cards, lazy-loaded via registry
  ui/       Router, toast, modal, command palette, a11y, view transitions
  types/    Shared interfaces + Valibot schemas
  styles/   Design tokens, base, responsive, components, color-blind palettes
worker/     Cloudflare Worker API proxy + security headers
```

See [ARCHITECTURE.md](ARCHITECTURE.md) for the full layered diagram and CI/CD reference.

## Local Verification

```bash
npm run dev        # Start dev server → http://localhost:5173
```

**Verification checklist:**

1. App loads with dark theme, header shows "CrossTide" + version in footer
2. Navigation links (Watchlist / Consensus / Settings) switch views
3. Type a ticker symbol (e.g. `AAPL`) in the input and press Enter — it appears in the watchlist
4. Click "Remove" on a ticker — it disappears
5. Switch to Settings → change theme to Light → UI updates
6. Click "Export JSON" → downloads a `.json` file
7. Click "Clear All" → watchlist empties
8. Refresh the page → config persists from localStorage

**Production build verification:**

```bash
npm run build      # TypeScript check + Vite build
npm run preview    # Serve dist/ at http://localhost:4173
```

## Signal Logic

```text
close[t]    = latest close
sma200[t]   = 200-day simple moving average

Cross-Up:    close[t-1] <= sma200[t-1]  AND  close[t] > sma200[t]
Consensus:   Micho Method + >=1 confirming method = BUY
```

## Troubleshooting

| Problem                                                  | Cause                                        | Fix                                                                                          |
| -------------------------------------------------------- | -------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `ERR_CERT_AUTHORITY_INVALID` in dev                      | Corporate MITM proxy                         | Set `HTTPS_PROXY=http://proxy-dmz.intel.com:912` before `npm run dev`                        |
| CSP blocks fetch requests in dev                         | Hitting Yahoo directly instead of Vite proxy | Ensure `import.meta.env.DEV` routes through `/api/yahoo` (already default)                   |
| Firefox/WebKit Playwright tests fail to start            | Browser engines not installed                | Run `npx playwright install firefox webkit`                                                  |
| `@starting-style` / `@scope` shown as unknown in VS Code | CSS language service needs custom data       | Verify `css.customData` points to `./config/css-custom-data.json` in `.vscode/settings.json` |
| Tests timeout behind corporate firewall                  | npm registry unreachable                     | Configure `.npmrc` with `proxy` and `https-proxy`                                            |
| Build exceeds 200 KB budget                              | New dependency added                         | Check `npm run check:bundle` and tree-shake or lazy-load the addition                        |

## License

[MIT](LICENSE)
