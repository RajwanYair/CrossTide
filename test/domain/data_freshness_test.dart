import 'package:cross_tide/src/domain/domain.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('DataFreshness', () {
    final now = DateTime(2024, 6, 15, 12, 0);

    test('fresh when updated < 1 hour ago', () {
      final df = DataFreshness(
        ticker: 'AAPL',
        lastUpdatedAt: now.subtract(const Duration(minutes: 30)),
        now: now,
      );
      expect(df.level, FreshnessLevel.fresh);
      expect(df.ageLabel, '30 min ago');
    });

    test('stale when updated 2 hours ago', () {
      final df = DataFreshness(
        ticker: 'AAPL',
        lastUpdatedAt: now.subtract(const Duration(hours: 2)),
        now: now,
      );
      expect(df.level, FreshnessLevel.stale);
      expect(df.ageLabel, '2 h ago');
    });

    test('expired when updated > 24 hours ago', () {
      final df = DataFreshness(
        ticker: 'AAPL',
        lastUpdatedAt: now.subtract(const Duration(hours: 25)),
        now: now,
      );
      expect(df.level, FreshnessLevel.expired);
      expect(df.ageLabel, '1 d ago');
    });

    test('just now when updated seconds ago', () {
      final df = DataFreshness(
        ticker: 'AAPL',
        lastUpdatedAt: now.subtract(const Duration(seconds: 10)),
        now: now,
      );
      expect(df.level, FreshnessLevel.fresh);
      expect(df.ageLabel, 'just now');
    });

    test('age returns correct duration', () {
      final df = DataFreshness(
        ticker: 'AAPL',
        lastUpdatedAt: now.subtract(const Duration(minutes: 45)),
        now: now,
      );
      expect(df.age, const Duration(minutes: 45));
    });

    test('custom thresholds', () {
      final df = DataFreshness(
        ticker: 'AAPL',
        lastUpdatedAt: now.subtract(const Duration(minutes: 10)),
        now: now,
        freshThreshold: const Duration(minutes: 5),
        staleThreshold: const Duration(minutes: 15),
      );
      expect(df.level, FreshnessLevel.stale);
    });

    test('boundary: exactly at fresh threshold is fresh', () {
      final df = DataFreshness(
        ticker: 'AAPL',
        lastUpdatedAt: now.subtract(const Duration(hours: 1)),
        now: now,
      );
      expect(df.level, FreshnessLevel.fresh);
    });

    test('FreshnessLevel labels', () {
      expect(FreshnessLevel.fresh.label, 'Fresh');
      expect(FreshnessLevel.stale.label, 'Stale');
      expect(FreshnessLevel.expired.label, 'Expired');
    });

    test('equality', () {
      final df1 = DataFreshness(ticker: 'AAPL', lastUpdatedAt: now, now: now);
      final df2 = DataFreshness(ticker: 'AAPL', lastUpdatedAt: now, now: now);
      expect(df1, equals(df2));
    });

    test('ticker is set', () {
      final df = DataFreshness(ticker: 'TSLA', lastUpdatedAt: now, now: now);
      expect(df.ticker, 'TSLA');
    });
  });
}
