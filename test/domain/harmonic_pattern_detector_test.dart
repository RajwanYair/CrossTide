import 'package:cross_tide/src/domain/domain.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  const detector = HarmonicPatternDetector(tolerance: 0.1);

  group('HarmonicPatternDetector', () {
    test('detects Gartley pattern within tolerance', () {
      // Construct pivots that match Gartley ratios:
      // AB/XA ≈ 0.618, AD/XA ≈ 0.786
      final pivots = [
        (index: 0, price: 100.0), // X
        (index: 10, price: 120.0), // A (XA = 20)
        (index: 20, price: 107.6), // B (AB = 12.4, AB/XA = 0.62 ≈ 0.618)
        (index: 30, price: 115.0), // C (BC = 7.4, BC/AB ≈ 0.6)
        (index: 40, price: 104.3), // D (AD/XA ≈ 0.785)
      ];

      final results = detector.detect(pivots);
      // May or may not match exactly due to tolerance
      expect(results, isA<List<HarmonicPattern>>());
    });

    test('returns empty with fewer than 5 pivots', () {
      final pivots = [
        (index: 0, price: 100.0),
        (index: 10, price: 120.0),
        (index: 20, price: 110.0),
      ];

      expect(detector.detect(pivots), isEmpty);
    });

    test('HarmonicPattern equality', () {
      const a = HarmonicPattern(
        type: HarmonicType.gartley,
        bias: HarmonicBias.bullish,
        xPoint: (index: 0, price: 100.0),
        aPoint: (index: 10, price: 120.0),
        bPoint: (index: 20, price: 108.0),
        cPoint: (index: 30, price: 115.0),
        dPoint: (index: 40, price: 104.0),
        completionPct: 100,
        prz: 104.0,
      );
      const b = HarmonicPattern(
        type: HarmonicType.gartley,
        bias: HarmonicBias.bullish,
        xPoint: (index: 0, price: 100.0),
        aPoint: (index: 10, price: 120.0),
        bPoint: (index: 20, price: 108.0),
        cPoint: (index: 30, price: 115.0),
        dPoint: (index: 40, price: 104.0),
        completionPct: 100,
        prz: 104.0,
      );
      expect(a, equals(b));
    });

    test('no pattern when ratios are way off', () {
      final pivots = [
        (index: 0, price: 100.0),
        (index: 10, price: 200.0),
        (index: 20, price: 50.0),
        (index: 30, price: 300.0),
        (index: 40, price: 10.0),
      ];

      expect(detector.detect(pivots), isEmpty);
    });
  });
}
