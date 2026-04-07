/// Earnings Service — application-layer orchestration.
///
/// Wraps [EarningsCalendarCalculator] to determine upcoming-earnings
/// proximity for each ticker and identify those within the alert window.
library;

import '../domain/domain.dart';

/// Orchestrates earnings proximity detection across a watchlist.
class EarningsService {
  const EarningsService({
    EarningsCalendarCalculator calculator = const EarningsCalendarCalculator(),
  }) : _calculator = calculator;

  final EarningsCalendarCalculator _calculator;

  /// Check proximity for a single ticker.
  EarningsProximity? checkProximity({
    required String ticker,
    required List<EarningsEvent> events,
    required DateTime asOf,
  }) {
    return _calculator.nextEarnings(ticker: ticker, events: events, asOf: asOf);
  }

  /// Scan all tickers and return those within the alert window.
  List<EarningsAlert> scanWatchlist({
    required Map<String, List<EarningsEvent>> tickerEvents,
    required DateTime asOf,
    int alertWindowDays = 7,
  }) {
    final List<EarningsAlert> alerts = [];
    for (final MapEntry<String, List<EarningsEvent>> entry
        in tickerEvents.entries) {
      final EarningsProximity? prox = _calculator.nextEarnings(
        ticker: entry.key,
        events: entry.value,
        asOf: asOf,
      );
      if (prox != null && prox.daysUntilEarnings <= alertWindowDays) {
        alerts.add(EarningsAlert(ticker: entry.key, proximity: prox));
      }
    }
    return alerts;
  }
}

/// A ticker that has an upcoming earnings event within the alert window.
class EarningsAlert {
  const EarningsAlert({required this.ticker, required this.proximity});

  final String ticker;
  final EarningsProximity proximity;
}
