# ADR-0012: Split Vitest Into Node and DOM Projects

## Status

Accepted

## Context

CrossTide contains pure domain, Worker, provider, and type modules alongside cards and UI modules. Running every test in a DOM emulator hides accidental browser dependencies and makes the inner loop slower.

## Decision

Vitest runs two projects. The `node` project owns `tests/unit/{domain,worker,providers,types,helpers}/` and the `dom` project owns browser-facing tests with happy-dom. Both projects use network guards that reject unstubbed fetch calls.

## Consequences

- Pure modules are tested without DOM globals.
- Card and UI tests retain the browser APIs they require.
- New tests must be placed according to their runtime dependency.
- A DOM-free-by-path exception must declare its environment in the test file.

## Related

- `vitest.config.ts`
- `.github/instructions/tests.instructions.md`
