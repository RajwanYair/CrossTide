import 'package:cross_tide/src/domain/ticker_watchlist_stats.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('TickerWatchlistStats', () {
    test('equality', () {
      const a = TickerWatchlistStats(
        ticker: 'AAPL',
        watchlistCount: 450,
        addedCount: 30,
        removedCount: 10,
        window: WatchlistStatsWindow.week,
      );
      const b = TickerWatchlistStats(
        ticker: 'AAPL',
        watchlistCount: 450,
        addedCount: 30,
        removedCount: 10,
        window: WatchlistStatsWindow.week,
      );
      expect(a, b);
    });

    test('copyWith changes watchlistCount', () {
      const base = TickerWatchlistStats(
        ticker: 'AAPL',
        watchlistCount: 450,
        addedCount: 30,
        removedCount: 10,
        window: WatchlistStatsWindow.week,
      );
      final updated = base.copyWith(watchlistCount: 500);
      expect(updated.watchlistCount, 500);
    });

    test('props length is 5', () {
      const obj = TickerWatchlistStats(
        ticker: 'AAPL',
        watchlistCount: 450,
        addedCount: 30,
        removedCount: 10,
        window: WatchlistStatsWindow.week,
      );
      expect(obj.props.length, 5);
    });
  });
}
