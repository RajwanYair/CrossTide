import 'package:cross_tide/src/domain/domain.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  const calc = ZScoreCalculator();

  group('ZScoreCalculator', () {
    test('computes z-score for series', () {
      final values = [10.0, 12.0, 11.0, 13.0, 14.0];
      final result = calc.compute(values);

      expect(result, isNotNull);
      expect(result!.value, 14.0);
      expect(result.mean, 12.0);
      expect(result.stdDev, greaterThan(0));
      expect(result.zScore, greaterThan(1.0));
      expect(result.percentile, greaterThan(50));
    });

    test('returns null for insufficient data', () {
      expect(calc.compute([42.0]), isNull);
    });

    test('handles zero variance', () {
      final result = calc.compute([5.0, 5.0, 5.0]);
      expect(result, isNotNull);
      expect(result!.zScore, 0);
      expect(result.percentile, 50);
    });

    test('detects extreme reading', () {
      final values = [10.0, 10.1, 10.0, 9.9, 10.0, 15.0];
      final result = calc.compute(values);
      expect(result, isNotNull);
      expect(result!.isExtreme, isTrue);
    });

    test('rolling z-score produces correct length', () {
      final values = List.generate(30, (int i) => 100.0 + i);
      final rolling = calc.rolling(values: values, window: 10);
      expect(rolling, hasLength(21));
    });

    test('rolling returns empty for small window', () {
      expect(calc.rolling(values: [1, 2, 3], window: 1), isEmpty);
    });
  });
}
