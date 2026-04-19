import 'package:cross_tide/src/domain/ichimoku_calculator.dart';
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
  (i) => _ohlc(i, high: price + 2, low: price - 2, close: price),
);

List<DailyCandle> _trending(int count, {double base = 100, double step = 1}) =>
    List.generate(count, (i) {
      final double price = base + i * step;
      return _ohlc(i, high: price + 2, low: price - 2, close: price);
    });

void main() {
  const calc = IchimokuCalculator();

  group('IchimokuCalculator', () {
    test('const constructor with defaults', () {
      expect(calc.tenkanPeriod, 9);
      expect(calc.kijunPeriod, 26);
      expect(calc.senkouBPeriod, 52);
      expect(calc.displacement, 26);
    });
  });

  group('IchimokuCalculator.computeSeries', () {
    test('returns empty when insufficient data', () {
      expect(calc.computeSeries(_flat(51)), isEmpty);
    });

    test('returns results with enough data', () {
      final candles = _flat(60);
      final series = calc.computeSeries(candles);
      expect(series.length, 60);
    });

    test('tenkan available after tenkanPeriod', () {
      final candles = _flat(60);
      final series = calc.computeSeries(candles);
      expect(series[7].tenkan, isNull);
      expect(series[8].tenkan, isNotNull);
    });

    test('kijun available after kijunPeriod', () {
      final candles = _flat(60);
      final series = calc.computeSeries(candles);
      expect(series[24].kijun, isNull);
      expect(series[25].kijun, isNotNull);
    });

    test('flat candles produce tenkan == kijun', () {
      final candles = _flat(60);
      final series = calc.computeSeries(candles);
      for (final IchimokuResult r in series) {
        if (r.tenkan != null && r.kijun != null) {
          expect(r.tenkan, closeTo(r.kijun!, 0.01));
        }
      }
    });

    test('chikou span is populated', () {
      final candles = _trending(80);
      final series = calc.computeSeries(candles);
      // Chikou at index 0 should be the close from bar 26
      expect(series[0].chikou, candles[26].close);
    });

    test('custom periods work', () {
      const custom = IchimokuCalculator(
        tenkanPeriod: 5,
        kijunPeriod: 10,
        senkouBPeriod: 20,
        displacement: 10,
      );
      final candles = _flat(30);
      final series = custom.computeSeries(candles);
      expect(series, isNotEmpty);
    });
  });

  group('IchimokuCalculator.compute', () {
    test('returns null when insufficient data', () {
      expect(calc.compute(_flat(10)), isNull);
    });

    test('returns last Ichimoku value', () {
      final candles = _flat(60);
      final result = calc.compute(candles);
      expect(result, isNotNull);
    });
  });

  group('IchimokuResult', () {
    test('equatable by value', () {
      final DateTime d = DateTime(2024);
      final a = IchimokuResult(date: d, tenkan: 100, kijun: 99);
      final b = IchimokuResult(date: d, tenkan: 100, kijun: 99);
      expect(a, equals(b));
    });
  });
}
