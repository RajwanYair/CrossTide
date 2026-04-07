import 'package:cross_tide/src/domain/domain.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  const counter = ElliottWaveCounter();

  group('ElliottWaveCounter', () {
    test('counts valid 5-wave impulse', () {
      // Uptrend: low, high, higher-low, highest-high, low, high
      final pivots = [
        (index: 0, price: 100.0), // X
        (index: 10, price: 120.0), // A (wave 1 up)
        (index: 20, price: 108.0), // B (wave 2 down, above X)
        (index: 40, price: 140.0), // C (wave 3 up, longest)
        (index: 50, price: 125.0), // D (wave 4 down, above A)
        (index: 60, price: 150.0), // E (wave 5 up)
      ];

      final result = counter.countImpulse(pivots);
      expect(result.waves, hasLength(5));
      expect(result.isValid, isTrue);
      expect(result.type, WaveType.impulse);
    });

    test('rejects wave 2 retracing past wave 1', () {
      final pivots = [
        (index: 0, price: 100.0),
        (index: 10, price: 120.0),
        (index: 20, price: 90.0), // wave 2 goes below X (invalid)
        (index: 30, price: 130.0),
        (index: 40, price: 115.0),
        (index: 50, price: 140.0),
      ];

      final result = counter.countImpulse(pivots);
      expect(result.isValid, isFalse);
      expect(result.invalidReason, contains('Wave 2'));
    });

    test('insufficient pivots returns invalid', () {
      final pivots = [(index: 0, price: 100.0), (index: 10, price: 120.0)];

      final result = counter.countImpulse(pivots);
      expect(result.isValid, isFalse);
      expect(result.waves, isEmpty);
    });

    test('counts corrective ABC pattern', () {
      final pivots = [
        (index: 0, price: 150.0),
        (index: 10, price: 130.0), // A down
        (index: 20, price: 140.0), // B up
        (index: 30, price: 120.0), // C down
      ];

      final result = counter.countCorrective(pivots);
      expect(result.waves, hasLength(3));
      expect(result.waves[0].label, 'A');
      expect(result.waves[1].label, 'B');
      expect(result.waves[2].label, 'C');
      expect(result.isValid, isTrue);
      expect(result.type, WaveType.corrective);
    });

    test('WaveSegment properties', () {
      const seg = WaveSegment(
        label: '1',
        startIndex: 0,
        endIndex: 10,
        startPrice: 100,
        endPrice: 120,
      );
      expect(seg.priceChange, 20);
      expect(seg.isUpWave, isTrue);
    });
  });
}
