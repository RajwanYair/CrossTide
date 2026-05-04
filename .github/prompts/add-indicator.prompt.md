---
description: "Add a new pure technical indicator to the domain layer with tests"
mode: "agent"
tools: ["read_file", "create_file", "replace_string_in_file", "run_in_terminal", "runTests"]
---

# Add Technical Indicator

Create a pure function in `src/domain/indicators/` computing the requested indicator.

## Rules

1. Follow the `computeSma`/`computeEma` pattern: accept `DailyCandle[]` + params, return `number[] | null`
2. The function must be **pure** — no DOM, no fetch, no `Date.now()`, no `Math.random()`
3. Add explicit return type annotation on the exported function
4. Standard input type: `DailyCandle[]` from `src/types/domain.ts`
5. Export from `src/domain/indicators/index.ts` barrel

## Tests

Add unit tests in `tests/unit/domain/` using:

- `makeCandles(prices)` from `tests/helpers/candle-factory.ts`
- Cover: exact values against known-good reference, insufficient data returns `null`, edge cases
- Use `it.each` for parameterized test cases

## Validation

Run `npm run ci` to verify all quality gates pass.

## User Request

{{input}}
