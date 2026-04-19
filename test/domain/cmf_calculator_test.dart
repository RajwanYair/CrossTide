import 'package:cross_tide/src/domain/cmf_calculator.dart';
import 'package:flutter_test/flutter_test.dart';

import '../helpers/candle_factory.dart';

DailyCandle _ohlc(
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

/// Close at high end → CMF should be positive.
List<DailyCandle> _bullish(int count) =>
    List.generate(count, (i) => _ohlc(i, high: 110, low: 90, close: 108));

/// Close at low end → CMF should be negative.
List<DailyCandle> _bearish(int count) =>
    List.generate(count, (i) => _ohlc(i, high: 110, low: 90, close: 92));

/// Close at midpoint → CMF near zero.
List<DailyCandle> _neutral(int count) =>
    List.generate(count, (i) => _ohlc(i, high: 110, low: 90, close: 100));

void main() {
  const calc = CmfCalculator();

  group('CmfCalculator', () {
    test('const constructor', () {
      const CmfCalculator Function() create = CmfCalculator.new;
      expect(create().computeSeries([]), isEmpty);
    });
  });

  group('CmfCalculator.computeSeries', () {
    test('all null when insufficient data', () {
      final series = calc.computeSeries(_neutral(15));
      expect(series.length, 15);
      for (final (DateTime, double?) entry in series) {
        expect(entry.$2, isNull);
      }
    });

    test('first period-1 entries are null', () {
      final candles = _neutral(25);
      final series = calc.computeSeries(candles);
      for (int i = 0; i < 19; i++) {
        expect(series[i].$2, isNull);
      }
      expect(series[19].$2, isNotNull);
    });

    test('bullish candles produce positive CMF', () {
      final candles = _bullish(25);
      final series = calc.computeSeries(candles);
      for (final (DateTime, double?) entry in series) {
        if (entry.$2 != null) {
          expect(entry.$2!, greaterThan(0));
        }
      }
    });

    test('bearish candles produce negative CMF', () {
      final candles = _bearish(25);
      final series = calc.computeSeries(candles);
      for (final (DateTime, double?) entry in series) {
        if (entry.$2 != null) {
          expect(entry.$2!, lessThan(0));
        }
      }
    });

    test('midpoint close produces CMF near zero', () {
      final candles = _neutral(25);
      final series = calc.computeSeries(candles);
      for (final (DateTime, double?) entry in series) {
        if (entry.$2 != null) {
          expect(entry.$2!, closeTo(0, 0.01));
        }
      }
    });

    test('CMF values are between -1 and 1', () {
      final candles = _bullish(30);
      final series = calc.computeSeries(candles);
      for (final (DateTime, double?) entry in series) {
        if (entry.$2 != null) {
          expect(entry.$2, inInclusiveRange(-1, 1));
        }
      }
    });

    test('zero-range candle returns 0 money flow multiplier', () {
      final candles = List.generate(
        25,
        (i) => _ohlc(i, high: 100, low: 100, close: 100),
      );
      final series = calc.computeSeries(candles);
      for (final (DateTime, double?) entry in series) {
        if (entry.$2 != null) {
          expect(entry.$2, closeTo(0, 1e-10));
        }
      }
    });

    test('custom period works', () {
      final candles = _bullish(15);
      final series = calc.computeSeries(candles, period: 10);
      expect(series[8].$2, isNull);
      expect(series[9].$2, isNotNull);
    });
  });

  group('CmfCalculator.compute', () {
    test('returns null when insufficient data', () {
      expect(calc.compute(_neutral(5)), isNull);
    });

    test('returns last CMF value', () {
      final candles = _bullish(25);
      final result = calc.compute(candles);
      expect(result, isNotNull);
      expect(result!, greaterThan(0));
    });
  });
}
