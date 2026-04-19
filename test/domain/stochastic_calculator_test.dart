import 'package:cross_tide/src/domain/stochastic_calculator.dart';
import 'package:flutter_test/flutter_test.dart';

import '../helpers/candle_factory.dart';

DailyCandle _ohlc(
  int day, {
  required double open,
  required double high,
  required double low,
  required double close,
  int volume = 1000000,
}) => makeOhlc(
  day,
  open: open,
  high: high,
  low: low,
  close: close,
  volume: volume,
);

/// Trending candles: each day close = base + i * step.
List<DailyCandle> _trending(int count, {double base = 100, double step = 1}) =>
    List.generate(count, (i) {
      final double price = base + i * step;
      return _ohlc(
        i,
        open: price - 0.5,
        high: price + 1,
        low: price - 1,
        close: price,
      );
    });

/// Flat candles at a constant price.
List<DailyCandle> _flat(int count, {double price = 100}) => List.generate(
  count,
  (i) => _ohlc(i, open: price, high: price + 1, low: price - 1, close: price),
);

void main() {
  const calc = StochasticCalculator();

  group('StochasticCalculator', () {
    test('const constructor', () {
      const StochasticCalculator Function() create = StochasticCalculator.new;
      expect(create().computeSeries([]), isEmpty);
    });
  });

  group('StochasticCalculator.computeSeries', () {
    test('returns empty list when insufficient data', () {
      // Default: period=14, smoothK=3, smoothD=3 → needs 14+3+3-2 = 18
      expect(calc.computeSeries(_flat(17)), isEmpty);
    });

    test('returns results when exactly enough data', () {
      final candles = _flat(18);
      final series = calc.computeSeries(candles);
      expect(series, isNotEmpty);
    });

    test('percent K and D are between 0 and 100 for trending data', () {
      final candles = _trending(30);
      final series = calc.computeSeries(candles);
      for (final StochasticResult r in series) {
        expect(r.percentK, inInclusiveRange(0, 100));
        expect(r.percentD, inInclusiveRange(0, 100));
      }
    });

    test('strong uptrend produces high %K values', () {
      final candles = _trending(30, step: 2);
      final series = calc.computeSeries(candles);
      // Last value should be near the top
      expect(series.last.percentK, greaterThan(60));
    });

    test('strong downtrend produces low %K values', () {
      final candles = _trending(30, base: 200, step: -2);
      final series = calc.computeSeries(candles);
      expect(series.last.percentK, lessThan(40));
    });

    test('flat market produces values near 50', () {
      final candles = _flat(25);
      final series = calc.computeSeries(candles);
      for (final StochasticResult r in series) {
        expect(r.percentK, closeTo(50, 10));
        expect(r.percentD, closeTo(50, 10));
      }
    });

    test('custom periods work', () {
      final candles = _trending(40);
      final series = calc.computeSeries(
        candles,
        period: 10,
        smoothK: 5,
        smoothD: 5,
      );
      expect(series, isNotEmpty);
    });
  });

  group('StochasticCalculator.compute', () {
    test('returns null when insufficient data', () {
      expect(calc.compute(_flat(5)), isNull);
    });

    test('returns last series value', () {
      final candles = _trending(25);
      final result = calc.compute(candles);
      expect(result, isNotNull);
      final series = calc.computeSeries(candles);
      expect(result!.percentK, series.last.percentK);
      expect(result.percentD, series.last.percentD);
    });
  });

  group('StochasticResult', () {
    test('equatable by value', () {
      final DateTime d = DateTime(2024);
      final a = StochasticResult(date: d, percentK: 50, percentD: 40);
      final b = StochasticResult(date: d, percentK: 50, percentD: 40);
      expect(a, equals(b));
    });
  });
}
