import 'package:cross_tide/src/domain/domain.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  const calc = TrendlineCalculator(touchTolerance: 0.02, minTouches: 2);

  group('TrendlineCalculator', () {
    test('finds support trendline from swing lows', () {
      final lows = [100.0, 102.0, 105.0, 103.0, 106.0, 108.0, 110.0];
      final highs = [110.0, 112.0, 115.0, 113.0, 116.0, 118.0, 120.0];

      final result = calc.compute(
        highs: highs,
        lows: lows,
        swingHighIndices: [2, 4],
        swingLowIndices: [0, 3],
      );

      expect(result.supportLines, isNotEmpty);
      expect(result.supportLines.first.isSupport, isTrue);
    });

    test('finds resistance trendline from swing highs', () {
      final lows = [90.0, 92.0, 95.0, 93.0, 96.0, 98.0, 100.0];
      final highs = [100.0, 105.0, 110.0, 104.0, 108.0, 112.0, 116.0];

      final result = calc.compute(
        highs: highs,
        lows: lows,
        swingHighIndices: [2, 5],
        swingLowIndices: [0, 3],
      );

      expect(result.resistanceLines, isNotEmpty);
      expect(result.resistanceLines.first.isSupport, isFalse);
    });

    test('trendline projects price correctly', () {
      const line = Trendline(
        startIndex: 0,
        startPrice: 100,
        endIndex: 10,
        endPrice: 110,
        slope: 1.0,
        isSupport: true,
        touchCount: 3,
      );

      expect(line.priceAt(5), 105);
      expect(line.priceAt(20), 120);
    });

    test('empty swing indices returns empty lines', () {
      final result = calc.compute(
        highs: [100, 102],
        lows: [95, 97],
        swingHighIndices: [],
        swingLowIndices: [],
      );
      expect(result.supportLines, isEmpty);
      expect(result.resistanceLines, isEmpty);
    });
  });
}
