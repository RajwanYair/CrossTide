# Copilot Guide for CrossTide

Coding conventions, prompt patterns, and guardrails for using GitHub Copilot effectively in this project.

## Coding Conventions

- **Dart style**: Follow `analysis_options.yaml` (prefer single quotes, const constructors, final locals)
- **Architecture**: Domain logic is pure Dart — no Flutter imports in `/domain/`
- **State management**: Riverpod — use `Provider`, `FutureProvider`, `StreamProvider`
- **Navigation**: GoRouter — define routes in `router.dart`
- **Persistence**: Drift — tables in `database.dart`, queries as methods on `AppDatabase`
- **Networking**: Dio with `IOHttpClientAdapter` (from `package:dio/io.dart`) — never the deprecated `onHttpClientCreate`
- **Tests**: Domain logic must have tests. Test-first for new indicators/rules.
- **Java SDK**: 21 (Temurin LTS) — set in `android/app/build.gradle.kts` and in CI `actions/setup-java@v4`

## Trading Methods & Consensus Engine

CrossTide evaluates multiple trading methods and combines them through a consensus engine:

| Method | BUY Condition | SELL Condition |
|--------|--------------|----------------|
| **Micho** (primary) | Price crosses above MA150 + MA150 flat/rising + within 5% | Price crosses below MA150 |
| **RSI** | RSI exits oversold (<30→≥30) | RSI exits overbought (>70→≤70) |
| **MACD** | MACD crosses above signal line | MACD crosses below signal line |
| **Bollinger** | Price crosses above lower band | Price crosses below upper band |
| **Stochastic** | %K crosses above %D from oversold | %K crosses below %D from overbought |
| **OBV** | Positive OBV divergence | Negative OBV divergence |
| **ADX** | Strong trend + DI+ > DI− | Strong trend + DI− > DI+ |
| **CCI** | CCI exits oversold (crosses above −100) | CCI exits overbought (crosses below +100) |
| **SAR** | Parabolic SAR flips to BUY direction | Parabolic SAR flips to SELL direction |
| **Williams %R** | %R exits oversold (crosses above −80) | %R exits overbought (crosses below −20) |
| **MFI** | MFI exits oversold (<20→≥20) | MFI exits overbought (>80→≤80) |
| **SuperTrend** | SuperTrend direction flip to bullish | SuperTrend direction flip to bearish |

**Consensus**: GREEN BUY = Micho BUY + ≥1 other BUY. RED SELL = Micho SELL + ≥1 other SELL.

All methods use the **MethodSignal pattern**:
- Detector classes are `const`-constructible with injectable calculators
- Each provides `evaluateBuy()`, `evaluateSell()`, `evaluateBoth()`
- Signals are grouped by `ConsensusEngine.evaluate()` for composite decisions

To add a new method, use the `/add-trading-method` prompt or the `add-trading-method` skill.

## Quality Gates — Zero Tolerance

All of the following must pass before merging:

| Gate | Command | Requirement |
|------|---------|-------------|
| Static analysis | `flutter analyze --fatal-infos` | **Zero** issues (errors, warnings, infos) |
| Formatting | `dart format --set-exit-if-changed lib test` | Exit 0. Scope to `lib test` — never `.` |
| Tests | `flutter test --coverage --timeout 30s` | All pass |
| Domain coverage | CI awk script | **100%** |
| Overall coverage | CI / Codecov | **≥ 90%** |

**Prohibited patterns (no waivers):**
- `// ignore:` or `// ignore_for_file:` anywhere in `lib/` or `test/`
- `TODO` / `FIXME` / `HACK` comments in `lib/` — open a GitHub Issue instead
- Suppressed lints, skipped tests, or commented-out test cases

## Loop Variable Types

Always declare the loop variable type explicitly:
```dart
// CORRECT
for (final IMarketDataProvider p in fallback.providers) { ... }

// WRONG — triggers prefer_type_over_var
for (final p in fallback.providers) { ... }
```

## DateTime is Never const

`DateTime(...)` constructors are NOT const in Dart. Any class holding a `DateTime` field
cannot be `const`-constructed. Use `final` instead:

```dart
// CORRECT
final holiday = MarketHoliday(exchange: TradingExchange.nyse, date: DateTime(2026, 1, 1), name: 'NYD');
final calendar = MarketHolidayCalendar(holidays: [holiday]);

// WRONG — compile error: const_initialized_with_non_constant_value
const holiday = MarketHoliday(date: DateTime(2026, 1, 1), ...);
```

This applies in tests too: any group-level fixture that contains a `DateTime` must be declared `final`.

## Barrel File Alphabetical Ordering

`lib/src/domain/domain.dart` is a barrel of `export` directives. The linter enforces
`directives_ordering` — all exports must be strictly alphabetical within the file:

