import 'package:cross_tide/src/domain/donchian_calculator.dart';
import 'package:flutter_test/flutter_test.dart';

import '../helpers/candle_factory.dart';

DailyCandle _ohlc(
  int day, {
  required double high,
  required double low,
  required double close,
}) => makeOhlc(day, open: close, high: high, low: low, close: close);

List<DailyCandle> _uniform(int count, {double high = 110, double low = 90}) =>
    List.generate(
      count,
      (i) => _ohlc(i, high: high, low: low, close: (high + low) / 2),
    );

List<DailyCandle> _trending(int count, {double base = 100, double step = 1}) =>
    List.generate(count, (i) {
      final double price = base + i * step;
      return _ohlc(i, high: price + 2, low: price - 2, close: price);
    });

void main() {
  const calc = DonchianCalculator();

  group('DonchianCalculator', () {
    test('const constructor', () {
      const DonchianCalculator Function() create = DonchianCalculator.new;
      expect(create().computeSeries([]), isEmpty);
    });
  });

  group('DonchianCalculator.computeSeries', () {
    test('returns empty when insufficient data', () {
      expect(calc.computeSeries(_uniform(19)), isEmpty);
    });

    test('first result at index period-1', () {
      final candles = _uniform(25);
      final series = calc.computeSeries(candles);
      expect(series.first.date, candles[19].date);
    });

    test('uniform candles produce constant bands', () {
      final candles = _uniform(25, high: 110, low: 90);
      final series = calc.computeSeries(candles);
      for (final DonchianResult r in series) {
        expect(r.upper, 110);
        expect(r.lower, 90);
        expect(r.middle, 100);
      }
    });

    test('trending data has expanding upper', () {
      final candles = _trending(30, step: 2);
      final series = calc.computeSeries(candles);
      // Upper should increase over time
      expect(series.last.upper, greaterThan(series.first.upper));
    });

    test('equatable works', () {
      final DateTime d = DateTime(2024);
      final a = DonchianResult(date: d, upper: 110, middle: 100, lower: 90);
      final b = DonchianResult(date: d, upper: 110, middle: 100, lower: 90);
      expect(a, equals(b));
      final c = DonchianResult(date: d, upper: 111, middle: 100, lower: 90);
      expect(a, isNot(equals(c)));
    });

    test('custom period works', () {
      final candles = _trending(15);
      final series = calc.computeSeries(candles, period: 5);
      expect(series.first.date, candles[4].date);
    });
  });

  group('DonchianCalculator.compute', () {
    test('returns null when insufficient data', () {
      expect(calc.compute(_uniform(5)), isNull);
    });

    test('returns last Donchian value', () {
      final candles = _uniform(25);
      final result = calc.compute(candles);
      expect(result, isNotNull);
      expect(result!.upper, 110);
      expect(result.lower, 90);
    });
  });
}
