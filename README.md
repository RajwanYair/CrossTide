# CrossTide Web

> **Catch the cross. Ride the tide.**

Browser-based stock monitoring dashboard with 12-method consensus signals,
interactive charting, and offline-first PWA support.

[![CI](https://img.shields.io/github/actions/workflow/status/RajwanYair/CrossTide/ci.yml?label=CI&logo=github-actions)](https://github.com/RajwanYair/CrossTide/actions/workflows/ci.yml)
[![Release](https://img.shields.io/github/v/release/RajwanYair/CrossTide?logo=github)](https://github.com/RajwanYair/CrossTide/releases/latest)
[![License: MIT](https://img.shields.io/badge/License-MIT-green)](LICENSE)

> **Disclaimer**: CrossTide is for informational and educational purposes only. It is NOT financial advice.

## Quick Start

```bash
npm install
npm run dev        # http://localhost:5173
```

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

## License

[MIT](LICENSE)
