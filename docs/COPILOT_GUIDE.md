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
