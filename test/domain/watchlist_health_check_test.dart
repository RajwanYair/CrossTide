import 'package:cross_tide/src/domain/watchlist_health_check.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('WatchlistHealthCheck', () {
    test('equality', () {
      final a = WatchlistHealthCheck(
        watchlistId: 'w1',
        status: WatchlistHealthStatus.healthy,
        totalTickers: 15,
        staleTickerCount: 0,
        invalidTickerCount: 0,
        uncoveredByAlerts: 2,
        checkedAt: DateTime(2025, 7, 1),
      );
      final b = WatchlistHealthCheck(
        watchlistId: 'w1',
        status: WatchlistHealthStatus.healthy,
        totalTickers: 15,
        staleTickerCount: 0,
        invalidTickerCount: 0,
        uncoveredByAlerts: 2,
        checkedAt: DateTime(2025, 7, 1),
      );
      expect(a, b);
    });

    test('copyWith changes totalTickers', () {
      final base = WatchlistHealthCheck(
        watchlistId: 'w1',
        status: WatchlistHealthStatus.healthy,
        totalTickers: 15,
        staleTickerCount: 0,
        invalidTickerCount: 0,
        uncoveredByAlerts: 2,
        checkedAt: DateTime(2025, 7, 1),
      );
      final updated = base.copyWith(totalTickers: 16);
      expect(updated.totalTickers, 16);
    });

    test('props length is 8', () {
      final obj = WatchlistHealthCheck(
        watchlistId: 'w1',
        status: WatchlistHealthStatus.healthy,
        totalTickers: 15,
        staleTickerCount: 0,
        invalidTickerCount: 0,
        uncoveredByAlerts: 2,
        checkedAt: DateTime(2025, 7, 1),
      );
      expect(obj.props.length, 8);
    });
  });
}
