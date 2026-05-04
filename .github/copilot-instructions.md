# CrossTide — Copilot Workspace Instructions

CrossTide is a **privacy-first, offline-capable financial analysis PWA** built with vanilla
TypeScript. No framework, no SSR, no build-time magic — just strict TypeScript, Vite, and a
zero-dependency reactive signal system.

---

## Stack (current versions)

| Area         | Tool / Library                | Version |
| ------------ | ----------------------------- | ------- |
| Language     | TypeScript strict             | 6.0     |
| Build        | Vite                          | 8       |
| Test (unit)  | Vitest + happy-dom            | 4       |
| Test (E2E)   | Playwright                    | 1.50+   |
| Lint         | ESLint flat config            | 9       |
| CSS          | Vanilla CSS + @layer + @scope | —       |
| Format       | Prettier                      | 3.5+    |
| Worker       | Hono on Cloudflare Workers    | 4       |
| DB           | Cloudflare D1 (SQLite)        | —       |
| Cache        | Cloudflare KV                 | —       |
| Charts       | LWC (Lightweight Charts)      | 5       |
| DOM patching | morphdom                      | 2       |

---

## Architecture — Layer Rules (CRITICAL)

```text
src/
  types/      ← shared interfaces only — no imports from other src/ layers
  domain/     ← pure functions only — no DOM, no fetch, no storage, no Date.now()
  core/       ← state, config, caching, fetch — no UI code
  providers/  ← data provider adapters (Yahoo, Finnhub, etc.)
  cards/      ← route cards (CardModule pattern)
  ui/         ← router, theme, toast, dialogs — DOM access allowed
  styles/     ← CSS layers: tokens, base, components, responsive
  locales/    ← i18n translation dictionaries
```

**Import direction (strict — ESLint enforced):**

```text
types ← domain ← core ← providers ← cards ← ui
                                   ↑ cards also import domain + core
```

Never import upward. Domain must never import from core, cards, or ui.

---

## Domain Layer — Non-Negotiable Rules

Domain functions (`src/domain/`) must be **pure**:

- No `document`, `window`, `navigator`
- No `fetch`, `localStorage`, `sessionStorage`, `indexedDB`
- No `Date.now()` — receive timestamps as parameters
- No `Math.random()` — use seeded PRNG or deterministic computation
- No module-level mutable state
- Accept all inputs as parameters; return computed results
- Standard input type: `DailyCandle[]` from `src/types/domain.ts`

```typescript
// ✅ Correct — pure function
export function computeEma(candles: DailyCandle[], period: number): number | null {
  if (candles.length < period) return null;
  // ...
}

// ❌ Wrong — side effect in domain
export async function computeEma(ticker: string): Promise<number | null> {
  const candles = await fetch(`/api/${ticker}`); // forbidden
}
```

---

## Card Module Pattern

Every route card exports a default `CardModule`:

```typescript
import type { CardModule } from "./registry";

const card: CardModule = {
  mount(container: HTMLElement, ctx: CardContext): CardHandle | void {
    // render into container
    // return optional { update?, dispose? }
  },
};

export default card;
```

- Use `patchDOM(container, html)` for incremental rendering — never raw `innerHTML`
- Use `data-action` attributes for event delegation at the card root
- Async setup: `void asyncFn()` to avoid floating promise lint errors
- Cards live in `src/cards/`, tests in `tests/unit/cards/`

---

## Signal Stores Pattern (v12+)

Cards use domain-specific signal stores instead of scattered `main.ts` wiring:

```typescript
// src/core/stores/watchlist.store.ts
import { signal, computed, batch } from "../signals";

export const watchlistStore = createStore({
  tickers: signal<string[]>([]),
  quotes: computed(() => /* derive from tickers + cache */),
  loading: signal(false),
  error: signal<string | null>(null),

  async addTicker(symbol: string) { ... },
  async refresh() { ... },
});
```

- Cards subscribe to stores; stores manage fetching, caching, error handling
- Use `batch(() => { ... })` to coalesce multiple signal updates into one render
- Particularly critical for WebSocket streams firing 10+ updates/second

---

## Route Loaders Pattern (v12+)

Routes declare a `loader()` that runs before mount — eliminates data waterfalls:

```typescript
defineRoute({
  path: "/chart/:symbol",
  loader: async ({ params, signal }) => {
    const candles = await fetchCandles(params.symbol, { signal });
    return { candles };
  },
  component: () => import("./cards/chart-card"),
});
```

- Loaders run with AbortController — navigation aborts pending loaders
- Data is available to the card immediately on mount (no loading waterfall)

