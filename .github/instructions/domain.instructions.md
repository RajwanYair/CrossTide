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
- Current detectors: `MichoMethodDetector`, `RsiMethodDetector`, `MacdMethodDetector`, `BollingerMethodDetector`, `StochasticMethodDetector`, `ObvMethodDetector`, `AdxMethodDetector`, `CciMethodDetector`, `SarMethodDetector`, `WilliamsRMethodDetector`, `MfiMethodDetector`, `SupertrendMethodDetector`.
- File naming: `<method>_method_detector.dart` (e.g. `rsi_method_detector.dart`).

## Consensus Engines
- `ConsensusEngine.evaluate()` takes a flat `List<MethodSignal>` and returns a `ConsensusResult`.
- **BUY consensus**: Micho BUY triggered + ≥1 other method BUY triggered.
- **SELL consensus**: Micho SELL triggered + ≥1 other method SELL triggered.
- `WeightedConsensusEngine` must stay aligned with method alert typing and classification.
- New method AlertTypes must be added to `_isBuyType()` / `_isSellType()` in both engines where applicable.

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
| `NewsSentiment` | `news_relevance_scorer.dart` | Use `TickerNewsSentiment` (different values) |
| `MarketRegimeType` | `market_regime_signal.dart` | `RegimeClassificationType` (new file) |
| `ProviderHealthStatus` | `provider_sync_state.dart` | `DataProviderHealthStatus` (new file) |

## Barrel Ordering

`domain.dart` enforces `directives_ordering` — exports must be **strictly alphabetical**.
Verify surrounding barrel entries via `grep_search` before inserting.
Tricky cases: `smart_` sorts before `sma_`; `ticker_correlation` before `ticker_screener`;
`chart_annotation_preset` before `chart_annotation_set`; `screener_preset` before `search_history_entry`
(scr < sea); check 3rd/4th character when entries share a common prefix.

Additional ordering lessons (S451-S500):
- `conditional_` (con_d) < `consensus_` (con_s): d < s — `conditional_order_entry` before `consensus_engine`.
- `signal_expiry` (expi) < `signal_explanation` (expl): i < l.
- `feature_` (fea) < `feed_` (fee) < `feedback_` (feedb): underscore < b in ASCII.
- `cache_eviction` (cac) < `calmar_ratio` (cal): c < l.
- `contextual_` (con-t-e) < `copilot_` (cop) < `corporate_` (cor): n < p < r at 3rd char after `co`.
- `database_` (d-a-t-a-b) > `data_` (d-a-t-a-_): underscore (95) < 'b' (98) so `data_*` files sort before `database_*`.
- `scheduled_` (sc) < `screener_` (scr): h < r.
- `strategy_comparison` < `strategy_performance` < `strategy_rule_set`: c < p < r.

Additional ordering lessons (S501-S550):
- `ab_test_assignment` (ab) < `accessibility_checker` (ac): b < c — `ab_*` files sort before all `ac*`.
- `app_update_manifest` (app_u) comes after `app_runtime_context` (app_r): r < u.
- `crash_report_summary` (cr-a) < `credit_spread_snapshot` (cr-e): a < e at 3rd char.
- `enterprise_value_estimate` (ent-e) < `entities` (ent-i): e < i — insert before `entities.dart`.
- `execution_venue_config` (ex-e) > `exchange_connectivity_status` (ex-c): e > c at 3rd char after `ex`.
- `carry_trade_signal` (car-r) > `carbon_exposure_estimate` (car-b): b < r at 4th char after `car`.
- `factor_loading_snapshot` (fa-c) fits between `export_format_preference` and `feature_access_policy`.
- `free_cash_flow_yield` (fre) fits after `forex_calculator` (fo): o < r < u (free < fundamental).
- `remote_config_snapshot` (rem) fits after `relative_volume_calculator` (rel): l < m, before `report_*` (rep).
- `size_factor_signal` (si-z) < `slippage_estimate` (sl): i < l at 2nd char after `s`.
- `user_cohort_definition` (user_c) fits after `user_backup_profile` (user_b): b < c, before `user_defined_indicator` (user_d).

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
- Prefer shared test helpers instead of duplicating candle and signal fixture factories when suitable.

## Tests
- Every public method must have unit tests in `test/domain/`.
- Domain coverage must be **100%** — enforced in CI by the coverage awk script.
- Method detector tests follow pattern in `test/domain/rsi_method_detector_test.dart`.
- Consensus and weighted-consensus tests must cover all supported method signals.
