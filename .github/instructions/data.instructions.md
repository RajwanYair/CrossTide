---
description: "Use when editing Drift database tables, data providers, repository, or market data interfaces. Covers SQLite schema, API integration, and caching."
applyTo: "lib/src/data/**"
---
# Data Layer Rules

## Schema & codegen
- Drift tables are defined in `database.dart`. After any schema change, regenerate: `dart run build_runner build --delete-conflicting-outputs`.
- The generated `DailyCandle` in `database.g.dart` conflicts with domain `DailyCandle` — always use `import as domain` prefix when both are in scope.

## Providers
- `IMarketDataProvider` is the abstract interface — all implementations must implement it.
- Primary provider: `YahooFinanceProvider`. Secondary: `MockMarketDataProvider` (test/offline only).
- Wrap providers with `FallbackMarketDataProvider` for chain-of-providers resilience; wrap with `ThrottledMarketDataProvider` for rate limiting.
- Repository handles cache TTL — do not fetch if data is fresh.
- Never log raw exception types with string coercion (`e.runtimeType.toString()` is fine for debug; avoid `e.toString()` in production log messages if it leaks user data).

## HTTP / Proxy
- Use `Dio` with `IOHttpClientAdapter.createHttpClient` (not the deprecated `onHttpClientCreate` / `dynamic` cast) for custom proxy / certificate configuration on Windows.
- Import `package:dio/io.dart` to access `IOHttpClientAdapter`.
- Never hardcode API keys. Use `FlutterSecureStorage`.

## Code quality — zero tolerance
- `flutter analyze --fatal-infos` must report **zero issues** in data files.
- **No `// ignore:` or `// ignore_for_file:` pragmas.** Fix the root cause.
- **No `TODO` / `FIXME` / `HACK` comments.** Open a GitHub Issue instead.
- Use explicit loop variable types — `for (final IMarketDataProvider p in list)` not `for (final p in list)`.
