import 'package:cross_tide/src/domain/cci_calculator.dart';
import 'package:flutter_test/flutter_test.dart';

import '../helpers/candle_factory.dart';

DailyCandle _ohlc(
  int day, {
  required double high,
  required double low,
  required double close,
}) => makeOhlc(day, open: close, high: high, low: low, close: close);

List<DailyCandle> _flat(int count, {double price = 100}) => List.generate(
  count,
  (i) => _ohlc(i, high: price + 1, low: price - 1, close: price),
);

List<DailyCandle> _trending(int count, {double base = 100, double step = 1}) =>
    List.generate(count, (i) {
      final double price = base + i * step;
      return _ohlc(i, high: price + 1, low: price - 1, close: price);
    });

void main() {
  const calc = CciCalculator();

  group('CciCalculator', () {
    test('const constructor', () {
      const CciCalculator Function() create = CciCalculator.new;
      expect(create().computeSeries([]), isEmpty);
    });
  });

  group('CciCalculator.computeSeries', () {
    test('all null when insufficient data', () {
      final series = calc.computeSeries(_flat(15));
      expect(series.length, 15);
      for (final (DateTime, double?) entry in series) {
        expect(entry.$2, isNull);
      }
    });

    test('first period-1 entries are null', () {
      final candles = _flat(25);
      final series = calc.computeSeries(candles);
      for (int i = 0; i < 19; i++) {
        expect(series[i].$2, isNull);
      }
      expect(series[19].$2, isNotNull);
    });

    test('flat market produces CCI near zero', () {
      final candles = _flat(30);
      final series = calc.computeSeries(candles);
      for (int i = 19; i < series.length; i++) {
        expect(series[i].$2!, closeTo(0, 1));
      }
    });

    test('uptrend produces positive CCI', () {
      // Build a flat prefix followed by a surge
      final candles = [
        ..._flat(19),
        ..._trending(11, base: 110, step: 2).map(
          (DailyCandle c) => DailyCandle(
            date: c.date.add(const Duration(days: 19)),
            open: c.open,
            high: c.high,
            low: c.low,
            close: c.close,
            volume: c.volume,
          ),
        ),
      ];
      final series = calc.computeSeries(candles);
      final double lastCci = series.last.$2!;
      expect(lastCci, greaterThan(0));
    });

    test('custom period works', () {
      final candles = _trending(15);
      final series = calc.computeSeries(candles, period: 10);
      expect(series[8].$2, isNull);
      expect(series[9].$2, isNotNull);
    });

    test('zero mean deviation returns 0', () {
      // All identical candles → TP is constant → mean deviation = 0
      final candles = List.generate(
        25,
        (i) => _ohlc(i, high: 100, low: 100, close: 100),
      );
      final series = calc.computeSeries(candles);
      for (int i = 19; i < series.length; i++) {
        expect(series[i].$2, 0);
      }
    });
  });

  group('CciCalculator.compute', () {
    test('returns null when insufficient data', () {
      expect(calc.compute(_flat(5)), isNull);
    });

    test('returns last CCI value', () {
      final candles = _trending(30);
      final result = calc.compute(candles);
      expect(result, isNotNull);
    });
  });
}
