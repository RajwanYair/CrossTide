---
description: "Add a new route card with patchDOM rendering and tests"
mode: "agent"
tools: ["read_file", "create_file", "replace_string_in_file", "run_in_terminal", "runTests"]
---

# Add Route Card

Create a new card following the CardModule pattern.

## Steps

1. Create `src/cards/{name}-card.ts` with a default `CardModule` export
2. Use `patchDOM(container, html)` for rendering — **never raw `innerHTML`**
3. Use `data-action` attributes for event delegation at the card root
4. Async setup: `void asyncFn()` to avoid floating promise lint errors
5. Register the card in `src/cards/registry.ts`
6. Add the route to `src/ui/router.ts` RouteName enum
7. Add the view section to `index.html`: `<section id="view-{name}" class="view">`
8. If the card needs data, use a signal store or route loader

## Architecture Rules

- Cards may import from: `types`, `domain`, `core`, `providers`
- Cards must NOT import from: `ui` (except router types)
- Use Web Components (`<ct-data-table>`, `<ct-stat-grid>`, etc.) where applicable
- Wrap mount/update in try-catch for error boundary resilience

## Tests

Write tests in `tests/unit/cards/{name}-card.test.ts`:

- Use `happy-dom` environment
- Test: card mounts without errors
- Test: renders expected content
- Test: event delegation works
- Test: dispose cleanup runs

## Validation

Run `npm run ci` to verify all quality gates pass.

## User Request

{{input}}
