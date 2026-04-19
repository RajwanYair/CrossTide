import 'package:cross_tide/src/domain/pivot_point_calculator.dart';
import 'package:flutter_test/flutter_test.dart';

import '../helpers/candle_factory.dart';

DailyCandle _ohlc(
  int day, {
  required double high,
  required double low,
  required double close,
}) => makeOhlc(day, open: close, high: high, low: low, close: close);

void main() {
  const calc = PivotPointCalculator();

  group('PivotPointCalculator', () {
    test('const constructor', () {
      const PivotPointCalculator Function() create = PivotPointCalculator.new;
      expect(create().computeSeries([]), isEmpty);
    });
  });

  group('PivotPointCalculator.computeSeries', () {
    test('returns empty for fewer than 2 candles', () {
      expect(calc.computeSeries([]), isEmpty);
      expect(
        calc.computeSeries([_ohlc(0, high: 110, low: 90, close: 100)]),
        isEmpty,
      );
    });

    test('known values', () {
      // Prior candle: H=110, L=90, C=105
      // Pivot = (110+90+105)/3 = 101.666...
      // R1 = 2*101.666 - 90 = 113.333
      // S1 = 2*101.666 - 110 = 93.333
      // R2 = 101.666 + 20 = 121.666
      // S2 = 101.666 - 20 = 81.666
      final candles = [
        _ohlc(0, high: 110, low: 90, close: 105),
        _ohlc(1, high: 115, low: 95, close: 108),
      ];
      final series = calc.computeSeries(candles);
      expect(series.length, 1);
      final PivotResult r = series[0];
      expect(r.pivot, closeTo(101.667, 0.01));
      expect(r.r1, closeTo(113.333, 0.01));
      expect(r.s1, closeTo(93.333, 0.01));
      expect(r.r2, closeTo(121.667, 0.01));
      expect(r.s2, closeTo(81.667, 0.01));
    });

    test('R levels are ascending and S levels descending', () {
      final candles = [
        _ohlc(0, high: 110, low: 90, close: 100),
        _ohlc(1, high: 112, low: 88, close: 105),
      ];
      final PivotResult r = calc.computeSeries(candles).first;
      expect(r.r3, greaterThan(r.r2));
      expect(r.r2, greaterThan(r.r1));
      expect(r.r1, greaterThan(r.pivot));
      expect(r.pivot, greaterThan(r.s1));
      expect(r.s1, greaterThan(r.s2));
      expect(r.s2, greaterThan(r.s3));
    });

    test('series length is candles - 1', () {
      final candles = List.generate(
        10,
        (i) => _ohlc(i, high: 110, low: 90, close: 100),
      );
      final series = calc.computeSeries(candles);
      expect(series.length, 9);
    });

    test('dates align with current candle', () {
      final candles = [
        _ohlc(0, high: 110, low: 90, close: 100),
        _ohlc(1, high: 112, low: 88, close: 105),
      ];
      final PivotResult r = calc.computeSeries(candles).first;
      expect(r.date, candles[1].date);
    });
  });

  group('PivotPointCalculator.compute', () {
    test('returns null when insufficient data', () {
      expect(calc.compute([]), isNull);
    });

    test('returns last pivot set', () {
      final candles = [
        _ohlc(0, high: 110, low: 90, close: 100),
        _ohlc(1, high: 112, low: 88, close: 105),
        _ohlc(2, high: 115, low: 92, close: 110),
      ];
      final result = calc.compute(candles);
      expect(result, isNotNull);
      // Based on candle[1]: H=112, L=88, C=105 → P=(112+88+105)/3
      expect(result!.pivot, closeTo(101.667, 0.01));
    });
  });

  group('PivotResult', () {
    test('equatable by value', () {
      final DateTime d = DateTime(2024);
      final a = PivotResult(
        date: d,
        pivot: 100,
        r1: 110,
        r2: 120,
        r3: 130,
        s1: 90,
        s2: 80,
        s3: 70,
      );
      final b = PivotResult(
        date: d,
        pivot: 100,
        r1: 110,
        r2: 120,
        r3: 130,
        s1: 90,
        s2: 80,
        s3: 70,
      );
      expect(a, equals(b));
    });
  });
}