```
// triggerred by: info - Sort directive sections alphabetically
export 'ticker_correlation_cluster.dart'; // ← must come BEFORE ticker_screener
export 'ticker_screener.dart';
```

When inserting a new export, verify the surrounding entries before and after. Pay attention
to prefixes that sort differently than expected (e.g., `smart_` < `sma_`).

## prefer_const_literals / prefer_const_declarations

Two common lints when building `@immutable` objects in tests:

```dart
// prefer_const_literals_to_create_immutables: list args need const prefix
final report = AppDiagnosticReport(
  entries: const [okEntry, critEntry],  // ← const needed
  generatedAt: DateTime(2026),
  appVersion: '1.9.0',
);

// prefer_const_declarations: final = const Foo() → const Foo()
// WRONG
final snap = const WatchlistTickerSnapshot(ticker: 'AAPL', closePrice: 200, sma200: 180);
// CORRECT
const snap = WatchlistTickerSnapshot(ticker: 'AAPL', closePrice: 200, sma200: 180);
```

## Domain Layer: No Side Effects in Constructors/Methods

Domain methods that compute a result must accept all time-varying inputs as parameters —
never call `DateTime.now()` from within a domain method or constructor:

```dart
// CORRECT — caller passes resolvedAt
ConflictResolution resolve(SyncConflict conflict, {required DateTime resolvedAt}) { ... }

// WRONG — hidden side effect
ConflictResolution resolve(SyncConflict conflict) {
  final now = DateTime.now();  // ← forbidden in domain layer
  ...
}
```

## Notifier Method Naming

Do not name `Notifier` methods `set` (triggers `use_setters_to_change_properties`):
```dart
// CORRECT
void applyFilter(String? value) => state = value;

// WRONG
void set(String? value) => state = value;  // lint error
```

## Dio Proxy / HTTP Client

Use `IOHttpClientAdapter.createHttpClient` from `package:dio/io.dart` for custom client config:
```dart
import 'package:dio/io.dart';

(dio.httpClientAdapter as IOHttpClientAdapter).createHttpClient = () {
  final client = HttpClient();
  client.findProxy = (uri) => 'PROXY $proxyUrl';
  return client;
};
```

The deprecated pattern (`as dynamic)?.onHttpClientCreate`) is not permitted.

## Useful Copilot Prompts

### Add a new market data provider

```
Implement IMarketDataProvider for [Twelve Data / IEX Cloud].
Follow the pattern in yahoo_finance_provider.dart.
Parse the API response into List<DailyCandle> sorted ascending by date.
Handle rate limits and errors with MarketDataException.
Document the API's rate limits and required key.
```

### Add a new trading method

```
Use /add-trading-method to add a [Stochastic / Williams %R / ADX] method.
The skill walks through: AlertType → Detector → ConsensusEngine → RefreshService → Tests.
```

### Add a new technical indicator

```
Create a pure Dart class in lib/src/domain/ that computes [EMA / RSI / MACD].
Follow SmaCalculator pattern: constructor is const, compute() returns nullable.
Add unit tests in test/domain/ covering: exact values, insufficient data, edge cases.
```

### Add a new screen

```
Create a ConsumerStatefulWidget in lib/src/presentation/screens/.
Add a GoRoute in router.dart.
Use ref.watch() for reactive state and ref.read() for actions.
Follow the pattern in ticker_list_screen.dart.
```

### Write tests for domain logic

```
Write unit tests for [class name] in test/domain/.
Cover: normal operation, edge cases (empty input, insufficient data),
boundary values (exactly N items), and error conditions.
Use const for immutable fixtures, camelCase helpers (no leading underscores).
```

## Guardrails

- **No secrets**: Never generate, hardcode, or suggest API keys in code
- **Test-first for domain**: Always write tests before or alongside domain logic
- **No side effects in domain**: Domain classes must be pure — no network, no DB, no Flutter
- **Type safety**: Use Drift's type-safe queries; avoid raw SQL
- **Error handling**: Wrap provider calls in try/catch; log errors; never crash background tasks
- **No suppression**: Never use `// ignore:` or `// ignore_for_file:` — fix the root cause
- **No TODOs in code**: Use GitHub Issues for deferred work

## Architecture Boundaries

| Layer | Can depend on | Cannot depend on |
|-------|--------------|------------------|
| Domain | dart:core, equatable | Flutter, data, application, presentation |
| Data | Domain, drift, dio | Application, presentation |
| Application | Domain, data | Presentation |
| Presentation | All layers | — |

## Copilot Agents, Prompts & Skills

### Agents
| Agent | Purpose | Mode |
|-------|---------|------|
| `data-integration` | Add/modify market data providers | Read + Edit + Execute |
| `domain-feature` | Add/modify domain entities, methods, consensus | Read + Edit + Execute |
| `reviewer` | Architecture + quality audit | Read-only |

