---
description: "Use when editing domain layer entities, SMA calculator, cross-up detector, or alert state machine. Enforces pure Dart, no Flutter/external dependencies, immutable types."
applyTo: "lib/src/domain/**"
---
# Domain Layer Rules

- **Pure Dart only**. No Flutter imports, no third-party packages (except `equatable`).
- All entities are immutable — use `const` constructors, `Equatable`, final fields.
- `SmaCalculator` and `CrossUpDetector` are `const` classes with no mutable state.
- Cross-up detection rule: `close[t-1] <= SMA200[t-1] AND close[t] > SMA200[t]`.
- Alert firing is idempotent — only fires when state transitions from `below` to `above`.
- Every public method must have unit tests in `test/domain/`.
