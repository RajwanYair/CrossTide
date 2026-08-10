# ADR-0015: Gate WASM Adoption With Benchmarks and a TypeScript Fallback

## Status

Accepted

## Context

Correlation, Monte Carlo risk, and vectorized backtest workloads may benefit from WebAssembly, but a WASM module adds download, initialization, compatibility, and maintenance cost. A faster implementation is not automatically a better product implementation.

## Decision

WASM is adopted only for a measured hot path whose benchmark demonstrates more than a 5x improvement in a representative workload. Every WASM kernel has a pure TypeScript fallback, loads lazily and off the main thread where practical, and remains within the bundle budget. The fallback is the correctness reference.

## Consequences

- Performance work starts with a reproducible benchmark.
- Unsupported or failed WASM initialization does not block core analysis.
- Bundle and startup costs are measured as part of the feature.
- A kernel cannot ship based on synthetic speed claims alone.

## Related

- `tests/bench/`
- `scripts/check-wasm-size.mjs`
- `docs/ROADMAP.md` Phase S