### Prompts
| Prompt | Purpose |
|--------|---------|
| `/add-data-provider` | Step-by-step guide for new market data providers |
| `/add-domain-feature` | Step-by-step guide for domain rules and entities |
| `/add-trading-method` | Full workflow for new MethodSignal-based methods |
| `/generate-tests` | Generate domain unit tests |
| `/health-check` | Full quality gate run (analyze + format + test) |
| `/consensus-check` | Verify consensus engine covers all methods |

### Skills
| Skill | Purpose |
|-------|---------|
| `add-trading-method` | Guided workflow for creating a new method detector |

### Hooks
| Hook | Event | Purpose |
|------|-------|---------|
| `format-on-save` | PostToolUse | Auto-formats Dart files after edits |
| `terminal-safety` | PreToolUse | Blocks destructive terminal commands |

---

## Accumulated Learnings (S291–S340)

These pitfalls were encountered and fixed during the v2.0.0–v2.3.0 domain expansion sprints.
Each has a corresponding closed GitHub issue with the fix commit hash.

### Naming Conflict Pre-Flight Check (GH #14)

Before defining any new `enum` or `class` in `lib/src/domain/`, **always `grep` the entire
`lib/src/domain/` directory for the proposed name**. Two files exporting the same name through
`domain.dart` causes a fatal `ambiguous_export` analyzer error that breaks all builds.

**Known conflicts resolved (do not redefine these):**

| Name to avoid | Defined in | Renamed to |
|---------------|-----------|-----------|
| `NotificationChannel` | `entities.dart` | Use `AlertDeliveryChannel` |
| `TickerSearchResult` | `ticker_search_index.dart` | Use `TickerQueryResult` |
| `AuditLogEntry` | `entities.dart` | Use `SystemAuditEntry` in `audit_log_entry.dart` |
| `EconomicImpactLevel` | `economic_calendar_event.dart` | Do not redefine — add `import 'economic_calendar_event.dart'` |

```dart
// WRONG — ambiguous_export if TickerSearchResult already exists
class TickerSearchResult extends Equatable { ... }

// CORRECT — unique name after conflict check
class TickerQueryResult extends Equatable { ... }
```

### prefer_null_aware_operators (GH #17)

When a nullable field is used to compute a value, use `?.` rather than the explicit null-check
pattern. The linter enforces this.

```dart
// WRONG — triggers prefer_null_aware_operators
final duration = completedAt == null ? null : completedAt!.difference(startedAt);

// CORRECT
final duration = completedAt?.difference(startedAt);
```

### Boundary Value Tests — Strict vs Inclusive Comparators (GH #18)

Before writing boundary-value assertions, check whether the implementation uses **strict** (`>`)
or **inclusive** (`>=`) comparison. Using a value exactly equal to the threshold with a strict
comparator will silently fail.

```dart
// Implementation (strict >):
bool get isCurrentlyElevated => latest.historicalVolatility > averageHv * 1.5;

// WRONG test — 40.0 > 40.0 is false, so test fails even with "correct" value
expect(surface.isCurrentlyElevated, isTrue);  // levels = [20, 20, 40], avg=26.7, threshold=40.0

// CORRECT test — use a value clearly above the threshold
expect(surface.isCurrentlyElevated, isTrue);  // levels = [20, 20, 50], threshold=45.0 → 50 > 45 ✓
```

### Barrel Alphabetical Ordering (GH #20)

`domain.dart` enforces `directives_ordering` — all exports must be **strictly alphabetical**.
Inserting an export in the wrong position causes a fatal analyzer info.

Tricky sort order examples:
- `smart_alert_schedule` comes **before** `sma_calculator` (because `smart_` < `sma_`)
- `ticker_correlation_cluster` comes **before** `ticker_screener`
- `alert_batch_summary` comes **before** `alert_cooldown_config`

Always use `grep_search` to verify the surrounding barrel entries before inserting.

### Dart const vs final — Quick Reference

| Situation | Use |
|-----------|-----|
| Entity with no `DateTime` fields | `const` constructor + `const` in tests |
| Entity with any `DateTime` field | `final` in tests — `DateTime(...)` is never const |
| `final x = const Foo()` pattern | Rewrite as `const x = Foo()` (prefer_const_declarations) |
| List arg to @immutable class | Use `const [...]` prefix (prefer_const_literals) |

---

## Accumulated Learnings (S501–S550)

These pitfalls were encountered and fixed during the v2.17.0–v2.20.0 domain expansion sprints.
Each has a corresponding closed GitHub issue with the fix commit hash.

### Dollar Sign in Test Names (GH #21)

A `$` character inside a `test()` or `group()` string literal is interpreted as Dart string
interpolation syntax, causing a compile error even when there is no following variable name.