---

## Web Components (Shared UI Primitives)

Base Web Components extract repeated patterns across cards:

| Component          | Purpose                                  |
| ------------------ | ---------------------------------------- |
| `<ct-data-table>`  | Virtual scroll, sort, keyboard nav, ARIA |
| `<ct-stat-grid>`   | Responsive grid of key metrics           |
| `<ct-chart-frame>` | LWC wrapper with loading/error states    |
| `<ct-filter-bar>`  | Preset buttons + custom filter inputs    |
| `<ct-empty-state>` | Consistent empty/error/loading fallback  |

- Native browser API (zero runtime cost)
- Shadow DOM for style encapsulation
- Composable: `<ct-chart-frame><ct-filter-bar></ct-chart-frame>`
- Cards should prefer these over reimplementing table/chart/grid patterns

---

## Error Boundaries

All card mount/update calls are wrapped in try-catch:

```typescript
try {
  card.mount(container, ctx);
} catch (err) {
  renderErrorFallback(container, err);
}
```

- One card crash must never kill the entire app
- Error fallback UI shows user-friendly message with retry action
- Errors are reported to GlitchTip (source-mapped)

---

## Worker Route Pattern (Hono on Cloudflare Workers)

```typescript
// worker/routes/my-route.ts
import type { Env } from "../index.js";

export async function handleMyRoute(param: string, env: Env): Promise<Response> {
  // 1. validate input
  // 2. try KV cache
  // 3. fetch from provider
  // 4. cache result
  // 5. return Response.json(...)
}
```

- All imports use `.js` extension (ESM for CF Workers)
- Validate all inputs before processing — reject with 400
- Return `Response.json(data)` — never construct raw Responses for JSON
- Wire route in `worker/index.ts`: `app.get("/api/path", (c) => handle(c.req.param("id"), c.env))`
- Tests: `tests/unit/worker/<route>.test.ts` — mock `globalThis.fetch` to avoid network calls

---

## Test Conventions

| Type    | Location         | Framework             | Run                    |
| ------- | ---------------- | --------------------- | ---------------------- |
| Unit    | `tests/unit/`    | Vitest + happy-dom    | `npm test`             |
| Browser | `tests/browser/` | Vitest + real browser | `npm run test:browser` |
| E2E     | `tests/e2e/`     | Playwright            | `npm run test:e2e`     |

**Rules:**

- Domain tests are pure — no mocks needed
- Use `makeCandles(prices)` from `tests/helpers/candle-factory.ts` for test data
- Core/card tests mock `localStorage` via `vi.stubGlobal`
- Worker tests mock `globalThis.fetch` to prevent real network calls
- Coverage thresholds: 90% statements/lines/functions, 80% branches
- Use `it.each` for parameterized tests, not repeated `it` blocks

---

## Commit Conventions (Conventional Commits — enforced by commitlint)

```text
type(scope): lowercase subject, no period, ≤72 chars

body lines ≤100 chars
```

**Types:** `feat` · `fix` · `docs` · `refactor` · `test` · `chore` · `perf` · `ci`

**Common scopes:** `watchlist` · `chart` · `screener` · `portfolio` · `rebalance` ·
`alerts` · `consensus` · `core` · `worker` · `ci` · `docs` · `ui` · `domain`

Subject must be **fully lowercase** — `feat(worker): add earnings calendar api endpoint` ✅

---

## Coding Conventions (enforced by ESLint/TypeScript)

- **Explicit return types** on all exported functions (`@typescript-eslint/explicit-function-return-type`)
- **No `any`** — use `unknown` and narrow, or define proper interfaces
- **`const` by default** — `let` only when reassignment is required
- **`===` always** — `==` is a lint error
- **Readonly properties** — interfaces use `readonly` on all fields
- **No `console.log`** — use structured logger (`worker/logger.ts`) or `console.warn`/`console.error`
- **No floating promises** — use `void asyncFn()` or `await`
- **No `// eslint-disable`** — fix the root cause
- **Barrel exports** — each layer exposes a public API via `index.ts`

---

## Key Domain Modules

| Module                       | Purpose                                            |
| ---------------------------- | -------------------------------------------------- |
| `domain/indicators/`         | 50+ pure indicator functions (SMA, EMA, RSI, etc.) |
| `domain/consensus.ts`        | 12-method signal aggregation engine                |
| `domain/portfolio-analytics` | Portfolio P/L, allocation, concentration           |
| `domain/portfolio-rebalance` | Rebalancing trade calculations                     |
| `domain/backtest.ts`         | Web Worker backtesting engine                      |
| `domain/risk-metrics.ts`     | VaR, beta, Sharpe, drawdown                        |

