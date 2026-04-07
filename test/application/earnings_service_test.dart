import 'package:cross_tide/src/application/earnings_service.dart';
import 'package:cross_tide/src/domain/domain.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  const service = EarningsService();
  final now = DateTime(2025, 4, 7);

  final events = [
    EarningsEvent(
      ticker: 'AAPL',
      reportDate: DateTime(2025, 4, 10),
      estimatedEps: 1.50,
      timing: EarningsTiming.afterClose,
    ),
    EarningsEvent(
      ticker: 'AAPL',
      reportDate: DateTime(2025, 7, 20),
      estimatedEps: 1.60,
      timing: EarningsTiming.beforeOpen,
    ),
  ];

  test('checkProximity returns nearest future event', () {
    final prox = service.checkProximity(
      ticker: 'AAPL',
      events: events,
      asOf: now,
    );
    expect(prox, isNotNull);
    expect(prox!.daysUntilEarnings, 3);
    expect(prox.isWithinAlertWindow, isTrue);
  });

  test('scanWatchlist returns tickers within window', () {
    final alerts = service.scanWatchlist(
      tickerEvents: {'AAPL': events},
      asOf: now,
      alertWindowDays: 7,
    );
    expect(alerts.length, 1);
    expect(alerts.first.ticker, 'AAPL');
  });

  test('scanWatchlist excludes tickers outside window', () {
    final alerts = service.scanWatchlist(
      tickerEvents: {'AAPL': events},
      asOf: DateTime(2025, 1, 1),
      alertWindowDays: 7,
    );
    expect(alerts, isEmpty);
  });
}
