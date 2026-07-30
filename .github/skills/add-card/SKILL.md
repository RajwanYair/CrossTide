---
name: add-card
description: "Add a new route card to the CrossTide app. Use when: adding a new view or page, creating a new CardModule, registering a new route, or wiring a card into the router, registry and test guards. Produces a complete card with registry entry, router route, view container, unit tests and E2E coverage."
argument-hint: "Describe the card: route name, title, what it renders, which store or params it reads"
---

# 🃏 Add Card — CrossTide

Use this skill when shipping a complete route card — registry, router, markup, styles, and both test guards. A card that is not in every list below will fail CI.

## 1️⃣ Step 1 — Plan

| Decision       | Value                                                                 |
| -------------- | --------------------------------------------------------------------- |
| Route name     | kebab-case, becomes a `RouteName` union member (e.g. `sector-rotation`) |
| View id        | `view-<route>` — must match the `<section>` id in `index.html`        |
| Title          | Human-readable, shown in nav and headings                             |
| Params         | `:symbol` if the card is ticker-scoped, otherwise none                |
| Data source    | A store from `src/core/app-store` or a pure `src/domain/` call        |
| Dispose needed | Yes if you subscribe to a store or register a delegate                |

## 2️⃣ Step 2 — Card Module

Create `src/cards/<route>-card.ts`. Every file needs a leading docblock — `npm run audit:headers` is a CI gate.

```ts
/**
 * Sector rotation card adapter — CardModule wrapper for the sector view.
 */
import type { CardModule } from "./registry";
import { patchDOM } from "../core/patch-dom";
import { tickerDataStore } from "../core/app-store";

const sectorRotationCard: CardModule = {
  mount(container, ctx) {
    let symbol = ctx.params["symbol"] ?? "";

    const render = (): void => {
      const snapshot = tickerDataStore.peek().get(symbol) ?? null;
      patchDOM(container, snapshot ? renderRows(snapshot) : `<p class="empty-state">No data</p>`);
    };

    render();
    const unsubscribe = tickerDataStore.subscribe(render);

    return {
      update(newCtx): void {
        symbol = newCtx.params["symbol"] ?? "";
        render();
      },
      dispose(): void {
        unsubscribe();
      },
    };
  },
};

export default sectorRotationCard;
```

### Contract rules

- The module's **default export** must satisfy `CardModule` (`{ mount(container, ctx): CardHandle | void }`).
- **Always** render through `patchDOM(container, html)` — never assign `container.innerHTML`.
- Return a `CardHandle` with `update()` when the card is param-scoped, and `dispose()` whenever you subscribe to a store or attach a delegate. A missing `dispose()` leaks subscriptions between route changes.
- No listeners on child nodes — use `data-action` attributes plus container-level event delegation.
- Cards may import from `types`, `domain`, `core` and `providers`. They must **not** import from `src/ui/`.

## 3️⃣ Step 3 — Register Everywhere

Five files must change together. Missing any one of them produces a failing test rather than a silent bug — that is intentional.

1. `src/cards/registry.ts` — append a `CardEntry`:

   ```ts
   {
     route: "sector-rotation",
     title: "Sector Rotation",
     viewId: "view-sector-rotation",
     load: () => import("./sector-rotation-card").then((m) => m.default),
   },
   ```

2. `src/ui/router.ts` — add the name to the `RouteName` union, to the `VALID_ROUTES` set, and add `PATTERNS` entries:

   ```ts
   { name: "sector-rotation", segments: ["sector-rotation"] },
   { name: "sector-rotation", segments: ["sector-rotation", ":symbol"] },
   ```

   Add a bare-segment pattern **and** a `:symbol` pattern only if the card is ticker-scoped.

3. `index.html` — add the view container:

   ```html
   <section id="view-sector-rotation" class="view" hidden></section>
   ```

4. `tests/e2e/cards.spec.ts` — append to the `CARDS` array:

   ```ts
   { route: "sector-rotation", viewId: "view-sector-rotation", heading: /sector rotation/i },
   ```

5. `src/locales/en.ts` and `src/styles/` — only if the card introduces new copy or styling.

> `src/cards/index.ts` needs **no** change. Cards are lazy-loaded through `loadCard(route)`; the barrel only re-exports the contract types.

## 4️⃣ Step 4 — Tests

### Unit test — `tests/unit/cards/<route>-card.test.ts`

Runs in the **`dom`** Vitest project (happy-dom globals available).

```ts
/**
 * Sector rotation card adapter tests.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { tickerDataStore } from "../../../src/core/app-store";
import type { CardHandle } from "../../../src/cards/registry";

describe("sector-rotation-card (CardModule)", () => {
  let container: HTMLElement;
  let handle: CardHandle | void;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    tickerDataStore.set(new Map());
  });

  afterEach(() => {
    handle?.dispose?.();
    document.body.removeChild(container);
    tickerDataStore.set(new Map());
    vi.clearAllMocks();
  });

  it("mounts and renders an empty state without data", async () => {
    const { default: card } = await import("../../../src/cards/sector-rotation-card");
    handle = card.mount(container, { route: "sector-rotation", params: {} });
    expect(container.textContent).toContain("No data");
  });

  it("unsubscribes on dispose", async () => {
    const { default: card } = await import("../../../src/cards/sector-rotation-card");
    handle = card.mount(container, { route: "sector-rotation", params: {} });
    handle?.dispose?.();
    expect(() => tickerDataStore.set(new Map())).not.toThrow();
  });
});
```

Always call `handle?.dispose?.()` in `afterEach` — otherwise a leaked subscription will fire during an unrelated test and produce confusing cross-test failures.

### Drift guards

`tests/unit/cards/registry.test.ts` parses `tests/e2e/cards.spec.ts` as text and asserts the two route lists match. A new card without an E2E entry fails there, and a stale E2E entry for a deleted card fails too.

## 5️⃣ Step 5 — Verify

```powershell
./node_modules/.bin/vitest run tests/unit/cards
$env:PLAYWRIGHT_BROWSERS_PATH='C:\ProgramData\ms-playwright'
npm run test:e2e:cards
npm run ci
```

## ✅ Definition of Done

- [ ] `src/cards/<route>-card.ts` exists with a leading docblock and a default `CardModule` export
- [ ] Registry entry added
- [ ] `RouteName`, `VALID_ROUTES` and `PATTERNS` updated in `src/ui/router.ts`
- [ ] `<section id="view-<route>">` added to `index.html`
- [ ] `CARDS` entry added to `tests/e2e/cards.spec.ts`
- [ ] Unit test covers mount, empty state, and dispose
- [ ] `dispose()` releases every subscription and delegate
- [ ] `npm run ci` passes
