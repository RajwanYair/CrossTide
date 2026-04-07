import 'package:cross_tide/src/domain/domain.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  const detector = GapDetector();

  group('GapDetector', () {
    test('const constructor', () {
      const GapDetector Function() create = GapDetector.new;
      expect(create(), isNotNull);
    });

    test('returns empty for single candle', () {
      expect(
        detector.detect([
          DailyCandle(
            date: DateTime(2024, 1, 1),
            open: 100,
            high: 102,
            low: 98,
            close: 100,
            volume: 1000,
          ),
        ]),
        isEmpty,
      );
    });

    test('detects gap up', () {
      final candles = [
        DailyCandle(
          date: DateTime(2024, 1, 1),
          open: 100,
          high: 102,
          low: 98,
          close: 101,
          volume: 1000,
        ),
        DailyCandle(
          date: DateTime(2024, 1, 2),
          open: 105,
          high: 108,
          low: 104,
          close: 107,
          volume: 1000,
        ),
      ];
      final gaps = detector.detect(candles);
      expect(gaps.length, 1);
      expect(gaps.first.direction, GapDirection.up);
      expect(gaps.first.gapStart, 102); // prev high
      expect(gaps.first.gapEnd, 104); // curr low
    });

    test('detects gap down', () {
      final candles = [
        DailyCandle(
          date: DateTime(2024, 1, 1),
          open: 100,
          high: 102,
          low: 98,
          close: 101,
          volume: 1000,
        ),
        DailyCandle(
          date: DateTime(2024, 1, 2),
          open: 94,
          high: 96,
          low: 92,
          close: 93,
          volume: 1000,
        ),
      ];
      final gaps = detector.detect(candles);
      expect(gaps.length, 1);
      expect(gaps.first.direction, GapDirection.down);
    });

    test('no gap when ranges overlap', () {
      final candles = [
        DailyCandle(
          date: DateTime(2024, 1, 1),
          open: 100,
          high: 105,
          low: 95,
          close: 102,
          volume: 1000,
        ),
        DailyCandle(
          date: DateTime(2024, 1, 2),
          open: 103,
          high: 108,
          low: 100,
          close: 106,
          volume: 1000,
        ),
      ];
      expect(detector.detect(candles), isEmpty);
    });

    test('minimumPercent filter', () {
      final candles = [
        DailyCandle(
          date: DateTime(2024, 1, 1),
          open: 100,
          high: 100.5,
          low: 99.5,
          close: 100,
          volume: 1000,
        ),
        DailyCandle(
          date: DateTime(2024, 1, 2),
          open: 101,
          high: 102,
          low: 100.6,
          close: 101.5,
          volume: 1000,
        ),
      ];
      // Small gap exists
      expect(detector.detect(candles).length, 1);
      // But filtered out with 1% min
      expect(detector.detect(candles, minimumPercent: 1.0), isEmpty);
    });

    test('equatable on PriceGap', () {
      final candles = [
        DailyCandle(
          date: DateTime(2024, 1, 1),
          open: 100,
          high: 102,
          low: 98,
          close: 101,
          volume: 1000,
        ),
        DailyCandle(
          date: DateTime(2024, 1, 2),
          open: 105,
          high: 108,
          low: 104,
          close: 107,
          volume: 1000,
        ),
      ];
      final g1 = detector.detect(candles);
      final g2 = detector.detect(candles);
      expect(g1.first, equals(g2.first));
    });
  });
}
