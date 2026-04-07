import 'package:cross_tide/src/domain/domain.dart';
import 'package:flutter_test/flutter_test.dart';

/// Generate candles with a clear uptrend from 50 → ~170 over 250 days.
List<DailyCandle> _trendCandles() => List.generate(
  250,
  (i) => DailyCandle(
    date: DateTime(2023, 1, 1).add(Duration(days: i)),
    open: 50.0 + i * 0.5 - 0.5,
    high: 50.0 + i * 0.5 + 2,
    low: 50.0 + i * 0.5 - 2,
    close: 50.0 + i * 0.5,
    volume: 100000,
  ),
);

void main() {
  const scorer = TrendStrengthScorer();

  group('TrendStrengthScorer', () {
    test('const constructor', () {
      const TrendStrengthScorer Function() create = TrendStrengthScorer.new;
      expect(create(), isNotNull);
    });

    test('returns null for insufficient data', () {
      final candles = List.generate(
        10,
        (i) => DailyCandle(
          date: DateTime(2024, 1, i + 1),
          open: 100,
          high: 101,
          low: 99,
          close: 100,
          volume: 1000,
        ),
      );
      expect(scorer.evaluate(candles), isNull);
    });

    test('strong uptrend produces high score', () {
      final result = scorer.evaluate(_trendCandles());
      expect(result, isNotNull);
      expect(result!.score, greaterThan(20));
      expect(result.direction, 1);
    });

    test('strong downtrend produces bearish direction', () {
      // Downtrend from 200 → ~75 over 250 days
      final candles = List.generate(
        250,
        (i) => DailyCandle(
          date: DateTime(2023, 1, 1).add(Duration(days: i)),
          open: 200.0 - i * 0.5 + 0.5,
          high: 200.0 - i * 0.5 + 2,
          low: 200.0 - i * 0.5 - 2,
          close: 200.0 - i * 0.5,
          volume: 100000,
        ),
      );
      final result = scorer.evaluate(candles);
      expect(result, isNotNull);
      expect(result!.direction, -1);
    });

    test('score is between 0 and 100', () {
      final result = scorer.evaluate(_trendCandles());
      expect(result!.score, greaterThanOrEqualTo(0));
      expect(result.score, lessThanOrEqualTo(100));
    });
  });
}
