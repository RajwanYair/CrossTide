import 'package:cross_tide/src/domain/adx_calculator.dart';
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
        high: price + 2,
        low: price - 2,
        close: price,
      );
    });

List<DailyCandle> _flat(int count, {double price = 100}) => List.generate(
  count,
  (i) => _ohlc(i, open: price, high: price + 1, low: price - 1, close: price),
);

void main() {
  const calc = AdxCalculator();

  group('AdxCalculator', () {
    test('const constructor', () {
      const AdxCalculator Function() create = AdxCalculator.new;
      expect(create().computeSeries([]), isEmpty);
    });
  });

  group('AdxCalculator.computeSeries', () {
    test('returns empty when fewer than 2*period candles', () {
      expect(calc.computeSeries(_flat(27)), isEmpty);
    });

    test('returns results at 2*period candles', () {
      final candles = _flat(28);
      final series = calc.computeSeries(candles);
      expect(series, isNotEmpty);
    });

    test('ADX values between 0 and 100', () {
      final candles = _uptrend(40);
      final series = calc.computeSeries(candles);
      for (final AdxResult r in series) {
        expect(r.adx, inInclusiveRange(0, 100));
        expect(r.plusDi, inInclusiveRange(0, 100));
        expect(r.minusDi, inInclusiveRange(0, 100));
      }
    });

    test('strong uptrend has positive DI > negative DI', () {
      final candles = _uptrend(40, step: 3);
      final series = calc.computeSeries(candles);
      final AdxResult last = series.last;
      expect(last.plusDi, greaterThan(last.minusDi));
    });

    test('custom period works', () {
      final candles = _uptrend(30);
      final series = calc.computeSeries(candles, period: 7);
      expect(series, isNotEmpty);
    });

    test('dates align correctly', () {
      final candles = _uptrend(40);
      final series = calc.computeSeries(candles);
      expect(series.first.date, candles[27].date);
    });
  });

  group('AdxCalculator.compute', () {
    test('returns null when insufficient data', () {
      expect(calc.compute(_flat(5)), isNull);
    });

    test('returns last ADX value', () {
      final candles = _uptrend(40);
      final result = calc.compute(candles);
      expect(result, isNotNull);
      expect(result!.adx, inInclusiveRange(0, 100));
    });
  });

  group('AdxResult', () {
    test('equatable by value', () {
      final DateTime d = DateTime(2024);
      final a = AdxResult(date: d, adx: 30, plusDi: 25, minusDi: 15);
      final b = AdxResult(date: d, adx: 30, plusDi: 25, minusDi: 15);
      expect(a, equals(b));
    });
  });
}
