---
description: "Write comprehensive tests for a domain function"
mode: "agent"
tools: ["read_file", "create_file", "replace_string_in_file", "runTests"]
---

# Write Domain Tests

Write Vitest unit tests for the specified domain function.

## Rules

1. Import `makeCandles` from `tests/helpers/candle-factory.ts` for test data
2. Domain tests must be **pure** — no mocks needed (functions are side-effect-free)
3. Use `it.each` for parameterized test cases
4. Cover:
   - **Normal operation** — verify against known reference values
   - **Edge cases** — empty array, single element, insufficient data
   - **Boundary values** — exact minimum input length, period boundaries
   - **Large datasets** — verify no off-by-one errors
5. No network mocks, no DOM stubs — domain is pure
6. Test file location: `tests/unit/domain/{module-name}.test.ts`

## Validation

Run the test file to verify all pass: `npx vitest run tests/unit/domain/{file}.test.ts`

## User Request

{{input}}
