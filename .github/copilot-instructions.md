# CrossTide — Copilot Workspace Instructions

Privacy-first financial analysis PWA. Vanilla TypeScript, no framework, Vite 8, Vitest 4, Hono 4 on Cloudflare Workers, LWC v5 charts, morphdom DOM patching, Cloudflare D1 + KV.

## Context Loading Strategy (token efficiency)

Load **only** the instruction file that matches the layer you are modifying:

| Layer                   | Instruction file                               | `applyTo` glob                     |
| ----------------------- | ---------------------------------------------- | ---------------------------------- |
| `src/domain/`           | `.github/instructions/domain.instructions.md`  | `src/domain/**`                    |
| `worker/`               | `.github/instructions/worker.instructions.md`  | `worker/**`                        |
| `src/cards/`, `src/ui/` | `.github/instructions/cards.instructions.md`   | `src/cards/**`                     |
| `tests/`                | `.github/instructions/tests.instructions.md`   | `tests/**`                         |
| Browser compat          | `.github/instructions/browser.instructions.md` | `tests/browser/**`, `tests/e2e/**` |

**Do NOT speculatively load** `src/domain/indicators/` (218 files), `src/cards/` (54 files), or `tests/unit/` for unrelated tasks. Use `grep_search` or `semantic_search` to find specific files.

---

## Layer Architecture (ESLint-enforced import direction)

```
types ← domain ← core ← providers ← cards ← ui
```

```
src/types/     — interfaces only, no imports from other src/ layers
src/domain/    — pure functions only: no DOM, fetch, Date.now(), Math.random()
src/core/      — state, config, caching, fetch — no UI
src/providers/ — Yahoo/Finnhub adapters
src/cards/     — route cards (CardModule pattern)
src/ui/        — router, theme, toast — DOM allowed
worker/        — Hono on Cloudflare Workers; imports use .js extension
docs-site/     — Astro Starlight documentation site; isolated from app code
```

---

## Non-Negotiable Rules

1. No suppressions — no `eslint-disable`, `@ts-ignore`, `--force`. Fix root causes.
2. No dead artifacts — every file, export, dep, and config entry must be referenced.
3. No `TODO` in code — open a GitHub Issue instead.
4. No secrets in code — use `.env` (gitignored) or Cloudflare secrets.
5. Validation at boundaries — sanitize all external input (API, user, URL params).
6. Bundle discipline — CI rejects builds >200 KB gzip.
7. Test before shipping — new domain logic and new worker routes require tests.

## Coding Conventions

- **Explicit return types** on all exported functions
- **No `any`** — use `unknown` + narrow, or define interfaces
- **`const` by default**, `let` only when reassignment required
- **`===` always**; `readonly` on all interface fields
- **No `console.log`** — use `worker/logger.ts` or `console.warn`/`console.error`
- **No floating promises** — `void asyncFn()` or `await`
- **Barrel exports** — each layer exposes a public API via `index.ts`

## Commit Format (commitlint enforced)

```
type(scope): fully lowercase subject, no period, ≤72 chars
```

Types: `feat` `fix` `docs` `refactor` `test` `chore` `perf` `ci`
Scopes: `domain` `worker` `cards` `core` `ui` `ci` `docs` `screener` `portfolio` `alerts` `consensus` `watchlist` `chart`

## Quality Gates (all must pass before merge)

| Gate       | Command                 | Requirement                    |
| ---------- | ----------------------- | ------------------------------ |
| Type check | `npm run typecheck`     | Zero errors                    |
| ESLint     | `npm run lint`          | Zero warnings                  |
| Stylelint  | `npm run lint:css`      | Zero warnings                  |
| Prettier   | `npm run format:check`  | Exit 0                         |
| Tests      | `npm run test:coverage` | ≥90% stmt/line/fn, ≥80% branch |
| Build      | `npm run build`         | Successful                     |
| Bundle     | `npm run check:bundle`  | <200 KB gzip                   |

Run all: `npm run ci`

## Worker API Endpoints

| Method | Path                        | Description                     |
| ------ | --------------------------- | ------------------------------- |
| GET    | `/api/health`               | Worker + provider status        |
| GET    | `/api/quote/:symbol`        | Real-time quote (Yahoo Finance) |
| GET    | `/api/chart`                | OHLCV candles with KV cache     |
| GET    | `/api/search`               | Ticker fuzzy search             |
| GET    | `/api/fundamentals/:symbol` | P/E, EPS, revenue metrics       |
| GET    | `/api/earnings/:symbol`     | Earnings calendar + history     |
| GET    | `/api/crypto/:id`           | Crypto OHLCV (CoinGecko)        |
| GET    | `/api/forex/:pair`          | Forex rate (ECB/Yahoo)          |
| GET    | `/api/seasonality/:symbol`  | Monthly return seasonality      |
| GET    | `/api/market-breadth`       | NYSE/NASDAQ breadth indicators  |
| GET    | `/api/alerts/history`       | Alert fire history (D1)         |
| GET    | `/api/migrations/status`    | D1 migration status             |
| POST   | `/api/screener`             | Technical screener              |
| POST   | `/api/signal-dsl/execute`   | Signal DSL expression evaluator |
| POST   | `/api/news/sentiment`       | NLP sentiment scoring           |
| POST   | `/api/portfolio/rebalance`  | Rebalancing trade calculations  |
| GET    | `/api/og/:symbol`           | OG social preview image         |
| GET    | `/api/ws/:symbol`           | WebSocket ticker fan-out (DO)   |
| GET    | `/openapi.json`             | OpenAPI spec                    |
