import 'package:cross_tide/src/domain/mfi_calculator.dart';
import 'package:flutter_test/flutter_test.dart';

import '../helpers/candle_factory.dart';

DailyCandle _candle(
  int day, {
  required double high,
  required double low,
  required double close,
  int volume = 1000000,
}) => makeOhlc(
  day,
  open: close,
  high: high,
  low: low,
  close: close,
  volume: volume,
);

List<DailyCandle> _trending(int count, {double base = 100, double step = 1}) =>
    List.generate(count, (i) {
      final double price = base + i * step;
      return _candle(
        i,
        high: price + 1,
        low: price - 1,
        close: price,
        volume: 1000000 + i * 10000,
      );
    });

List<DailyCandle> _flat(int count, {double price = 100}) => List.generate(
  count,
  (i) => _candle(i, high: price + 1, low: price - 1, close: price),
);

void main() {
  const calc = MfiCalculator();

  group('MfiCalculator', () {
    test('const constructor', () {
      const MfiCalculator Function() create = MfiCalculator.new;
      expect(create().computeSeries([]), isEmpty);
    });
  });

  group('MfiCalculator.computeSeries', () {
    test('all null when candles <= period', () {
      final series = calc.computeSeries(_flat(14));
      expect(series.length, 14);
      for (final (DateTime, double?) entry in series) {
        expect(entry.$2, isNull);
      }
    });

    test('first period entries are null', () {
      final candles = _trending(20);
      final series = calc.computeSeries(candles);
      for (int i = 0; i < 14; i++) {
        expect(series[i].$2, isNull);
      }
      expect(series[14].$2, isNotNull);
    });

    test('values are between 0 and 100', () {
      final candles = _trending(30);
      final series = calc.computeSeries(candles);
      for (final (DateTime, double?) entry in series) {
        if (entry.$2 != null) {
          expect(entry.$2, inInclusiveRange(0, 100));
        }
      }
    });

    test('strong uptrend produces high MFI', () {
      final candles = _trending(25, step: 3);
      final series = calc.computeSeries(candles);
      final double last = series.last.$2!;
      expect(last, greaterThan(50));
    });

    test('flat prices yield MFI of 100 (no negative flow)', () {
      final candles = _flat(20);
      final series = calc.computeSeries(candles);
      // All TP equal → no negative flow → MFI = 100
      for (final (DateTime, double?) entry in series) {
        if (entry.$2 != null) {
          expect(entry.$2, 100);
        }
      }
    });

    test('custom period works', () {
      final candles = _trending(15);
      final series = calc.computeSeries(candles, period: 5);
      expect(series[4].$2, isNull);
      expect(series[5].$2, isNotNull);
    });
  });

  group('MfiCalculator.compute', () {
    test('returns null when insufficient data', () {
      expect(calc.compute(_flat(5)), isNull);
    });

    test('returns last MFI value', () {
      final candles = _trending(25);
      final result = calc.compute(candles);
      expect(result, isNotNull);
      expect(result, inInclusiveRange(0, 100));
    });
  });
}
