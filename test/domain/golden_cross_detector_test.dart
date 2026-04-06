// Tests for GoldenCrossDetector.
//
// Covers: evaluateGoldenCross, evaluateDeathCross, evaluateBoth,
// boundary conditions (exactly 201 candles), insufficient data (null).
import 'package:cross_tide/src/domain/domain.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('GoldenCrossDetector', () {
    const detector = GoldenCrossDetector();

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

    // 201 candles where SMA50 was below SMA200 and now crosses above.
    //
    // Strategy: first 150 candles at $90 (pulls SMA200 toward 90),
    //           next 50 candles at $110 (SMA50 at t = $110, SMA200 at t ≈ $99.75)
    //           last 1 candle at $115.
    // At t-1 (200 candles): SMA50 ≈ $110, SMA200 ≈ $99.75 → SMA50 already above
    // That won't produce a golden cross at t. We need SMA50[t-1] <= SMA200[t-1].
    //
    // Better strategy: force a scenario where:
    //   - candles 0..199: slow uptrend keeping SMA50 ≈ SMA200
    //   - candle 199 (t-1): SMA50 just barely below SMA200
    //   - candle 200 (t):   SMA50 just above SMA200

    // Build a scenario where SMA50[t-1] <= SMA200[t-1] and SMA50[t] > SMA200[t].
    // The simplest approach: use 201 constant candles but adjust the last few.
    //
    // We'll craft it numerically: first 151 candles at $100, candles 151-199
    // (49 candles) at $99.5 (slightly below), candle 200 (t-1) at $99.5,
    // candle 201 (t) at $120.
    //
    // SMA200[t] = average of candles 1..200: (151*100 + 49*99.5) = 15100+4875.5..
    // This gets complex. Let simpler: first 200 candles at 100, last at 120.
    // SMA50[t]  = average of candles 152..201 = (49*100 + 120) / 50 = 102.4
    // SMA200[t] = average of candles 1..200   = (200*100) / 200 = 100  wait...
    // Actually candles are 0-indexed. Let's just use:
    //   201 candles: first 200 at $100, last at $120
    //   SMA200[t] = (199*100 + 120)/200 = 100.1
    //   SMA50[t]  = (49*100 + 120)/50  = 102.4
    //   SMA200[t-1] = (200*100)/200 = 100
    //   SMA50[t-1]  = (50*100)/50   = 100
    //   sma50[t-1]=100 == sma200[t-1]=100 → condition: sma50[t-1] <= sma200[t-1] ✓
    //   sma50[t]=102.4 > sma200[t]=100.1 → Golden Cross ✓

    List<DailyCandle> goldenCrossCandles() =>
        makeCandles([...List.filled(200, 100.0), 120.0]);

    // Death Cross: first 200 at $100, last at $80
    //   SMA50[t-1] = 100, SMA200[t-1] = 100 → equal → sma50[t-1] >= sma200 ✓
    //   SMA50[t]  = (49*100+80)/50 = 97.6 < SMA200[t] = (199*100+80)/200 = 99.9 ✓
    List<DailyCandle> deathCrossCandles() =>
        makeCandles([...List.filled(200, 100.0), 80.0]);

    // Neutral: all at $100 — no cross (SMA50 == SMA200 throughout)
    List<DailyCandle> neutralCandles() => makeCandles(List.filled(201, 100.0));

    // ----------------------------------------------------------------
    // evaluateGoldenCross
    // ----------------------------------------------------------------

    test('detects golden cross correctly', () {
      final result = detector.evaluateGoldenCross(
        ticker: 'AAPL',
        candles: goldenCrossCandles(),
      );
      expect(result, isNotNull);
      expect(result!.type, AlertType.goldenCross);
      expect(result.isCrossEvent, isTrue);
      expect(result.currentSma50, greaterThan(result.currentSma200));
      expect(result.previousSma50, lessThanOrEqualTo(result.previousSma200));
    });

    test('no golden cross when price falls', () {
      final result = detector.evaluateGoldenCross(
        ticker: 'AAPL',
        candles: deathCrossCandles(),
      );
      expect(result, isNotNull);
      expect(result!.isCrossEvent, isFalse);
    });

    test('no golden cross on neutral candles', () {
      final result = detector.evaluateGoldenCross(
        ticker: 'SPY',
        candles: neutralCandles(),
      );
      expect(result, isNotNull);
      // SMA50[t-1] == SMA200[t-1] and SMA50[t] == SMA200[t] → no strict golden cross
      expect(result!.isCrossEvent, isFalse);
    });

    test('returns null with fewer than 201 candles', () {
      final result = detector.evaluateGoldenCross(
        ticker: 'AAPL',
        candles: makeCandles(List.filled(200, 100.0)),
      );
      expect(result, isNull);
    });

    // ----------------------------------------------------------------
    // evaluateDeathCross
    // ----------------------------------------------------------------

    test('detects death cross correctly', () {
      final result = detector.evaluateDeathCross(
        ticker: 'AAPL',
        candles: deathCrossCandles(),
      );
      expect(result, isNotNull);
      expect(result!.type, AlertType.deathCross);
      expect(result.isCrossEvent, isTrue);
      expect(result.currentSma50, lessThan(result.currentSma200));
      expect(result.previousSma50, greaterThanOrEqualTo(result.previousSma200));
    });

    test('no death cross when price rises (golden cross scenario)', () {
      final result = detector.evaluateDeathCross(
        ticker: 'AAPL',
        candles: goldenCrossCandles(),
      );
      expect(result, isNotNull);
      expect(result!.isCrossEvent, isFalse);
    });

    test('returns null with fewer than 201 candles for death cross', () {
      final result = detector.evaluateDeathCross(
        ticker: 'AAPL',
        candles: makeCandles(List.filled(200, 100.0)),
      );
      expect(result, isNull);
    });

    // ----------------------------------------------------------------
    // evaluateBoth
    // ----------------------------------------------------------------

    test('evaluateBoth returns two events when data is available', () {
      final events = detector.evaluateBoth(
        ticker: 'AAPL',
        candles: goldenCrossCandles(),
      );
      expect(events.length, 2);
      expect(
        events.map((e) => e.type),
        containsAll([AlertType.goldenCross, AlertType.deathCross]),
      );
    });

    test('evaluateBoth returns empty list with insufficient data', () {
      final events = detector.evaluateBoth(
        ticker: 'TSLA',
        candles: makeCandles(List.filled(200, 100.0)),
      );
      expect(events, isEmpty);
    });

    // ----------------------------------------------------------------
    // CrossEvent fields
    // ----------------------------------------------------------------

    test('CrossEvent carries all required fields', () {
      final result = detector.evaluateGoldenCross(
        ticker: 'NVDA',
        candles: goldenCrossCandles(),
      );
      expect(result!.ticker, 'NVDA');
      expect(result.currentSma50, isPositive);
      expect(result.currentSma200, isPositive);
      expect(result.previousSma50, isPositive);
      expect(result.previousSma200, isPositive);
    });

    test('can be constructed with a custom SmaCalculator', () {
      const custom = GoldenCrossDetector(smaCalculator: SmaCalculator());
      expect(custom, isA<GoldenCrossDetector>());
    });
  });
}
