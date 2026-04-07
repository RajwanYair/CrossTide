import 'package:cross_tide/src/domain/domain.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  const calc = TrailingStopCalculator();

  final candles = [
    for (int i = 0; i < 50; i++)
      DailyCandle(
        date: DateTime(2024, 1, 1).add(Duration(days: i)),
        open: 100.0 + i * 0.5,
        high: 101.0 + i * 0.5,
        low: 99.0 + i * 0.5,
        close: 100.0 + i * 0.5,
        volume: 1000000,
      ),
  ];

  group('TrailingStopCalculator', () {
    test('computePercentage sets stop below HWM', () {
      final result = calc.computePercentage(
        ticker: 'AAPL',
        candles: candles,
        trailPct: 5.0,
      );
      expect(result.ticker, 'AAPL');
      expect(result.highWaterMark, candles.last.close);
      expect(result.stopLevel, closeTo(result.highWaterMark * 0.95, 0.01));
      expect(result.isTriggered, isFalse);
    });

    test('computePercentage triggers when price drops', () {
      final dropping = [
        ...candles,
        DailyCandle(
          date: DateTime(2024, 3, 1),
          open: 90,
          high: 91,
          low: 88,
          close: 88,
          volume: 1000000,
        ),
      ];
      final result = calc.computePercentage(
        ticker: 'AAPL',
        candles: dropping,
        trailPct: 5.0,
      );
      expect(result.isTriggered, isTrue);
    });

    test('computeAtr sets stop based on ATR', () {
      final result = calc.computeAtr(
        ticker: 'AAPL',
        candles: candles,
        atrValue: 2.5,
        atrMultiplier: 2.0,
      );
      expect(result.stopLevel, closeTo(result.highWaterMark - 5.0, 0.01));
    });

    test('empty candles returns zero result', () {
      final result = calc.computePercentage(
        ticker: 'AAPL',
        candles: [],
        trailPct: 5.0,
      );
      expect(result.highWaterMark, 0);
      expect(result.isTriggered, isFalse);
    });

    test('distancePct is computable', () {
      final result = calc.computePercentage(
        ticker: 'AAPL',
        candles: candles,
        trailPct: 5.0,
      );
      expect(result.distancePct, greaterThan(0));
    });
  });
}
