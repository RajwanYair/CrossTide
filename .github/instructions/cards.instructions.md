---
applyTo: "src/cards/**,src/ui/**,tests/unit/cards/**"
---

# Cards & UI Layer Rules

Route cards live in `src/cards/`. Each card is a `CardModule` — self-contained view module.

## CardModule Pattern

```typescript
// src/cards/my-card.ts
import type { CardModule, CardContext, CardHandle } from "./registry";
import { patchDOM } from "../core/patch-dom";
import { myStore } from "../core/stores/my.store";

const card: CardModule = {
  mount(container: HTMLElement, ctx: CardContext): CardHandle | void {
    // Initial render
    void render();

    async function render(): Promise<void> {
      const data = await myStore.load();
      patchDOM(container, `<div data-action="refresh">${data.value}</div>`);
    }

    // Wire events via delegation — NEVER addEventListener on children
    container.addEventListener("click", (e) => {
      const action = (e.target as HTMLElement).closest("[data-action]")?.getAttribute("data-action");
      if (action === "refresh") void render();
    });

    return {
      dispose() {
        myStore.unsubscribe();
      },
    };
  },
};

export default card;
```

## Non-Negotiables

- **`patchDOM(container, html)`** — never `container.innerHTML =` (breaks morphdom diffing)
- **`data-action` attributes** — event delegation at card root, never `addEventListener` on children
- **`void asyncFn()`** — no floating promises (lint error)
- **Error boundary** — all `mount` calls are wrapped in try-catch by the router; still throw clearly
- **Cards may import**: `src/types/`, `src/domain/`, `src/core/`, `src/providers/`
- **Cards must NOT import**: `src/ui/` (except router types)

## Registering a New Card

1. Create `src/cards/{name}-card.ts`
2. Add to `src/cards/registry.ts`: `{ name, loader: () => import("./{name}-card") }`
3. Add route to `src/ui/router.ts` `RouteName` enum and route map
4. Add view section to `index.html`: `<section id="view-{name}" class="view" hidden>`

## Signal Stores

```typescript
// src/core/stores/my.store.ts
import { signal, computed, batch } from "../signals";
export const myStore = {
  data: signal<MyData | null>(null),
  loading: signal(false),
  error: signal<string | null>(null),
  async load() { ... },
};
```

- Cards subscribe to stores; stores manage fetch, cache, error handling
- Use `batch(() => { ... })` to coalesce multiple signal updates into one render

## Web Components (prefer over reimplementing)

| Component          | Purpose                                  |
| ------------------ | ---------------------------------------- |
| `<ct-data-table>`  | Virtual scroll, sort, keyboard nav, ARIA |
| `<ct-stat-grid>`   | Responsive grid of key metrics           |
| `<ct-chart-frame>` | LWC wrapper with loading/error states    |
| `<ct-filter-bar>`  | Preset buttons + custom filter inputs    |
| `<ct-empty-state>` | Consistent empty/error/loading fallback  |

## Route Loaders (data pre-fetching)

```typescript
defineRoute({
  path: "/my-view/:id",
  loader: async ({ params, signal }) => fetchData(params.id, { signal }),
  component: () => import("./cards/my-card"),
});
```

- Loaders run with AbortController — navigation cancels pending loaders
- Data arrives at `mount()` via `ctx.loaderData` — no waterfall

## Test Pattern

```typescript
import { describe, it, expect, vi } from "vitest";
import card from "../../../src/cards/my-card";

describe("my-card", () => {
  it("renders data on mount", async () => {
    vi.stubGlobal("localStorage", { getItem: vi.fn(() => null), setItem: vi.fn() });
    const container = document.createElement("div");
    card.mount(container, {} as CardContext);
    await Promise.resolve(); // flush microtasks
    expect(container.textContent).toContain("expected");
    vi.restoreAllMocks();
  });
});
```

## Common Pitfalls

- `innerHTML =` — causes flicker and breaks morphdom; always use `patchDOM()`
- Attaching listeners to child elements — use `data-action` delegation on container
- Importing `src/ui/router` for navigation — use `ctx.navigate(route)` from CardContext
- Forgetting `dispose()` — memory leak if card subscribes to stores/signals
- Not adding route to both `registry.ts` AND `router.ts` — card loads but route 404s
