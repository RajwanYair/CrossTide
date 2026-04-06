import 'package:cross_tide/src/domain/domain.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('CrossUpDetector', () {
    const detector = CrossUpDetector();

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

    TickerAlertState belowState() =>
        const TickerAlertState(ticker: 'TEST', lastStatus: SmaRelation.below);

    TickerAlertState aboveState() =>
        const TickerAlertState(ticker: 'TEST', lastStatus: SmaRelation.above);

    test('returns null with insufficient data (<201 candles)', () {
      final candles = makeCandles(List.filled(200, 100.0));
      final result = detector.evaluate(
        ticker: 'TEST',
        candles: candles,
        previousState: belowState(),
      );
      expect(result, isNull);
    });

    test('detects cross-up when price crosses above SMA200', () {
      // 201 candles:
      //   First 199 at $100 (establishes SMA around $100)
      //   Day 200 (t-1): $99 (below SMA ~$100)
      //   Day 201 (t): $102 (above SMA ~$100, and rising)
      final closes = [
        ...List.filled(199, 100.0),
        99.0, // t-1: below SMA
        102.0, // t: above SMA and rising
      ];
      final candles = makeCandles(closes);

      final result = detector.evaluate(
        ticker: 'TEST',
        candles: candles,
        previousState: belowState(),
      );

      expect(result, isNotNull);
      expect(result!.isCrossUp, isTrue);
      expect(result.isRising, isTrue);
      expect(result.shouldAlert, isTrue);
      expect(result.currentRelation, SmaRelation.above);
    });

    test('does NOT alert when already above (idempotent)', () {
      final closes = [...List.filled(199, 100.0), 99.0, 102.0];
      final candles = makeCandles(closes);

      // Previous state: already above -> should NOT alert again
      final result = detector.evaluate(
        ticker: 'TEST',
        candles: candles,
        previousState: aboveState(),
      );

      expect(result, isNotNull);
      expect(result!.isCrossUp, isTrue);
      expect(
        result.shouldAlert,
        isFalse,
        reason: 'Alert should be idempotent -- already in above state',
      );
    });

    test('no cross-up when price stays below SMA200', () {
      final closes = [
        ...List.filled(199, 100.0),
        98.0, // t-1
        97.0, // t: still below SMA (~$100)
      ];
      final candles = makeCandles(closes);

      final result = detector.evaluate(
        ticker: 'TEST',
        candles: candles,
        previousState: belowState(),
      );

      expect(result, isNotNull);
      expect(result!.isCrossUp, isFalse);
      expect(result.shouldAlert, isFalse);
    });

    test('no alert when cross-up but NOT rising (multi-day strictness)', () {
      // With strictness=2: need close[t]>close[t-1]>close[t-2]
      // Here t-1 < t-2 so 2-day rising fails even though 1-day passes.
      final closes = [
        ...List.filled(198, 100.0),
        101.0, // t-2: above close[t-1]
        99.5, // t-1: below SMA (and below t-2, so 2-day rising fails)
        100.5, // t: above SMA, > t-1, but t-1 < t-2, so 2-day NOT met
      ];
      final candles = makeCandles(closes);

      final result = detector.evaluate(
        ticker: 'TEST',
        candles: candles,
        previousState: belowState(),
        trendStrictnessDays: 2,
      );

      expect(result, isNotNull);
      expect(
        result!.isCrossUp,
        isTrue,
        reason: 'close[t-1] <= sma200[t-1] AND close[t] > sma200[t]',
      );
      expect(result.isRising, isFalse, reason: '2-day trend not satisfied');
      expect(result.shouldAlert, isFalse);
    });

    test('handles equal close and SMA (boundary: <= means no cross-up)', () {
      // When close[t] exactly equals SMA200[t], it's NOT strictly above.
      // All 201 candles at $100 -> SMA200[t] = 100, close[t] = 100.
      // close[t-1] = 100, sma200[t-1] = 100 -> close[t-1] <= sma200[t-1] ok
      // But close[t] = 100, sma200[t] = 100 -> close[t] NOT > sma200[t]
      // So: no cross-up.
      final closes = List.filled(201, 100.0);
      final candles = makeCandles(closes);

      final result = detector.evaluate(
        ticker: 'TEST',
        candles: candles,
        previousState: belowState(),
      );

      expect(result, isNotNull);
      // close[t]=100, sma200[t]=100 -> NOT strictly above
      expect(result!.currentRelation, SmaRelation.below);
      expect(result.isCrossUp, isFalse);
    });

    test('after cross-down, can alert on next cross-up', () {
      // Simulate: was above -> crossed below -> now crosses back above
      // Previous state: below (after cross-down)
      final closes = [
        ...List.filled(199, 100.0),
        99.0, // t-1: below SMA
        102.0, // t: above SMA
      ];
      final candles = makeCandles(closes);

      final result = detector.evaluate(
        ticker: 'TEST',
        candles: candles,
        previousState: belowState(),
      );

      expect(result!.isCrossUp, isTrue);
      expect(
        result.shouldAlert,
        isTrue,
        reason: 'After cross-down, next cross-up should fire',
      );
    });

    test('multi-day trend strictness=3 requires 3 rising days', () {
      final closes = [
        ...List.filled(197, 100.0),
        99.0, // t-3
        99.5, // t-2 > t-3
        99.8, // t-1 > t-2, below SMA
        102.0, // t > t-1, above SMA, 3-day rising
      ];
      final candles = makeCandles(closes);

      final result = detector.evaluate(
        ticker: 'TEST',
        candles: candles,
        previousState: belowState(),
        trendStrictnessDays: 3,
      );

      expect(result, isNotNull);
      expect(result!.isRising, isTrue, reason: '3 consecutive rising days');
    });

    test('can be constructed with a custom SmaCalculator', () {
      const custom = CrossUpDetector(smaCalculator: SmaCalculator());
      expect(custom, isA<CrossUpDetector>());
    });
  });
}
