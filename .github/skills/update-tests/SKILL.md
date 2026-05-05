---
name: update-tests
description: "Add or update tests in the CrossTide test suite. Use when: adding a new domain function, new worker route, new card module, changing a type or constant, fixing broken test assertions, or when coverage drops below the threshold gate. Covers Vitest 4 + happy-dom, domain purity tests, worker mock tests, and card unit tests."
argument-hint: "Describe what changed: new domain function name, new worker route path, changed type, broken test name, or coverage module path."
---

# Update Tests — CrossTide

## Infrastructure

- **Runner**: Vitest 4 + `happy-dom` environment (unit) · `@vitest/browser` (browser-mode) · Playwright (E2E)
- **Location**: `tests/unit/` — one directory per layer
- **Coverage thresholds**: ≥90% statements/lines/functions · ≥80% branches — canonical source `vitest.config.ts`
- **Baseline command**: `npm run test:coverage` (must exit 0, thresholds must pass)

## How to Run

```powershell
npm run test:coverage                              # all tests + coverage gate
npx vitest run tests/unit/domain/rsi.test.ts      # single file
npx vitest run --reporter=verbose                  # verbose output
npx vitest run tests/unit/worker/                  # all worker tests
```

## Layer Test Rules

### Domain (`tests/unit/domain/`)

- One test file per indicator/function in `src/domain/`
- Use `makeCandles(n, overrides?)` from `tests/helpers/candle-factory.ts` — never hand-roll fixtures
- Test the `null` return path first: `expect(fn(makeCandles(period - 1))).toBeNull()`
- Test the warm path: `expect(fn(makeCandles(period + 1))).toHaveLength(2)` (or appropriate length)
- Never mock anything in domain tests — domain functions are pure
- Use `fc.double()` for fast-check property arbitraries, never `fc.float()`

### Worker (`tests/unit/worker/`)

- Mock `globalThis.fetch` — NEVER make real network calls
- Mock the full `Env` object: `{ QUOTE_CACHE: mockKV(), DB: mockD1(), RATE_LIMITER: mockRL() }`
- Use `new Request(url)` to construct test requests; call route handler directly
- Test Valibot validation errors (missing params → 400), cache hits, cache misses, upstream errors (502)
- Test rate limit rejection path when `RATE_LIMITER` returns `{ success: false }`

### Cards (`tests/unit/cards/`)

- Use `setCardDOM({ containerId: 'card-root' })` to set up DOM in `beforeEach`
- Call `cleanupDOM()` in `afterEach`
- Mock signal stores: `vi.mock('@/core/portfolio-store', () => ({ portfolioStore: { get: vi.fn() } }))`
- Never test internal implementation — test observable DOM output
- Cards may not import from `src/ui/` (except router types) — enforce in tests too

### Core (`tests/unit/core/`)

- Use `_resetForTest()` in `afterEach` for all stateful core modules
- Never `vi.resetModules()` inside `beforeEach` — causes transform timeout
- Signal store tests: verify `store.get()` initial value, then `store.set(v)` and confirm `store.get() === v`

## File Map (key paths)

| Source layer             | Test location                     |
| ------------------------ | --------------------------------- |
| `src/domain/indicators/` | `tests/unit/domain/`              |
| `src/domain/analytics/`  | `tests/unit/domain/`              |
| `worker/routes/`         | `tests/unit/worker/routes/`       |
| `worker/kv-cache.ts`     | `tests/unit/worker/kv-cache.ts`   |
| `worker/rate-limit.ts`   | `tests/unit/worker/rate-limit.ts` |
| `src/cards/`             | `tests/unit/cards/`               |
| `src/core/`              | `tests/unit/core/`                |
| `src/providers/`         | `tests/unit/providers/`           |
| `src/ui/`                | `tests/unit/ui/`                  |

## Floor Rules (NEVER violate)

1. No `.only` or `.skip` committed to `main` — enforced by `scripts/check-test-focus-skip.mjs`
2. No `@ts-ignore` or `eslint-disable` in test files — fix root cause
3. No real `fetch()`, `Date.now()`, or `Math.random()` in domain tests — they are pure
4. No `console.log` left in committed tests
5. No duplicate fixture data — extract to `tests/helpers/` if reused across files
6. No `vi.resetModules()` in high-frequency beforeEach — use `_resetForTest()` instead
7. After calling async code, drain microtasks: `for (let i = 0; i < 20; i++) await Promise.resolve()`
8. `vi.useRealTimers()` must be called in `afterEach` after every `vi.useFakeTimers()`

## Coverage Targets

| Metric     | Threshold |
| ---------- | --------- |
| Statements | 90%       |
| Branches   | 80%       |
| Functions  | 90%       |
| Lines      | 90%       |

Canonical source: `vitest.config.ts`. Target ≥95% per file when adding new modules.

## Property-Based Testing (fast-check)

When using `fast-check` for property tests (domain layer — see Q13 patterns):

- `fc.double()` not `fc.float()` for numeric arbitraries
- `.filter((v) => v.trim().length > 0)` on string arbitraries to exclude whitespace-only
- Pair `fc.string({ minLength: 1 })` with `.filter((t) => t.trim().length > 0)`
- Use `fc.oneof()` over `fc.frequency()` when weights don't matter
