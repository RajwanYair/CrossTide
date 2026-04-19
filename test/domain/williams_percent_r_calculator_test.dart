import 'package:cross_tide/src/domain/williams_percent_r_calculator.dart';
import 'package:flutter_test/flutter_test.dart';

import '../helpers/candle_factory.dart';

DailyCandle _ohlc(
  int day, {
  required double open,
  required double high,
  required double low,
  required double close,
}) => makeOhlc(day, open: open, high: high, low: low, close: close);

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

List<DailyCandle> _flat(int count, {double price = 100}) => List.generate(
  count,
  (i) => _ohlc(i, open: price, high: price + 1, low: price - 1, close: price),
);

void main() {
  const calc = WilliamsPercentRCalculator();

  group('WilliamsPercentRCalculator', () {
    test('const constructor', () {
      const WilliamsPercentRCalculator Function() create =
          WilliamsPercentRCalculator.new;
      expect(create().computeSeries([]), isEmpty);
    });
  });

  group('WilliamsPercentRCalculator.computeSeries', () {
    test('all null when insufficient data', () {
      final series = calc.computeSeries(_flat(10));
      expect(series.length, 10);
      for (final (DateTime, double?) entry in series) {
        expect(entry.$2, isNull);
      }
    });

    test('first period-1 entries are null', () {
      final candles = _flat(20);
      final series = calc.computeSeries(candles);
      for (int i = 0; i < 13; i++) {
        expect(series[i].$2, isNull);
      }
      expect(series[13].$2, isNotNull);
    });

    test('values are between -100 and 0', () {
      final candles = _trending(30);
      final series = calc.computeSeries(candles);
      for (final (DateTime, double?) entry in series) {
        if (entry.$2 != null) {
          expect(entry.$2, inInclusiveRange(-100, 0));
        }
      }
    });

    test('uptrend produces values near 0 (overbought)', () {
      final candles = _trending(30, step: 2);
      final series = calc.computeSeries(candles);
      final double last = series.last.$2!;
      expect(last, greaterThan(-30));
    });

    test('downtrend produces values near -100 (oversold)', () {
      final candles = _trending(30, base: 200, step: -2);
      final series = calc.computeSeries(candles);
      final double last = series.last.$2!;
      expect(last, lessThan(-70));
    });

    test('flat market produces values near -50', () {
      final candles = _flat(20);
      final series = calc.computeSeries(candles);
      for (final (DateTime, double?) entry in series) {
        if (entry.$2 != null) {
          expect(entry.$2, closeTo(-50, 10));
        }
      }
    });

    test('custom period works', () {
      final candles = _trending(30);
      final series = calc.computeSeries(candles, period: 5);
      // First 4 entries null, rest populated
      expect(series[3].$2, isNull);
      expect(series[4].$2, isNotNull);
    });

    test('zero-range candle returns -50', () {
      final candles = List.generate(
        20,
        (i) => _ohlc(i, open: 100, high: 100, low: 100, close: 100),
      );
      final series = calc.computeSeries(candles);
      for (final (DateTime, double?) entry in series) {
        if (entry.$2 != null) {
          expect(entry.$2, -50);
        }
      }
    });
  });

  group('WilliamsPercentRCalculator.compute', () {
    test('returns null when insufficient data', () {
      expect(calc.compute(_flat(5)), isNull);
    });

    test('returns last non-null value', () {
      final candles = _trending(25);
      final result = calc.compute(candles);
      expect(result, isNotNull);
      expect(result, inInclusiveRange(-100, 0));
    });
  });
}
