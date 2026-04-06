---
description: "Add a new stock ticker data provider (e.g., Yahoo Finance, Polygon.io)"
agent: "data-integration"
argument-hint: "Provider name and API documentation URL"
---
Add a new market data provider to the project:

1. Implement `IMarketDataProvider` from `lib/src/data/providers/market_data_provider.dart`
2. Use Dio for HTTP, handle rate limits and errors
3. Map API response to domain `DailyCandle` entities
4. Wire into the provider factory in `lib/src/presentation/providers.dart`
5. Add to settings dropdown in `lib/src/presentation/screens/settings_screen.dart`
6. Write unit tests with mock HTTP responses
7. Document rate limits and API key requirements in class docs