**Fix**: use a raw string literal (prefix `r'...'`) for any test name that contains `$`.

```dart
// WRONG — Dart tries to interpolate $1M, compile error
test('isLargeNotional for >= $1M', () { ... });

// CORRECT — raw string, $ is literal
test(r'isLargeNotional for >= $1M', () { ... });
```

**Commit**: 65aa724 — detected in S504 `DarkPoolIndicator` test, fixed before push.

---

### IEEE 754 Floating-Point Boundary in Tests (GH #22)

Binary floating-point cannot represent some decimal fractions exactly. When a test constructs
data whose subtraction or multiplication result lands exactly _on_ a comparison threshold,
IEEE 754 rounding causes the computed value to be slightly above or below the boundary,
making the assertion fail silently.

**Classic example** (`YieldCurveSnapshot.isFlat`, S533):

```dart
// Implementation:
bool get isFlat => twosToTensSpreadBps.abs() <= 20;

// WRONG test — (4.7 - 4.5) * 100 == 20.000000000000018 in IEEE 754
const snap = YieldCurveSnapshot(rate2y: 4.5, rate10y: 4.7, ...);
expect(snap.isFlat, isTrue); // FAILS: 20.000000000000018 > 20

// CORRECT — use a value clearly inside the threshold
const snap = YieldCurveSnapshot(rate2y: 4.5, rate10y: 4.6, ...); // spread = 10 bps
expect(snap.isFlat, isTrue); // PASSES: 10 <= 20 ✓
```

**Rule**: Never use test data whose arithmetic result sits exactly on a floating-point boundary.
Choose a value clearly inside or outside the threshold (e.g., 10 bps instead of 20 bps).

**Commit**: 8ab88dc — detected in S533 test, fixed by changing `rate10y` from 4.7 → 4.6.

---

### Barrel Deep-Prefix Misplacement (GH #23)

When multiple exports share a long common prefix (e.g., `market_`), it is easy to mis-order
entries by stopping comparison at the prefix rather than continuing character-by-character.

**Example**: `market_microstructure_snapshot` was placed after `market_breadth_alert`
(wrong) instead of after `market_impact_estimate` (correct):

```
// WRONG
export 'market_breadth_alert.dart';
export 'market_microstructure_snapshot.dart'; // 'mi' > 'br'... wait, 'm' > 'b' ✓
                                               // but 'market_i' (impact) < 'market_m' (micro)!
export 'market_impact_estimate.dart';          // 'i' < 'm' — this must come FIRST

// CORRECT order
export 'market_breadth_alert.dart';   // market_b
export 'market_depth_snapshot.dart';  // market_d
export 'market_impact_estimate.dart'; // market_i  ← micro goes AFTER this
export 'market_microstructure_snapshot.dart'; // market_m
```

**Rule**: After the shared prefix, compare character-by-character. For `market_*`:
`market_b` < `market_d` < `market_h` < `market_i` < `market_m` < `market_r` < `market_s`.

**Commit**: Fixed in 65aa724, lesson documented in a3849d0.

---

### New Naming Conflicts Found S501–S550 (GH #24)

Two additional class name collisions were identified during S451–S500 expansion work:

| Name to avoid | Existing definition | Renamed to |
|---------------|-----------|-----------|
| `MarketRegimeType` | `market_regime_signal.dart` | `RegimeClassificationType` |
| `ProviderHealthStatus` | `provider_sync_state.dart` | `DataProviderHealthStatus` |

**Rule**: Always run `grep_search` over `lib/src/domain/` for the proposed name before creating
any new class or enum. See `domain.instructions.md` for the full conflict table.

**Documented in**: a3849d0 + domain.instructions.md.

---

### New Barrel Ordering Rules (S501–S550)

These were tricky cases discovered during the S501–S550 sprint batch:

| File | Position | Key comparison |
|------|----------|---------------|
| `ab_test_assignment` | Before `accessibility_checker` | `ab` < `ac` (b < c) |
| `app_update_manifest` | After `app_runtime_context` | `app_r` < `app_u` (r < u) |
| `carry_trade_signal` | After `carbon_exposure_estimate` | `carb` < `carr` (b < r at 4th char) |
| `crash_report_summary` | Before `credit_spread_snapshot` | `cras` < `cred` (a < e at 4th char) |
| `enterprise_value_estimate` | Before `entities` | `ent_e` < `enti` (underscore sorts before letters) |
| `remote_config_snapshot` | After `relative_volume_calculator` | `rel` < `rem` (l < m), before `report_*` |
| `size_factor_signal` | Before `slippage_estimate` | `si_` < `sl` (underscore at pos 3 vs letter) |
| `user_cohort_definition` | After `user_backup_profile` | `user_b` < `user_c` < `user_d` |
