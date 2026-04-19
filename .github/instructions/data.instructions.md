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
- Existing providers include Yahoo Finance, Nasdaq, Tiingo, MarketWatch, Coinpaprika, and Stooq-adjacent integrations in the repo.
- `MockMarketDataProvider` is test/offline only.
- Wrap providers with `FallbackMarketDataProvider` for resilience and `ThrottledMarketDataProvider` for rate limiting.
- Repository handles cache TTL — do not fetch if data is fresh.
- Delta fetch and cache merge logic should stay in repository/data orchestration, not UI or domain code.
- Never log raw exception types with string coercion (`e.runtimeType.toString()` is fine for debug; avoid `e.toString()` in production log messages if it leaks user data).

## HTTP / Proxy
- Use `Dio` with `IOHttpClientAdapter.createHttpClient` (not the deprecated `onHttpClientCreate` / `dynamic` cast) for custom proxy / certificate configuration on Windows.
- Import `package:dio/io.dart` to access `IOHttpClientAdapter`.
- Never hardcode API keys. Use `FlutterSecureStorage`.
- Document provider rate limits and auth requirements in class docs when adding a new integration.

## Code quality — zero tolerance
- `flutter analyze --fatal-infos` must report **zero issues** in data files.
- **No `// ignore:` or `// ignore_for_file:` pragmas.** Fix the root cause.
- **No `TODO` / `FIXME` / `HACK` comments.** Open a GitHub Issue instead.
- Use explicit loop variable types — `for (final IMarketDataProvider p in list)` not `for (final p in list)`.
- Provider parsing tests must cover malformed payloads, empty responses, and provider-specific failure paths.
