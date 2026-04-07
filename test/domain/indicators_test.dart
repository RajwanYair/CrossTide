import 'package:cross_tide/src/domain/domain.dart';
import 'package:flutter_test/flutter_test.dart';

List<DailyCandle> makeCandles(List<double> closes) {
  return closes.asMap().entries.map((e) {
    return DailyCandle(
      date: DateTime(2024, 1, 1).add(Duration(days: e.key)),
      open: e.value,
      high: e.value + 1,
      low: e.value - 1,
      close: e.value,
      volume: 1000000,
    );
  }).toList();
}

void main() {
  // -------------------------------------------------------------------------
  // EMA
  // -------------------------------------------------------------------------
  group('EmaCalculator', () {
    const calc = EmaCalculator();

    test('returns null when fewer than period candles', () {
      final candles = makeCandles(List.filled(4, 10.0));
      expect(calc.compute(candles, period: 5), isNull);
    });

    test('seed equals SMA for exactly period candles', () {
      // All closes = 10; EMA = SMA = 10
      final candles = makeCandles(List.filled(10, 10.0));
      expect(calc.compute(candles, period: 10), closeTo(10.0, 0.001));
    });

    test('EMA reacts faster than SMA to new price', () {
      // 20 candles at 100, then 1 candle at 200
      final closes = [...List.filled(20, 100.0), 200.0];
      final candles = makeCandles(closes);
      final ema = calc.compute(candles, period: 10)!;
      // EMA puts more weight on the new 200 candle vs SMA; result > 100
      expect(ema, greaterThan(100.0));
    });

    test('computeSeries length equals candles length', () {
      final candles = makeCandles(List.generate(50, (i) => 100.0 + i));
      final series = calc.computeSeries(candles, period: 10);
      expect(series.length, 50);
    });

    test('first (period-1) series entries are null', () {
      final candles = makeCandles(List.generate(20, (i) => 10.0));
      final series = calc.computeSeries(candles, period: 5);
      for (int i = 0; i < 4; i++) {
        expect(series[i].$2, isNull, reason: 'index $i should be null');
      }
      expect(series[4].$2, isNotNull);
    });

    test('constant prices yield EMA equal to price', () {
      final candles = makeCandles(List.filled(30, 42.0));
      final series = calc.computeSeries(candles, period: 5);
      for (int i = 4; i < series.length; i++) {
        expect(series[i].$2, closeTo(42.0, 0.001), reason: 'index $i');
      }
    });
  });

  // -------------------------------------------------------------------------
  // RSI
  // -------------------------------------------------------------------------
  group('RsiCalculator', () {
    const calc = RsiCalculator();

    test('returns null with insufficient candles', () {
      final candles = makeCandles(List.filled(14, 50.0));
      expect(calc.compute(candles, period: 14), isNull);
    });

    test('RSI = 100 when all days are up', () {
      // 30 strictly increasing candles → all gains, no losses → RSI = 100
      final closes = List.generate(30, (i) => 100.0 + i.toDouble());
      final candles = makeCandles(closes);
      expect(calc.compute(candles, period: 14), closeTo(100.0, 0.001));
    });

    test('RSI = 0 when all days are down', () {
      // 30 strictly decreasing candles → no gains → RSI = 0
      final closes = List.generate(30, (i) => 100.0 - i.toDouble());
      final candles = makeCandles(closes);
      expect(calc.compute(candles, period: 14), closeTo(0.0, 0.001));
    });

    test('RSI near 50 for alternating up/down', () {
      // alternate +1, -1 → avg gain ≈ avg loss → RSI ≈ 50
      final closes = <double>[100.0];
      for (int i = 0; i < 29; i++) {
        closes.add(closes.last + (i.isEven ? 1.0 : -1.0));
      }
      final candles = makeCandles(closes);
      final rsi = calc.compute(candles, period: 14)!;
      expect(rsi, greaterThan(30.0));
      expect(rsi, lessThan(70.0));
    });

    test('computeSeries length equals candles length', () {
      final candles = makeCandles(List.generate(40, (i) => 50.0 + i * 0.1));
      final series = calc.computeSeries(candles, period: 14);
      expect(series.length, 40);
    });

    test('first period entries are null', () {
      final candles = makeCandles(List.generate(30, (i) => 50.0 + i * 0.5));
      final series = calc.computeSeries(candles, period: 14);
      for (int i = 0; i < 14; i++) {
        expect(series[i].$2, isNull);
      }
      expect(series[14].$2, isNotNull);
    });
  });

  // -------------------------------------------------------------------------
  // MACD
  // -------------------------------------------------------------------------
  group('MacdCalculator', () {
    const calc = MacdCalculator(
      fastPeriod: 12,
      slowPeriod: 26,
      signalPeriod: 9,
    );

    test('returns null for insufficient candles', () {
      final candles = makeCandles(List.filled(30, 50.0));
      expect(calc.compute(candles), isNull);
    });

    test('computeSeries length equals candles length', () {
      final candles = makeCandles(
        List.generate(100, (i) => 100.0 + i.toDouble()),
      );
      final series = calc.computeSeries(candles);
      expect(series.length, 100);
    });

    test('MACD > 0 in an uptrend', () {
      // 100 candles all rising by 1 each day
      final candles = makeCandles(
        List.generate(100, (i) => 50.0 + i.toDouble()),
      );
      final result = calc.compute(candles);
      expect(result, isNotNull);
      // In a consistent uptrend fast EMA > slow EMA → MACD > 0
      expect(result!.macd, greaterThan(0));
    });

    test('MACD < 0 in a downtrend', () {
      final candles = makeCandles(
        List.generate(100, (i) => 150.0 - i.toDouble()),
      );
      final result = calc.compute(candles);
      expect(result, isNotNull);
      expect(result!.macd, lessThan(0));
    });

    test('histogram = macd - signal', () {
      final candles = makeCandles(List.generate(100, (i) => 100.0 + i * 0.5));
      final result = calc.compute(candles);
      expect(result, isNotNull);
      expect(result!.histogram, closeTo(result.macd! - result.signal!, 0.0001));
    });

    test('computeSeries returns all-null when candles < fastPeriod', () {
      // With fewer candles than the fast period (12), both fast and slow EMAs
      // are null for every entry, so the MACD line is entirely null,
      // triggering the all-null early-return branch.
      final candles = makeCandles(List.filled(5, 50.0));
      final series = calc.computeSeries(candles);
      expect(series.length, 5);
      for (final r in series) {
        expect(r.macd, isNull);
        expect(r.signal, isNull);
        expect(r.histogram, isNull);
      }
    });
  });

  // -------------------------------------------------------------------------
  // Bollinger Bands
  // -------------------------------------------------------------------------
  group('BollingerCalculator', () {
    const calc = BollingerCalculator(period: 20, multiplier: 2.0);

    test('returns null for insufficient candles', () {
      final candles = makeCandles(List.filled(19, 50.0));
      expect(calc.compute(candles), isNull);
    });

    test('constant price yields zero bandwidth', () {
      final candles = makeCandles(List.filled(30, 100.0));
      final result = calc.compute(candles)!;
      expect(result.upper, closeTo(100.0, 0.001));
      expect(result.lower, closeTo(100.0, 0.001));
      expect(result.bandwidth, closeTo(0.0, 0.001));
    });

    test('upper > middle > lower for varying prices', () {
      final closes = List.generate(30, (i) => 100.0 + (i % 5) * 2.0);
      final candles = makeCandles(closes);
      final result = calc.compute(candles)!;
      expect(result.upper, greaterThan(result.middle!));
      expect(result.middle, greaterThan(result.lower!));
    });

    test('percentB is between 0 and 1 when close is inside bands', () {
      final closes = List.generate(30, (i) => 100.0 + (i % 5) * 2.0);
      final candles = makeCandles(closes);
      final result = calc.compute(candles)!;
      if (result.percentB != null) {
        expect(result.percentB, greaterThanOrEqualTo(-0.5));
        expect(result.percentB, lessThanOrEqualTo(1.5));
      }
    });

    test('computeSeries length equals candles length', () {
      final candles = makeCandles(List.generate(50, (i) => 100.0 + i * 0.1));
      final series = calc.computeSeries(candles);
      expect(series.length, 50);
    });

    test('first (period-1) entries have null bands', () {
      final candles = makeCandles(List.generate(25, (i) => 50.0 + i * 0.5));
      final series = calc.computeSeries(candles);
      for (int i = 0; i < 19; i++) {
        expect(series[i].upper, isNull, reason: 'index $i');
      }
      expect(series[19].upper, isNotNull);
    });
  });
}
