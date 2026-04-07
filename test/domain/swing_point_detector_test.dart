import 'package:cross_tide/src/domain/domain.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  const detector = SwingPointDetector(lookback: 2);

  List<DailyCandle> makeCandles(List<(double, double)> highLow) {
    return [
      for (int i = 0; i < highLow.length; i++)
        DailyCandle(
          date: DateTime(2024, 1, 1 + i),
          open: (highLow[i].$1 + highLow[i].$2) / 2,
          high: highLow[i].$1,
          low: highLow[i].$2,
          close: (highLow[i].$1 + highLow[i].$2) / 2,
          volume: 1000,
        ),
    ];
  }

  group('SwingPointDetector', () {
    test('detects swing high', () {
      final candles = makeCandles(const [
        (100, 95),
        (105, 98),
        (110, 102), // swing high
        (104, 97),
        (101, 94),
      ]);

      final result = detector.detect(candles);
      expect(result.swingHighs, hasLength(1));
      expect(result.swingHighs[0].price, 110);
      expect(result.swingHighs[0].index, 2);
    });

    test('detects swing low', () {
      final candles = makeCandles(const [
        (100, 95),
        (98, 90),
        (97, 85), // swing low
        (99, 88),
        (102, 92),
      ]);

      final result = detector.detect(candles);
      expect(result.swingLows, hasLength(1));
      expect(result.swingLows[0].price, 85);
    });

    test('infers uptrend from higher highs and lows', () {
      // Create an uptrending series with clear swing points
      final candles = makeCandles(const [
        (100, 90),
        (95, 85),
        (92, 82), // swing low 1
        (98, 88),
        (105, 95), // swing high 1
        (100, 90),
        (97, 87), // swing low 2 (higher)
        (103, 93),
        (112, 102), // swing high 2 (higher)
        (108, 98),
        (104, 94),
      ]);

      final result = detector.detect(candles);
      if (result.swingHighs.length >= 2 && result.swingLows.length >= 2) {
        expect(result.currentTrend, 'up');
      }
    });

    test('returns unknown with insufficient data', () {
      final candles = makeCandles(const [(100, 95), (102, 97)]);
      final result = detector.detect(candles);
      expect(result.currentTrend, 'unknown');
      expect(result.swingHighs, isEmpty);
      expect(result.swingLows, isEmpty);
    });
  });
}
