# ADR-0009: Web Components for Shared UI Primitives

## Status

Accepted

## Context

24 cards independently implement tables, stat grids, empty states, and chart frames. This causes:

- Code duplication (~60% overlap)
- Inconsistent UX (different loading spinners, empty states)
- Hard to maintain (fix in one place, miss 23 others)

## Decision

Extract 5 base Web Components (`ct-data-table`, `ct-stat-grid`, `ct-empty-state`, `ct-chart-frame`, `ct-filter-bar`) as native Custom Elements — no Shadow DOM (to allow theme CSS to apply).

Why Web Components over a framework:

- Zero runtime cost (native browser API)
- Encapsulated logic without style isolation issues
- Composable with existing morphdom + signals architecture
- No build step beyond standard ES modules

## Consequences

- **Pro**: Single source of truth for each UI pattern
- **Pro**: Cards become thin wrappers: fetch data → render into components
- **Pro**: Keyboard nav, a11y, virtual scroll built in once
- **Con**: No Shadow DOM means global CSS can leak in (mitigated by BEM naming)
- **Con**: First Web Components in the project — sets a new pattern

## Related

- P9: `<ct-data-table>` in `src/ui/data-table.ts`
- P10: `<ct-stat-grid>` in `src/ui/stat-grid.ts`
- P11: `<ct-empty-state>` in `src/ui/empty-state.ts`
