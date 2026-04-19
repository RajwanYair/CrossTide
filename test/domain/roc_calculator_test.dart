import 'package:cross_tide/src/domain/roc_calculator.dart';
import 'package:flutter_test/flutter_test.dart';

import '../helpers/candle_factory.dart';

DailyCandle _candle(int day, {required double close}) =>
    makeOhlc(day, close: close);

List<DailyCandle> _flat(int count, {double price = 100}) =>
    makeFlat(count, price: price);

List<DailyCandle> _trending(int count, {double base = 100, double step = 1}) =>
    makeTrending(count, base: base, step: step);

void main() {
  const calc = RocCalculator();

  group('RocCalculator', () {
    test('const constructor', () {
      const RocCalculator Function() create = RocCalculator.new;
      expect(create().computeSeries([]), isEmpty);
    });
  });

  group('RocCalculator.computeSeries', () {
    test('all null when candles <= period', () {
      final series = calc.computeSeries(_flat(12));
      expect(series.length, 12);
      for (final (DateTime, double?) entry in series) {
        expect(entry.$2, isNull);
      }
    });

    test('first period entries are null', () {
      final series = calc.computeSeries(_flat(20));
      for (int i = 0; i < 12; i++) {
        expect(series[i].$2, isNull);
      }
      expect(series[12].$2, isNotNull);
    });

    test('flat prices produce zero ROC', () {
      final series = calc.computeSeries(_flat(20));
      for (int i = 12; i < 20; i++) {
        expect(series[i].$2, closeTo(0, 1e-10));
      }
    });

    test('known percentage change', () {
      // Price at day 0 = 100, day 12 = 112 → ROC = 12%
      final candles = _trending(15, base: 100, step: 1);
      final series = calc.computeSeries(candles);
      expect(series[12].$2, closeTo(12.0, 0.01));
    });

    test('negative ROC for declining prices', () {
      final candles = _trending(20, base: 200, step: -5);
      final series = calc.computeSeries(candles);
      for (int i = 12; i < series.length; i++) {
        expect(series[i].$2!, lessThan(0));
      }
    });

    test('custom period works', () {
      final candles = _trending(10, base: 100, step: 2);
      final series = calc.computeSeries(candles, period: 5);
      expect(series[4].$2, isNull);
      expect(series[5].$2, isNotNull);
      // day 5 close = 110, day 0 close = 100 → ROC = 10%
      expect(series[5].$2, closeTo(10.0, 0.01));
    });

    test('zero prev close produces 0 instead of NaN', () {
      final candles = [
        _candle(0, close: 0),
        ...List.generate(12, (i) => _candle(i + 1, close: 100)),
      ];
      final series = calc.computeSeries(candles);
      // ROC at index 12 references close at index 0 which is 0
      expect(series[12].$2, 0);
      expect(series[12].$2!.isNaN, isFalse);
    });
  });

  group('RocCalculator.compute', () {
    test('returns null when insufficient data', () {
      expect(calc.compute(_flat(5)), isNull);
    });

    test('returns last ROC value', () {
      final candles = _trending(20);
      final result = calc.compute(candles);
      expect(result, isNotNull);
    });
  });
}
