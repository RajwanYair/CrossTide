import 'package:cross_tide/src/domain/domain.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  const calculator = SupportResistanceCalculator();

  group('SupportResistanceCalculator', () {
    test('const constructor', () {
      const SupportResistanceCalculator Function() create =
          SupportResistanceCalculator.new;
      expect(create(), isNotNull);
    });

    test('returns empty for insufficient data', () {
      final candles = List.generate(
        5,
        (i) => DailyCandle(
          date: DateTime(2024, 1, i + 1),
          open: 100,
          high: 102,
          low: 98,
          close: 101,
          volume: 1000,
        ),
      );
      expect(calculator.compute(candles), isEmpty);
    });

    test('detects support level at local minimum', () {
      // V-shape: prices go down then up, creating a clear low at i=7
      final candles = List.generate(15, (i) {
        final double dist = (i - 7).abs().toDouble();
        final double base = 80 + dist * 3; // min=80 at i=7, rises both sides
        return DailyCandle(
          date: DateTime(2024, 1, i + 1),
          open: base,
          high: base + 1,
          low: base - 1,
          close: base,
          volume: 1000,
        );
      });
      final levels = calculator.compute(candles, lookback: 3);
      final supportLevels = levels.where(
        (SupportResistanceLevel l) => l.isSupport,
      );
      expect(supportLevels, isNotEmpty);
    });

    test('detects resistance level at local maximum', () {
      // Create inverted V-shape: ascending then descending
      final invertedCandles = List.generate(15, (i) {
        final double base = 100.0 + (7 - (i - 7).abs()) * 3;
        return DailyCandle(
          date: DateTime(2024, 1, i + 1),
          open: base - 1,
          high: base + 1,
          low: base - 2,
          close: base,
          volume: 1000,
        );
      });
      final levels = calculator.compute(invertedCandles, lookback: 3);
      final resistanceLevels = levels.where(
        (SupportResistanceLevel l) => !l.isSupport,
      );
      expect(resistanceLevels, isNotEmpty);
    });

    test('merges nearby levels', () {
      // Multiple pivots at similar prices should merge
      final candles = <DailyCandle>[];
      for (int cycle = 0; cycle < 3; cycle++) {
        for (int i = 0; i < 15; i++) {
          final double base = 100 + (7 - (i - 7).abs()) * 2.0;
          candles.add(
            DailyCandle(
              date: DateTime(2024, 1, 1).add(Duration(days: cycle * 15 + i)),
              open: base - 1,
              high: base + 1,
              low: base - 2,
              close: base,
              volume: 1000,
            ),
          );
        }
      }
      final levels = calculator.compute(candles, lookback: 3);
      // Merged levels should be fewer than raw pivots
      expect(levels.length, lessThan(10));
    });

    test('equatable', () {
      final l1 = SupportResistanceLevel(
        price: 100,
        date: DateTime(2024, 1, 1),
        isSupport: true,
        touchCount: 2,
      );
      final l2 = SupportResistanceLevel(
        price: 100,
        date: DateTime(2024, 1, 1),
        isSupport: true,
        touchCount: 2,
      );
      expect(l1, equals(l2));
    });
  });
}
