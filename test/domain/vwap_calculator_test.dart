import 'package:cross_tide/src/domain/vwap_calculator.dart';
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

void main() {
  const calc = VwapCalculator();

  group('VwapCalculator', () {
    test('can be constructed at runtime', () {
      const VwapCalculator Function() create = VwapCalculator.new;
      expect(create().computeSeries([]), isEmpty);
    });
  });

  group('VwapCalculator.computeSeries', () {
    test('returns empty list for empty input', () {
      expect(calc.computeSeries([]), isEmpty);
    });

    test('single candle: vwap equals typical price', () {
      final c = _candle(0, high: 110, low: 90, close: 100, volume: 500000);
      final series = calc.computeSeries([c]);
      expect(series, hasLength(1));
      // typical price = (110 + 90 + 100) / 3 = 100
      expect(series.first.vwap, closeTo(100.0, 0.001));
    });

    test('series length equals candles length', () {
      final candles = List.generate(
        20,
        (i) => _candle(i, high: 110, low: 90, close: 100),
      );
      expect(calc.computeSeries(candles).length, candles.length);
    });

    test('uniform candles: cumulative VWAP equals typical price', () {
      final candles = List.generate(
        30,
        (i) => _candle(i, high: 120, low: 80, close: 100, volume: 1000000),
      );
      final series = calc.computeSeries(candles);
      // Every bar has TP = (120+80+100)/3 = 100 and same volume,
      // so VWAP stays 100 throughout.
      for (final VwapResult r in series) {
        expect(r.vwap, closeTo(100.0, 0.001));
      }
    });

    test('higher-volume bar pulls VWAP toward its typical price', () {
      // Bar 0: TP=100, vol=1M; Bar 1: TP=200, vol=10M
      // VWAP after bar 1 = (100×1M + 200×10M) / 11M ≈ 190.9
      final candles = [
        _candle(0, high: 105, low: 95, close: 100, volume: 1000000),
        _candle(1, high: 210, low: 190, close: 200, volume: 10000000),
      ];
      final series = calc.computeSeries(candles);
      expect(
        series.last.vwap,
        greaterThan(150.0),
      ); // pulled toward high-vol bar
    });

    test('dates in series match candle dates', () {
      final candles = List.generate(
        5,
        (i) => _candle(i, high: 110, low: 90, close: 100),
      );
      final series = calc.computeSeries(candles);
      for (int i = 0; i < 5; i++) {
        expect(series[i].date, candles[i].date);
      }
    });
  });

  group('VwapCalculator.compute (single)', () {
    test('returns null for empty candles', () {
      expect(calc.compute([]), isNull);
    });

    test('returns last series entry', () {
      final candles = List.generate(
        10,
        (i) => _candle(i, high: 110, low: 90, close: 100),
      );
      final result = calc.compute(candles);
      expect(result, isNotNull);
      expect(result!.date, candles.last.date);
    });
  });

  group('VwapResult equality', () {
    final d = DateTime(2024, 3, 1);
    final a = VwapResult(date: d, vwap: 100.5);
    final b = VwapResult(date: d, vwap: 100.5);
    test('same fields equal', () {
      expect(a, equals(b));
      expect(a.hashCode, b.hashCode);
    });
    test('different vwap not equal', () {
      final c = VwapResult(date: d, vwap: 99.0);
      expect(a, isNot(equals(c)));
    });
  });
}
