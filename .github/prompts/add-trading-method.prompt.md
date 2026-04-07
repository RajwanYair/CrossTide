---
description: "Step-by-step guide for adding a new MethodSignal-based trading method detector with consensus integration."
agent: "domain-feature"
argument-hint: "Name of the trading method (e.g. 'Stochastic Oscillator', 'Williams %R')"
---
# Add Trading Method: {{input}}

Follow the `add-trading-method` skill workflow. Load `.github/skills/add-trading-method/SKILL.md` first.

## Steps

### 1. Research the method
- Understand the mathematical definition and standard parameters for **{{input}}**.
- Identify the BUY and SELL signal conditions.

### 2. Add AlertType entries
Add `<method>MethodBuy` and `<method>MethodSell` to `AlertType` in `lib/src/domain/entities.dart`.
Add `displayName` and `description` entries in `AlertTypeX`.

### 3. Create the detector
Create `lib/src/domain/<method>_method_detector.dart` following the `MethodSignal` pattern:
- `const` constructor with injectable calculator dependencies
- `evaluateBuy()` → `MethodSignal?`
- `evaluateSell()` → `MethodSignal?`
- `evaluateBoth()` → `List<MethodSignal>` (only triggered)

### 4. Wire into ConsensusEngine
Add the new `AlertType` values to `_isBuyType()` and `_isSellType()` in `consensus_engine.dart`.

### 5. Wire into RefreshService
Add a detector instance and call `evaluateBoth()` in the evaluation pipeline in `refresh_service.dart`.
Spread results into `allMethodSignals`.

### 6. Write comprehensive tests
Create `test/domain/<method>_method_detector_test.dart`:
- BUY triggers, SELL triggers, no-trigger, insufficient data, edge cases.
Update `test/domain/consensus_engine_test.dart` with the new method's signals.

### 7. Validate all quality gates
```bash
flutter analyze --fatal-infos
dart format --set-exit-if-changed lib test
flutter test --coverage --timeout 30s
```
