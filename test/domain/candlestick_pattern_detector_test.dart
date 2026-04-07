import 'package:cross_tide/src/domain/domain.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  const detector = CandlestickPatternDetector();

  group('CandlestickPatternDetector', () {
    test('const constructor', () {
      const CandlestickPatternDetector Function() create =
          CandlestickPatternDetector.new;
      expect(create(), isNotNull);
    });

    test('empty candles', () {
      expect(detector.detect([]), isEmpty);
    });

    test('detects doji', () {
      final candles = [
        DailyCandle(
          date: DateTime(2024, 1, 1),
          open: 100,
          high: 105,
          low: 95,
          close: 100.1,
          volume: 1000,
        ),
      ];
      final patterns = detector.detect(candles);
      expect(
        patterns.any(
          (CandlestickPattern p) => p.type == CandlestickPatternType.doji,
        ),
        isTrue,
      );
    });

    test('detects hammer', () {
      // Small body at top, long lower shadow
      final candles = [
        DailyCandle(
          date: DateTime(2024, 1, 1),
          open: 100,
          high: 101,
          low: 90,
          close: 101,
          volume: 1000,
        ),
      ];
      final patterns = detector.detect(candles);
      expect(
        patterns.any(
          (CandlestickPattern p) => p.type == CandlestickPatternType.hammer,
        ),
        isTrue,
      );
    });

    test('detects bullish engulfing', () {
      final candles = [
        // Red candle
        DailyCandle(
          date: DateTime(2024, 1, 1),
          open: 105,
          high: 106,
          low: 99,
          close: 100,
          volume: 1000,
        ),
        // Green candle that engulfs
        DailyCandle(
          date: DateTime(2024, 1, 2),
          open: 99,
          high: 108,
          low: 98,
          close: 107,
          volume: 1000,
        ),
      ];
      final patterns = detector.detect(candles);
      expect(
        patterns.any(
          (CandlestickPattern p) =>
              p.type == CandlestickPatternType.bullishEngulfing,
        ),
        isTrue,
      );
    });

    test('detects bearish engulfing', () {
      final candles = [
        // Green candle
        DailyCandle(
          date: DateTime(2024, 1, 1),
          open: 100,
          high: 106,
          low: 99,
          close: 105,
          volume: 1000,
        ),
        // Red candle that engulfs
        DailyCandle(
          date: DateTime(2024, 1, 2),
          open: 106,
          high: 108,
          low: 98,
          close: 99,
          volume: 1000,
        ),
      ];
      final patterns = detector.detect(candles);
      expect(
        patterns.any(
          (CandlestickPattern p) =>
              p.type == CandlestickPatternType.bearishEngulfing,
        ),
        isTrue,
      );
    });

    test('detects morning star', () {
      final candles = [
        // Big red
        DailyCandle(
          date: DateTime(2024, 1, 1),
          open: 110,
          high: 112,
          low: 100,
          close: 101,
          volume: 1000,
        ),
        // Small body (doji-like)
        DailyCandle(
          date: DateTime(2024, 1, 2),
          open: 100,
          high: 101,
          low: 99,
          close: 100.2,
          volume: 1000,
        ),
        // Big green closing above midpoint of first
        DailyCandle(
          date: DateTime(2024, 1, 3),
          open: 101,
          high: 112,
          low: 100,
          close: 111,
          volume: 1000,
        ),
      ];
      final patterns = detector.detect(candles);
      expect(
        patterns.any(
          (CandlestickPattern p) =>
              p.type == CandlestickPatternType.morningStar,
        ),
        isTrue,
      );
    });

    test('equatable on CandlestickPattern', () {
      final p1 = CandlestickPattern(
        type: CandlestickPatternType.doji,
        date: DateTime(2024, 1, 1),
        isBullish: false,
      );
      final p2 = CandlestickPattern(
        type: CandlestickPatternType.doji,
        date: DateTime(2024, 1, 1),
        isBullish: false,
      );
      expect(p1, equals(p2));
    });
  });
}
