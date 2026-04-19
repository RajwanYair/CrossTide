import 'package:cross_tide/src/domain/keltner_calculator.dart';
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

List<DailyCandle> _uniform(int count, {double spread = 2, double base = 100}) =>
    List.generate(
      count,
      (i) => _ohlc(
        i,
        open: base,
        high: base + spread,
        low: base - spread,
        close: base,
      ),
    );

List<DailyCandle> _trending(int count, {double base = 100, double step = 1}) =>
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

void main() {
  const calc = KeltnerCalculator();

  group('KeltnerCalculator', () {
    test('const constructor with defaults', () {
      expect(calc.emaPeriod, 20);
      expect(calc.atrPeriod, 10);
      expect(calc.multiplier, 2.0);
    });

    test('const constructor with custom params', () {
      const custom = KeltnerCalculator(
        emaPeriod: 10,
        atrPeriod: 5,
        multiplier: 1.5,
      );
      expect(custom.emaPeriod, 10);
    });
  });

  group('KeltnerCalculator.computeSeries', () {
    test('returns empty when insufficient data', () {
      expect(calc.computeSeries(_uniform(5)), isEmpty);
    });

    test('returns results when enough data', () {
      final candles = _uniform(30);
      final series = calc.computeSeries(candles);
      expect(series, isNotEmpty);
    });

    test('upper > middle > lower', () {
      final candles = _trending(40);
      final series = calc.computeSeries(candles);
      for (final KeltnerResult r in series) {
        expect(r.upper, greaterThan(r.middle));
        expect(r.middle, greaterThan(r.lower));
      }
    });

    test('uniform data produces symmetric bands around EMA', () {
      final candles = _uniform(30, base: 100, spread: 2);
      final series = calc.computeSeries(candles);
      for (final KeltnerResult r in series) {
        // Upper - middle should equal middle - lower
        expect(r.upper - r.middle, closeTo(r.middle - r.lower, 1e-6));
      }
    });
  });

  group('KeltnerCalculator.compute', () {
    test('returns null when insufficient data', () {
      expect(calc.compute(_uniform(5)), isNull);
    });

    test('returns last Keltner value', () {
      final candles = _trending(40);
      final result = calc.compute(candles);
      expect(result, isNotNull);
      expect(result!.upper, greaterThan(result.middle));
    });
  });

  group('KeltnerResult', () {
    test('equatable by value', () {
      final DateTime d = DateTime(2024);
      final a = KeltnerResult(date: d, upper: 110, middle: 100, lower: 90);
      final b = KeltnerResult(date: d, upper: 110, middle: 100, lower: 90);
      expect(a, equals(b));
    });
  });
}
