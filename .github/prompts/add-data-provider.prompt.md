---
description: "Add a new stock ticker data provider (e.g., Yahoo Finance, Polygon.io)"
agent: "data-integration"
argument-hint: "Provider name and API documentation URL"
---
Add a new market data provider to the project:

1. Implement `IMarketDataProvider` from `lib/src/data/providers/market_data_provider.dart`
2. Use Dio for HTTP, handle rate limits and errors
   - Proxy/TLS config: `(dio.httpClientAdapter as IOHttpClientAdapter).createHttpClient = () { ... }` — import `package:dio/io.dart`
   - Never use deprecated `onHttpClientCreate` or cast adapter to `dynamic`
3. Map API response to domain `DailyCandle` entities
4. Wire into the provider factory in `lib/src/presentation/providers.dart`
   - Explicit type on loop: `for (final IMarketDataProvider p in fallback.providers)`
5. Add to settings dropdown in `lib/src/presentation/screens/settings_screen.dart`
6. Write unit tests with mock HTTP responses — cover rate-limit and error paths
7. Document rate limits and API key requirements in class docs
8. No API keys in source — store in `FlutterSecureStorage`
9. Verify:
   ```bash
   flutter analyze --fatal-infos        # zero issues
   dart format --set-exit-if-changed lib test   # exit 0
   flutter test --coverage --timeout 30s        # all pass, ≥90% coverage
   ```
