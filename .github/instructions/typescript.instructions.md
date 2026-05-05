---
applyTo: "src/**/*.ts,worker/**/*.ts,scripts/**/*.mjs,tests/**"
description: "Use when: editing any TypeScript source, worker routes, scripts, or test files."
---

# TypeScript Conventions — CrossTide

## Module System

- Pure ESM (`"type": "module"` in `package.json`). No `require()`, no `module.exports`.
- Worker files use `.js` extension on relative imports (Cloudflare Workers ESM requirement).
- Imports grouped: (1) Node built-ins, (2) third-party, (3) `src/types/`, (4) `src/domain/`, (5) `src/core/`, (6) `src/providers/`, (7) `src/cards/`, (8) `src/ui/`.

## Type Safety

- **No `any`** — use `unknown` + type narrowing or define an interface.
- **Explicit return types** on every exported function.
- **`readonly`** on all interface fields unless mutation is the explicit contract.
- **`const` by default**; `let` only when reassignment is required.
- **`===` always** — never `==`.
- Use `satisfies` operator to catch shape errors while preserving narrow inferred types.

## Safety Rules

- **Never `innerHTML`** with unsanitized data — use `textContent` or sanitize first.
- **No `eval()`** or `new Function()` outside explicit sandbox contexts.
- All user-supplied data (URL params, API responses, form inputs) validated at system boundaries.
- **No `console.log`** — use `console.warn` / `console.error`, or `worker/logger.ts` in Workers.

## Architecture Layers (ESLint-enforced import direction)

```text
types ← domain ← core ← providers ← cards ← ui
```

- `src/domain/` — pure functions only: no DOM, no `fetch`, no `Date.now()`, no `Math.random()`.
- `src/core/` — state, config, caching; no UI concerns.
- `src/cards/` — route cards implementing the `CardModule` pattern; DOM allowed.
- `worker/` — Hono on Cloudflare Workers; imports use `.js` extension.

## CardModule Pattern

Every route card in `src/cards/` must export:

```ts
export const MyCard: CardModule = {
  mount(container: HTMLElement): void {
    /* register subscriptions */
  },
  unmount(): void {
    /* clean up subscriptions and timers */
  },
};
```

- `mount()` must call `signal.subscribe()` and push the disposer to a local `_subs` array.
- `unmount()` must drain `_subs` and cancel any pending `AbortController`.

## Error Handling

- Use `try/catch` only at I/O boundaries (fetch, D1 queries, KV reads).
- Narrow `catch (e: unknown)` with `instanceof Error` before accessing `.message`.
- Surface worker errors as typed `ErrorResponse` — never leak stack traces to clients.
- Use `ErrorBoundary` from `src/core/error-boundary.ts` to wrap card `mount()` calls.

## Naming

- Functions / variables: `camelCase`.
- Types / interfaces / classes: `PascalCase`.
- Constants: `UPPER_SNAKE_CASE`.
- Private module-local helpers: prefix with `_`, e.g. `_buildRow()`.
- Test files: `*.test.ts` (unit), `*.spec.ts` (E2E).

## JSDoc (exported symbols)

Every exported function and interface must have a JSDoc block:

```ts
/**
 * Computes the 14-period RSI from a series of closing prices.
 * Pure function — no side effects.
 */
export function rsi(closes: readonly number[], period = 14): number[] { … }
```

No JSDoc needed on private / unexported helpers.

## No Floating Promises

- `void asyncFn()` for intentional fire-and-forget.
- `await asyncFn()` for sequential execution.
- Never leave a promise unawaited without an explicit `void` annotation.

## Barrel Exports

Each layer exposes its public API via an `index.ts`. Do not import from internal files across layer boundaries — import from the layer's `index.ts`.

## Commit Convention

```
type(scope): fully lowercase subject, no period, ≤72 chars
```

Types: `feat` `fix` `docs` `refactor` `test` `chore` `perf` `ci`
Scopes: `domain` `worker` `cards` `core` `ui` `ci` `docs` `screener` `portfolio` `alerts` `consensus` `watchlist` `chart`
