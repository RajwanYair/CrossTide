---
description: "Use when editing domain layer entities, SMA calculator, cross-up detector, or alert state machine. Enforces pure Dart, no Flutter/external dependencies, immutable types."
applyTo: "lib/src/domain/**"
---
# Domain Layer Rules

## Purity
- **Pure Dart only**. No Flutter imports, no third-party packages (except `equatable`).
- All entities are immutable — `const` constructors, `Equatable`, `final` fields.
- `SmaCalculator` and `CrossUpDetector` are `const` classes with no mutable state.

## Business rules
- Cross-up detection rule: `close[t-1] <= SMA200[t-1] AND close[t] > SMA200[t]`.
- Alert firing is idempotent — only fires when state transitions from `below` to `above`.
- `AlertStateMachine` governs all state transitions; quiet hours suppress notifications but still advance state.

## Code quality — zero tolerance
- `flutter analyze --fatal-infos` must report **zero issues** in domain files.
- **No `// ignore:` or `// ignore_for_file:` pragmas.** Fix the root cause.
- **No `TODO` / `FIXME` / `HACK` comments.** Open a GitHub Issue instead.
- Use explicit types on loop variables (`for (final MyType x in list)`) — do not rely on `var` inference.

## Tests
- Every public method must have unit tests in `test/domain/`.
- Domain coverage must be **100%** — enforced in CI by the coverage awk script.
