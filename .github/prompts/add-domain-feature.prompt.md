---
description: "Add a new domain-layer business rule, entity field, or SMA/alert calculation"
agent: "domain-feature"
argument-hint: "Feature description, e.g. 'Add SMA20 crossover detection'"
---
Add the requested domain feature:

1. Read `lib/src/domain/entities.dart` and related domain files
2. Extend or create entities using `Equatable`, `const` constructors, `final` fields
3. Domain layer must stay pure Dart — no Flutter, Drift, Dio, or Riverpod imports
4. Implement business rule following cross-up pattern:
   - `close[t-1] <= SMAn[t-1] AND close[t] > SMAn[t]`
   - Alerts are idempotent — same event fires only once
5. If adding a **trading method**, follow the `MethodSignal` pattern:
   - Use `/add-trading-method` prompt or load `.github/skills/add-trading-method/SKILL.md`
   - Detector must be `const`-constructible, produce `MethodSignal` objects
   - Wire into `ConsensusEngine._isBuyType`/`_isSellType`
6. Update `AlertStateMachine` if adding new alert states
7. Write unit tests in `test/domain/` with 100% coverage of the new code
8. Test naming: `'<behavior> when <condition>'`
9. No `// ignore:` pragmas — fix lint with real code
10. No `TODO/FIXME/HACK` — track work in GitHub Issues
11. Verify:
    ```bash
    flutter analyze --fatal-infos                  # zero issues
    dart format --set-exit-if-changed lib test      # exit 0
    flutter test --coverage --timeout 30s           # domain 100%, overall ≥90%
    ```
