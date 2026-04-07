import 'package:cross_tide/src/domain/atr_calculator.dart';
import 'package:cross_tide/src/domain/entities.dart';
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

/// Uniform candles with equal OHLC — TR = high - low = spread.
List<DailyCandle> _uniform(
  int count, {
  double spread = 2.0,
  double base = 100,
}) => List.generate(
  count,
  (i) => _ohlc(
    i,
    open: base,
    high: base + spread,
    low: base - spread,
    close: base,
  ),
);

void main() {
  const calc = AtrCalculator();

  group('AtrCalculator', () {
    test('can be constructed at runtime', () {
      const AtrCalculator Function() create = AtrCalculator.new;
      expect(create().computeSeries([]), isEmpty);
    });
  });

  group('AtrCalculator.computeSeries', () {
    test('returns empty list when candles.length <= period', () {
      expect(calc.computeSeries(_uniform(14), period: 14), isEmpty);
    });

    test('returns empty list for period=14 with exactly 14 candles', () {
      expect(calc.computeSeries(_uniform(14)), isEmpty);
    });

    test('first result aligned to bar at index [period]', () {
      final candles = _uniform(20, spread: 2);
      final series = calc.computeSeries(candles, period: 14);
      expect(series, isNotEmpty);
      expect(series.first.date, candles[14].date);
    });

    test('uniform candles: ATR converges to HL range (2*spread)', () {
      final candles = _uniform(100, spread: 4, base: 200);
      final series = calc.computeSeries(candles, period: 14);
      // TR = high - low = (base+4) - (base-4) = 8; ATR converges to 8.
      expect(series.last.atr, closeTo(8.0, 0.001));
    });

    test('atrPercent = (atr / close) * 100', () {
      final candles = _uniform(20, spread: 2, base: 100);
      final series = calc.computeSeries(candles, period: 14);
      final result = series.last;
      expect(result.atrPercent, closeTo((result.atr / 100) * 100, 0.0001));
    });

    test(
      'series length equals candles.length - period for period < length',
      () {
        final candles = _uniform(30, spread: 1, base: 50);
        final series = calc.computeSeries(candles, period: 14);
        expect(series.length, candles.length - 14);
      },
    );

    test('true range uses |high - prevClose| when gap-up', () {
      // Gap-up scenario: previous close = 100, today high = 115, low = 109
      // TR should capture the gap: |115 - 100| = 15 > (115-109)=6
      final base = _uniform(14, spread: 1, base: 100);
      final gapBar = _ohlc(14, open: 110, high: 115, low: 109, close: 112);
      final series = calc.computeSeries([...base, gapBar], period: 14);
      // ATR seed = avg(14 bars of TR=2) = 2; then blended with 15.
      // Resulting ATR > 2.
      expect(series.first.atr, greaterThan(2.0));
    });
  });

  group('AtrCalculator.compute (single result)', () {
    test('returns null with insufficient candles', () {
      expect(calc.compute(_uniform(14)), isNull);
    });

    test('returns a result when sufficient candles are available', () {
      final result = calc.compute(_uniform(20), period: 14);
      expect(result, isNotNull);
      expect(result!.atr, greaterThan(0));
    });
  });

  group('AtrResult equality', () {
    final d = DateTime(2024, 1, 1);
    final a = AtrResult(date: d, atr: 2.5, atrPercent: 2.5);
    final b = AtrResult(date: d, atr: 2.5, atrPercent: 2.5);
    test('same fields are equal', () {
      expect(a, equals(b));
      expect(a.hashCode, b.hashCode);
    });

    test('different atr not equal', () {
      final c = AtrResult(date: d, atr: 3.0, atrPercent: 3.0);
      expect(a, isNot(equals(c)));
    });
  });
}
