---
description: "Use when writing or editing Flutter unit tests, widget tests, or integration tests. Covers test patterns, fixtures, and conventions."
applyTo: "test/**"
---
# Testing Conventions

## File layout
- Domain tests in `test/domain/`, data tests in `test/data/`, application tests in `test/application/`.
- File names: `<class>_test.dart`.

## Style
- Test names follow pattern: `'<behavior> when <condition>'`.
- Helper functions use camelCase — no leading underscores for top-level helpers.
- Use `const` for immutable test fixtures.
- For database tests: `AppDatabase.forTesting(NativeDatabase.memory())`.
- For provider tests: use `ProviderContainer` with overrides.

## Boundary Value Testing

Before writing value-boundary assertions, **check whether the implementation uses strict (`>`)
or inclusive (`>=`) comparison** (GH #18). Using a value exactly equal to the threshold with a
strict comparator silently fails.

```dart
// If implementation is: bool get isElevated => value > threshold * 1.5;
// WRONG: 40.0 > 40.0 == false — test fails
expect(surface.isCurrentlyElevated, isTrue); // latest=40.0, threshold=40.0

// CORRECT: pick a value clearly above the threshold
expect(surface.isCurrentlyElevated, isTrue); // latest=50.0, threshold=45.0 ✓
```

## const vs final in Test Fixtures

Use `const` for entire fixture when no `DateTime` fields; `final` when any `DateTime` is present (GH #19).

```dart
// WRONG — prefer_const_declarations lint
final snap = const WatchlistTickerSnapshot(ticker: 'AAPL', closePrice: 200.0, sma200: 180.0);
// CORRECT
const snap = WatchlistTickerSnapshot(ticker: 'AAPL', closePrice: 200.0, sma200: 180.0);

// CORRECT when DateTime present (DateTime is never const)
final entry = MarketHoliday(exchange: TradingExchange.nyse, date: DateTime(2026, 1, 1), name: 'NYD');
```

## Coverage targets
- **Domain layer: 100%** — strictly enforced in CI. A PR that drops domain coverage below 100% fails.
- **Overall project: ≥ 90%** — enforced as a quality expectation; avoid merging code that drops total coverage below this threshold.
- Run with: `flutter test --coverage --timeout 30s`.

## Quality — zero tolerance
- Tests must pass with **zero errors and zero warnings** from `flutter analyze --fatal-infos`.
- **No `// ignore:` pragmas in test files** — fix the lint correctly.
- **No skipped or commented-out tests** unless the corresponding issue is open and linked.

## Commands
- All tests: `flutter test`
- Domain only: `flutter test test/domain/`
- With coverage: `flutter test --coverage --timeout 30s`
