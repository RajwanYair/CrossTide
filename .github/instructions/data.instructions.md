---
description: "Use when editing Drift database tables, data providers, repository, or market data interfaces. Covers SQLite schema, API integration, and caching."
applyTo: "lib/src/data/**"
---
# Data Layer Rules

- Drift tables are defined in `database.dart`. After changes, regenerate: `dart run build_runner build --delete-conflicting-outputs`
- The generated `DailyCandle` in `database.g.dart` conflicts with domain `DailyCandle` — always use `import as domain` prefix when both are in scope.
- `IMarketDataProvider` is abstract — implementations: `AlphaVantageProvider` (real), `MockMarketDataProvider` (test/offline).
- AlphaVantage free tier: 25 requests/day, 5/minute. Stagger 200ms between tickers.
- Repository handles cache TTL — don't fetch if data is fresh.
- Never hardcode API keys. Use `FlutterSecureStorage`.
