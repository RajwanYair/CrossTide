---
description: "Add a new stock ticker data provider (e.g., Yahoo Finance, Polygon.io)"
agent: "data-integration"
argument-hint: "Provider name and API documentation URL"
---
Add a new market data provider to the project:

1. Implement `IMarketDataProvider` from `lib/src/data/providers/market_data_provider.dart`
2. Use Dio for HTTP, handle rate limits, timeouts, parsing, and provider-specific error mapping
   - Proxy/TLS config must use `package:dio/io.dart` and `IOHttpClientAdapter`
   - Never use deprecated `onHttpClientCreate` or cast adapters to `dynamic`
3. Map API response to domain `DailyCandle` entities
4. Wire into the provider factory and any fallback chain entry points in `lib/src/presentation/providers.dart`
   - Explicit type on loop: `for (final IMarketDataProvider p in fallback.providers)`
5. Add to settings UI only if the provider is meant to be user-selectable
6. Write unit tests with mocked HTTP responses and cover cache, throttling, malformed payloads, and failure paths
7. Document rate limits, auth requirements, and known limitations in class docs
8. No API keys in source — use `FlutterSecureStorage` or injected config
9. Verify:
   ```bash
   flutter analyze --fatal-infos        # zero issues
   dart format --set-exit-if-changed lib test   # exit 0
   flutter test --coverage --timeout 30s        # all pass, ≥90% coverage
   ```