## Key Core Modules

| Module                   | Purpose                                          |
| ------------------------ | ------------------------------------------------ |
| `core/config.ts`         | Loads/saves user config from localStorage        |
| `core/signals.ts`        | Zero-dep reactive primitives with auto-tracking  |
| `core/signals.ts#batch`  | Coalesce multiple signal updates into one render |
| `core/stores/`           | Domain-specific signal stores (watchlist, etc.)  |
| `core/patch-dom.ts`      | morphdom wrapper for incremental DOM updates     |
| `core/worker-api-client` | Typed browser client for the Hono worker API     |
| `core/route-guards.ts`   | Client-side navigation protection (auth guards)  |
| `core/idb.ts`            | IndexedDB wrapper for offline persistence        |
| `core/passkey.ts`        | WebAuthn passkey registration and authentication |

---

## Worker API Endpoints

| Method | Path                        | Description                     |
| ------ | --------------------------- | ------------------------------- |
| GET    | `/api/health`               | Worker + provider status        |
| GET    | `/api/quote/:symbol`        | Real-time quote (Yahoo Finance) |
| GET    | `/api/chart`                | OHLCV candles with KV cache     |
| GET    | `/api/search`               | Ticker fuzzy search             |
| GET    | `/api/fundamentals/:symbol` | P/E, EPS, revenue metrics       |
| GET    | `/api/earnings/:symbol`     | Earnings calendar + history     |
| GET    | `/api/alerts/history`       | Alert fire history (D1)         |
| GET    | `/api/migrations/status`    | D1 migration status             |
| POST   | `/api/screener`             | Technical screener              |
| POST   | `/api/signal-dsl/execute`   | Signal DSL expression evaluator |
| POST   | `/api/news/sentiment`       | NLP sentiment scoring           |
| GET    | `/api/og/:symbol`           | OG social preview image         |
| GET    | `/api/ws/:symbol`           | WebSocket ticker fan-out (DO)   |
| GET    | `/openapi.json`             | OpenAPI spec                    |

---

## Non-Negotiable Engineering Rules

1. **No suppressions** — no `eslint-disable`, no `@ts-ignore`, no `--force` flags. Fix root causes.
2. **No dead artifacts** — every file, export, dep, and config entry must be referenced and wired.
3. **No `TODO` in code** — open a GitHub Issue instead.
4. **No secrets in code** — API keys go in `.env` (gitignored) or Cloudflare secrets.
5. **Validation at boundaries** — sanitize all external input (API responses, user input, URL params).
6. **Bundle discipline** — CI rejects builds >200 KB gzip. No fat dependencies.
7. **Test before shipping** — new domain logic requires tests; new worker routes require tests.

---

## Quality Gates (all required for merge)

| Gate       | Command                 | Requirement             |
| ---------- | ----------------------- | ----------------------- |
| Type check | `npm run typecheck`     | Zero errors             |
| ESLint     | `npm run lint`          | Zero warnings           |
| Stylelint  | `npm run lint:css`      | Zero CSS warnings       |
| HTMLHint   | `npm run lint:html`     | Zero issues             |
| Markdown   | `npm run lint:md`       | Zero violations         |
| Prettier   | `npm run format:check`  | Exit 0                  |
| Tests      | `npm run test:coverage` | All pass, ≥90% coverage |
| Build      | `npm run build`         | Successful              |
| Bundle     | `npm run check:bundle`  | Under 200 KB gzip       |

Run all: `npm run ci`

---

## Common Pitfalls to Avoid

- Importing `core/` from `domain/` — forbidden by layer rules
- Using raw `innerHTML =` instead of `patchDOM()` — causes flicker and breaks morphdom diffing
- Forgetting `.js` extension on worker imports — CF Workers ESM requires explicit extensions
- Writing tests that make real network calls — always mock `globalThis.fetch` in worker tests
- Using `Date.now()` in domain logic — makes tests non-deterministic; pass timestamps in
- Using `Math.random()` in domain logic — use deterministic seeded hash functions
- Leaving floating promises unwrapped — `void` or `await`, not bare `asyncFn()`

---

## Useful Copilot Prompt Patterns

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

### Write tests for a domain function

```text
Write Vitest tests for [function] in tests/unit/domain/.
Import makeCandles from tests/helpers/candle-factory.ts.
Cover: normal operation, edge cases (empty/insufficient input), boundary values.
Use it.each for parameterized cases.
```
