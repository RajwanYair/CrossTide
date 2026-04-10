---
description: "Use when editing domain layer entities, SMA calculator, cross-up detector, alert state machine, trading method detectors, or consensus engine. Enforces pure Dart, no Flutter/external dependencies, immutable types."
applyTo: "lib/src/domain/**"
---
# Domain Layer Rules

## Purity
- **Pure Dart only**. No Flutter imports, no third-party packages (except `equatable`).
- All entities are immutable — `const` constructors, `Equatable`, `final` fields.
- `SmaCalculator`, `CrossUpDetector`, and all method detectors are `const` classes with no mutable state.

## Business rules
- Cross-up detection rule: `close[t-1] <= SMA200[t-1] AND close[t] > SMA200[t]`.
- Alert firing is idempotent — only fires when state transitions from `below` to `above` (candle-date dedup).
- `AlertStateMachine` governs all state transitions; quiet hours suppress notifications but still advance state.

## MethodSignal pattern (trading methods)
- All trading methods produce `MethodSignal` objects (base class in `micho_method_detector.dart`).
- Each detector class must be `const`-constructible with injectable calculator dependencies.
- Required public API: `evaluateBuy()` → `MethodSignal?`, `evaluateSell()` → `MethodSignal?`, `evaluateBoth()` → `List<MethodSignal>`.
- `evaluateBuy/evaluateSell` return `null` when there is insufficient data (not zero-triggered).
- `evaluateBoth` returns only signals where `isTriggered == true`.
- Current detectors: `MichoMethodDetector` (primary), `RsiMethodDetector`, `MacdMethodDetector`, `BollingerMethodDetector`.
- File naming: `<method>_method_detector.dart` (e.g. `rsi_method_detector.dart`).

## Consensus Engine
- `ConsensusEngine.evaluate()` takes a flat `List<MethodSignal>` and returns a `ConsensusResult`.
- **BUY consensus**: Micho BUY triggered + ≥1 other method BUY triggered.
- **SELL consensus**: Micho SELL triggered + ≥1 other method SELL triggered.
- New method AlertTypes must be added to `_isBuyType()` and `_isSellType()`.

## Calculators
- `SmaCalculator` — simple moving average (periods: 50, 150, 200)
- `RsiCalculator` — relative strength index (default period: 14)
- `MacdCalculator` — MACD line, signal line, histogram (12/26/9)
- `BollingerCalculator` — middle band (SMA20) ± 2σ
- `EmaCalculator` — exponential moving average (generic)
- `AtrCalculator` — average true range
- `VolumeAnalyzer` — volume spike detection
- `VwapCalculator` — volume-weighted average price
- All calculators are `const`, pure Dart, and return nullable when data is insufficient.

## Naming Conflict Pre-Flight Check

Before defining any new `enum` or `class`, run `grep_search` across `lib/src/domain/` for the
proposed name. Two domain files exporting the same name through `domain.dart` causes a fatal
`ambiguous_export` error (GH #14).

**Known conflicts — do not redefine:**
| Name | Defined in | Use instead |
|------|-----------|-------------|
| `NotificationChannel` | `entities.dart` | `AlertDeliveryChannel` |
| `TickerSearchResult` | `ticker_search_index.dart` | `TickerQueryResult` |
| `AuditLogEntry` | `entities.dart` | `SystemAuditEntry` (`audit_log_entry.dart`) |
| `EconomicImpactLevel` | `economic_calendar_event.dart` | Add `import 'economic_calendar_event.dart'` |

## Barrel Ordering

`domain.dart` enforces `directives_ordering` — exports must be **strictly alphabetical**.
Verify surrounding barrel entries via `grep_search` before inserting.
Tricky cases: `smart_` sorts before `sma_`; `ticker_correlation` before `ticker_screener`.

## Null Safety Patterns

Prefer null-aware operators over explicit null-check + bang:
```dart
// WRONG — prefer_null_aware_operators lint
final d = completedAt == null ? null : completedAt!.difference(start);
// CORRECT
final d = completedAt?.difference(start);
```

## Code quality — zero tolerance
- `flutter analyze --fatal-infos` must report **zero issues** in domain files.
- **No `// ignore:` or `// ignore_for_file:` pragmas.** Fix the root cause.
- **No `TODO` / `FIXME` / `HACK` comments.** Open a GitHub Issue instead.
- Use explicit types on loop variables (`for (final MyType x in list)`) — do not rely on `var` inference.

## Tests
- Every public method must have unit tests in `test/domain/`.
- Domain coverage must be **100%** — enforced in CI by the coverage awk script.
- Method detector tests follow pattern in `test/domain/rsi_method_detector_test.dart`.
- Consensus engine tests must cover all methods' signals.
