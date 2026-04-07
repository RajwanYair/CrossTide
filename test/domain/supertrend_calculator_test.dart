import 'package:cross_tide/src/domain/entities.dart';
import 'package:cross_tide/src/domain/supertrend_calculator.dart';
import 'package:flutter_test/flutter_test.dart';

DailyCandle _ohlc(
  int day, {
  required double open,
  required double high,
  required double low,
  required double close,
}) => DailyCandle(
  date: DateTime(2024, 1, 1).add(Duration(days: day)),
  open: open,
  high: high,
  low: low,
  close: close,
  volume: 1000000,
);

List<DailyCandle> _uptrend(int count, {double base = 100, double step = 2}) =>
    List.generate(count, (i) {
      final double price = base + i * step;
      return _ohlc(
        i,
        open: price - 0.5,
        high: price + 2,
        low: price - 2,
        close: price,
      );
    });

List<DailyCandle> _downtrend(int count, {double base = 200, double step = 2}) =>
    List.generate(count, (i) {
      final double price = base - i * step;
      return _ohlc(
        i,
        open: price + 0.5,
        high: price + 2,
        low: price - 2,
        close: price,
      );
    });

void main() {
  const calc = SuperTrendCalculator();

  group('SuperTrendCalculator', () {
    test('const constructor with defaults', () {
      expect(calc.atrPeriod, 10);
      expect(calc.multiplier, 3.0);
    });

    test('custom constructor', () {
      const custom = SuperTrendCalculator(atrPeriod: 7, multiplier: 2.0);
      expect(custom.atrPeriod, 7);
    });
  });

  group('SuperTrendCalculator.computeSeries', () {
    test('returns empty when insufficient data', () {
      expect(calc.computeSeries(_uptrend(5)), isEmpty);
    });

    test('returns results with enough data', () {
      final candles = _uptrend(20);
      final series = calc.computeSeries(candles);
      expect(series, isNotEmpty);
    });

    test('uptrend has isUpTrend true', () {
      final candles = _uptrend(25, step: 3);
      final series = calc.computeSeries(candles);
      // Most entries in an uptrend should be bullish
      final int upCount = series
          .where((SuperTrendResult r) => r.isUpTrend)
          .length;
      expect(upCount, greaterThan(series.length ~/ 2));
    });

    test('downtrend has isUpTrend false', () {
      final candles = _downtrend(25, step: 3);
      final series = calc.computeSeries(candles);
      final int downCount = series
          .where((SuperTrendResult r) => !r.isUpTrend)
          .length;
      expect(downCount, greaterThan(series.length ~/ 2));
    });

    test('dates align with candles', () {
      final candles = _uptrend(20);
      final series = calc.computeSeries(candles);
      for (final SuperTrendResult r in series) {
        expect(candles.any((DailyCandle c) => c.date == r.date), isTrue);
      }
    });
  });

  group('SuperTrendCalculator.compute', () {
    test('returns null when insufficient data', () {
      expect(calc.compute(_uptrend(5)), isNull);
    });

    test('returns last SuperTrend value', () {
      final candles = _uptrend(25);
      final result = calc.compute(candles);
      expect(result, isNotNull);
    });
  });

  group('SuperTrendResult', () {
    test('equatable by value', () {
      final DateTime d = DateTime(2024);
      final a = SuperTrendResult(date: d, superTrend: 95, isUpTrend: true);
      final b = SuperTrendResult(date: d, superTrend: 95, isUpTrend: true);
      expect(a, equals(b));
    });
  });
}
