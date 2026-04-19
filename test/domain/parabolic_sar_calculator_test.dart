import 'package:cross_tide/src/domain/parabolic_sar_calculator.dart';
import 'package:flutter_test/flutter_test.dart';

import '../helpers/candle_factory.dart';

DailyCandle _ohlc(
  int day, {
  required double open,
  required double high,
  required double low,
  required double close,
}) => makeOhlc(day, open: open, high: high, low: low, close: close);

List<DailyCandle> _uptrend(int count, {double base = 100, double step = 2}) =>
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

List<DailyCandle> _downtrend(int count, {double base = 200, double step = 2}) =>
    List.generate(count, (i) {
      final double price = base - i * step;
      return _ohlc(
        i,
        open: price + 0.5,
        high: price + 1,
        low: price - 1,
        close: price,
      );
    });

void main() {
  const calc = ParabolicSarCalculator();

  group('ParabolicSarCalculator', () {
    test('const constructor with defaults', () {
      expect(calc.afStart, 0.02);
      expect(calc.afStep, 0.02);
      expect(calc.afMax, 0.20);
    });

    test('const constructor with custom params', () {
      const custom = ParabolicSarCalculator(
        afStart: 0.01,
        afStep: 0.01,
        afMax: 0.10,
      );
      expect(custom.afMax, 0.10);
    });
  });

  group('ParabolicSarCalculator.computeSeries', () {
    test('returns empty when fewer than 2 candles', () {
      expect(calc.computeSeries([]), isEmpty);
      expect(
        calc.computeSeries([
          _ohlc(0, open: 100, high: 101, low: 99, close: 100),
        ]),
        isEmpty,
      );
    });

    test('returns one result per candle', () {
      final candles = _uptrend(20);
      final series = calc.computeSeries(candles);
      expect(series.length, candles.length);
    });

    test('uptrend has SAR below price', () {
      final candles = _uptrend(20);
      final series = calc.computeSeries(candles);
      // After initial bars, SAR should be below low for uptrend
      for (int i = 2; i < series.length; i++) {
        if (series[i].isUpTrend) {
          expect(series[i].sar, lessThan(candles[i].close));
        }
      }
    });

    test('downtrend has SAR above price', () {
      final candles = _downtrend(20);
      final series = calc.computeSeries(candles);
      for (int i = 2; i < series.length; i++) {
        if (!series[i].isUpTrend) {
          expect(series[i].sar, greaterThan(candles[i].close));
        }
      }
    });

    test('reversal changes isUpTrend', () {
      // Start up, then reverse down
      final candles = [
        ..._uptrend(10, base: 100, step: 3),
        ..._downtrend(10, base: 80, step: 3).map(
          (DailyCandle c) => DailyCandle(
            date: c.date.add(const Duration(days: 10)),
            open: c.open,
            high: c.high,
            low: c.low,
            close: c.close,
            volume: c.volume,
          ),
        ),
      ];
      final series = calc.computeSeries(candles);
      final bool firstHalf = series[5].isUpTrend;
      final bool secondHalf = series[15].isUpTrend;
      // They should differ at some point (reversal happened)
      expect(firstHalf, isNot(equals(secondHalf)));
    });

    test('dates align with candles', () {
      final candles = _uptrend(10);
      final series = calc.computeSeries(candles);
      for (int i = 0; i < series.length; i++) {
        expect(series[i].date, candles[i].date);
      }
    });
  });

  group('ParabolicSarCalculator.compute', () {
    test('returns null when insufficient data', () {
      expect(calc.compute([]), isNull);
    });

    test('returns last SAR value', () {
      final candles = _uptrend(20);
      final result = calc.compute(candles);
      expect(result, isNotNull);
      final series = calc.computeSeries(candles);
      expect(result!.sar, series.last.sar);
    });
  });

  group('ParabolicSarResult', () {
    test('equatable by value', () {
      final DateTime d = DateTime(2024);
      final a = ParabolicSarResult(date: d, sar: 95, isUpTrend: true);
      final b = ParabolicSarResult(date: d, sar: 95, isUpTrend: true);
      expect(a, equals(b));
    });
  });
}
