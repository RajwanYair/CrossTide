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

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | TypeScript check + production build |
| `npm test` | Run unit tests |
| `npm run test:coverage` | Tests with v8 coverage |
| `npm run lint` | ESLint |
| `npm run lint:all` | ESLint + Stylelint + HTMLHint + markdownlint |
| `npm run format` | Prettier auto-format |
| `npm run ci` | Full CI pipeline (typecheck + lint + test + build + bundle check) |

## Tech Stack

- **TypeScript 5.8+** strict mode
- **Vite 6.3+** build tool
- **Vitest 3.1+** testing (happy-dom, v8 coverage, 90% thresholds)
- **ESLint 9+** flat config with typescript-eslint
- **Prettier** code formatting
- **Vanilla CSS** with custom properties (dark/light themes)
- **No framework** — pure TypeScript + DOM APIs

## Architecture

```
src/
  domain/   Pure calculators (SMA, EMA, RSI, MACD, consensus)
  core/     State, cache, config, fetch utilities
  ui/       Router, theme, view renderers
  types/    Shared interfaces
  styles/   CSS design tokens + components
```

See [ARCHITECTURE.md](ARCHITECTURE.md) for details.

## Signal Logic

```
close[t]    = latest close
sma200[t]   = 200-day simple moving average

Cross-Up:    close[t-1] <= sma200[t-1]  AND  close[t] > sma200[t]
Consensus:   Micho Method + >=1 confirming method = BUY
```

## License

[MIT](LICENSE)