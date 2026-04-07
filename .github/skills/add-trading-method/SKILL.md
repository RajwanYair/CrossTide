# Add Trading Method — Skill

A guided workflow for adding a new MethodSignal-based trading method to CrossTide. Follow every step in order. Each step must pass before proceeding.

## Prerequisites
- Read the existing method detectors to understand the pattern:
  - `lib/src/domain/micho_method_detector.dart` — defines `MethodSignal` base class + Micho detector
  - `lib/src/domain/rsi_method_detector.dart` — good example of a secondary detector
  - `lib/src/domain/consensus_engine.dart` — groups signals and checks consensus rules
  - `lib/src/domain/entities.dart` — `AlertType` enum (currently 18 values)

## Step 1 — Add AlertType entries
In `lib/src/domain/entities.dart`:
1. Add `xyzMethodBuy` and `xyzMethodSell` to the `AlertType` enum (before `consensusBuy`).
2. Add corresponding `displayName` and `description` entries in the `AlertTypeX` extension.

## Step 2 — Create the detector class
Create `lib/src/domain/xyz_method_detector.dart`:
```dart
/// XYZ Method Detector — Pure domain logic.
///
/// <description of the method and its BUY/SELL rules>
library;

import 'entities.dart';
import 'micho_method_detector.dart'; // for MethodSignal

class XyzMethodDetector {
  const XyzMethodDetector({/* injectable calculator dependencies */});

  static const String methodName = 'XYZ Method';

  int get requiredCandles => /* period + warmup */;

  MethodSignal? evaluateBuy({
    required String ticker,
    required List<DailyCandle> candles,
  }) {
    // 1. Guard: candles.length < requiredCandles → return null
    // 2. Compute indicator values for t and t-1
    // 3. Apply BUY condition
    // 4. Return MethodSignal with alertType: AlertType.xyzMethodBuy
  }

  MethodSignal? evaluateSell({
    required String ticker,
    required List<DailyCandle> candles,
  }) {
    // Mirror of evaluateBuy with SELL condition
  }

  List<MethodSignal> evaluateBoth({
    required String ticker,
    required List<DailyCandle> candles,
  }) {
    final buy = evaluateBuy(ticker: ticker, candles: candles);
    final sell = evaluateSell(ticker: ticker, candles: candles);
    return [
      if (buy != null && buy.isTriggered) buy,
      if (sell != null && sell.isTriggered) sell,
    ];
  }
}
```

Key rules:
- The class must be `const`-constructible.
- `evaluateBuy` and `evaluateSell` return `MethodSignal?` (null = insufficient data).
- `evaluateBoth` returns only triggered signals.
- No Flutter imports — this is pure Dart domain code.
- Use explicit loop variable types everywhere.
- No `// ignore:` pragmas.

## Step 3 — Wire into ConsensusEngine
In `lib/src/domain/consensus_engine.dart`:
1. Add `AlertType.xyzMethodBuy` to `_isBuyType()`.
2. Add `AlertType.xyzMethodSell` to `_isSellType()`.

No other changes needed — the engine is signal-agnostic after this.

## Step 4 — Wire into RefreshService
In `lib/src/application/refresh_service.dart`:
1. Add a `final _xyzDetector = const XyzMethodDetector();` field.
2. In the evaluation pipeline, call `_xyzDetector.evaluateBoth(ticker: ticker, candles: candles)`.
3. Spread the results into the `allMethodSignals` list.
4. (Optional) Add method-specific notification calls if needed.
5. (Optional) Add idempotency columns to the DB schema if the method's alerts need candle-date dedup.

## Step 5 — Add notification support
In `lib/src/application/i_notification_service.dart`:
1. Add `showXyzMethodBuy(...)` and `showXyzMethodSell(...)` methods to the interface.
2. Implement them in all concrete implementations (Local, Fallback).
3. Update test doubles in `test/`.

## Step 6 — Write tests
Create `test/domain/xyz_method_detector_test.dart`:
- Test BUY signal triggers correctly.
- Test SELL signal triggers correctly.
- Test no-trigger when conditions aren't met.
- Test null return when insufficient data.
- Test edge cases (exactly at threshold, boundary values).
- Follow the pattern in `test/domain/rsi_method_detector_test.dart`.
- Use `const` for immutable fixtures.
- Test names: `'<behavior> when <condition>'`.

Update `test/domain/consensus_engine_test.dart`:
- Add a test that includes the new method's signals in consensus evaluation.

## Step 7 — Validate
Run these commands and fix any issues:
```bash
flutter analyze --fatal-infos     # Must be zero issues
dart format lib test              # Must exit 0
flutter test --coverage --timeout 30s  # All tests pass
```

Domain coverage must remain 100%.

## Checklist
- [ ] AlertType entries added (Buy + Sell)
- [ ] Detector class created with evaluateBuy/evaluateSell/evaluateBoth
- [ ] ConsensusEngine _isBuyType/_isSellType updated
- [ ] RefreshService wired
- [ ] INotificationService extended (if needed)
- [ ] Unit tests written (detector + consensus integration)
- [ ] All quality gates pass
