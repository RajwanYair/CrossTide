---
description: "Add or extend a domain-layer rule, entity, calculator, detector, or signal engine"
agent: "domain-feature"
argument-hint: "Feature description, e.g. 'Add SMA20 crossover detection'"
---
Implement the requested domain feature and choose the correct path:

1. If this is a new trading method, use the `add-trading-method` skill workflow.
2. If this is an entity or value object, preserve immutability and Equatable semantics.
3. If this is a calculator or evaluator, keep it pure Dart and deterministic.
4. If this changes method alert types, update both consensus engines.
5. If this changes state transitions, update `AlertStateMachine` and related tests.
6. Add focused tests in `test/domain/` and keep domain coverage at 100%.

Validation:
```bash
flutter analyze --fatal-infos
dart format --set-exit-if-changed lib test
flutter test --coverage --timeout 30s
```
