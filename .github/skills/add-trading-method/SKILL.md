# Add Trading Method — Skill

Use this workflow whenever you add a new `MethodSignal`-based detector or extend the signal ecosystem.

Follow the steps in order. Do not skip validation.

## Read These Files First
- `lib/src/domain/micho_method_detector.dart`
- `lib/src/domain/rsi_method_detector.dart`
- `lib/src/domain/consensus_engine.dart`
- `lib/src/domain/weighted_consensus_engine.dart`
- `lib/src/domain/entities.dart`
- `lib/src/application/refresh_service.dart`
- `lib/src/application/notification_service.dart`

## Existing Method Set
The current method roster is:
- Micho Method
- RSI Method
- MACD Crossover
- Bollinger Bands
- Stochastic Method
- OBV Divergence
- ADX Trend
- CCI Method
- Parabolic SAR
- Williams %R
- MFI Method
- SuperTrend

New methods must fit this ecosystem cleanly.

## Step 1 — Define Alert Types
In `lib/src/domain/entities.dart`:
1. Add `<xyz>MethodBuy` and `<xyz>MethodSell` to `AlertType` near the other method-specific entries.
2. Add matching `displayName` and `description` mappings.
3. If there is a method list or helper that classifies method alerts, update it as well.

## Step 2 — Implement the Detector
Create `lib/src/domain/<xyz>_method_detector.dart`.

Requirements:
- pure Dart only
- `const` constructor
- injectable calculator dependencies if needed
- `static const String methodName`
- `requiredCandles` or equivalent guard
- `evaluateBuy()` returns `MethodSignal?`
- `evaluateSell()` returns `MethodSignal?`
- `evaluateBoth()` returns only triggered signals

Detector contract:
- return `null` when data is insufficient
- keep logic deterministic and side-effect free
- no Flutter, Drift, Dio, or Riverpod imports
- use explicit loop variable types

## Step 3 — Update Consensus Engines
In `lib/src/domain/consensus_engine.dart`:
- add the new BUY type to `_isBuyType()`
- add the new SELL type to `_isSellType()`

In `lib/src/domain/weighted_consensus_engine.dart`:
- add the new BUY type to the weighted buy classifier
- add the new SELL type to the weighted sell classifier
- ensure default weighting behavior remains coherent

Do not update one engine without the other.

## Step 4 — Wire into RefreshService
In `lib/src/application/refresh_service.dart`:
1. Add a detector field, usually `final _xyzDetector = const XyzMethodDetector();`
2. Call `evaluateBoth()` during method evaluation
3. Spread results into `allMethodSignals`
4. Keep ordering consistent with the existing method evaluation pipeline
5. If the method needs dedicated local notifications or candle-date dedup, update orchestration and storage accordingly

## Step 5 — Update Notifications Only If Needed
If the method gets its own notification channel or explicit delivery surface:
1. Extend `INotificationService` in `lib/src/application/notification_service.dart`
2. Implement the methods in all concrete services, including fallback chains
3. Update application tests and test doubles

If the method only contributes to consensus and does not need standalone delivery, do not add notification methods unnecessarily.

## Step 6 — Write Tests
Create `test/domain/<xyz>_method_detector_test.dart` covering:
- BUY trigger
- SELL trigger
- non-trigger path
- insufficient data
- boundary values
- exact-threshold behavior when comparisons are strict vs inclusive

Also update:
- `test/domain/consensus_engine_test.dart`
- `test/domain/weighted_consensus_engine_test.dart` when the weighted engine should classify the new method

Prefer shared helpers in:
- `test/helpers/candle_factory.dart`
- `test/helpers/signal_factory.dart`

## Step 7 — Validate Quality Gates
Run and fix every issue before stopping:

```bash
flutter analyze --fatal-infos
dart format --set-exit-if-changed lib test
flutter test --coverage --timeout 30s
```

Domain coverage must remain 100%.

## Completion Checklist
- [ ] AlertType BUY/SELL entries added
- [ ] Detector created and const-constructible
- [ ] `ConsensusEngine` updated
- [ ] `WeightedConsensusEngine` updated
- [ ] `RefreshService` wired
- [ ] Notification surface updated only if required
- [ ] Detector tests added
- [ ] Consensus tests updated
- [ ] Quality gates pass with zero suppressions
