import 'package:cross_tide/src/domain/sector_rotation_signal.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('SectorRotationSignal', () {
    test('equality', () {
      final a = SectorRotationSignal(
        sectorName: 'Technology',
        direction: SectorRotationDirection.inflow,
        relativeStrength: 1.15,
        momentumScore: 0.6,
        lookbackDays: 90,
        detectedAt: DateTime(2025, 11, 1),
      );
      final b = SectorRotationSignal(
        sectorName: 'Technology',
        direction: SectorRotationDirection.inflow,
        relativeStrength: 1.15,
        momentumScore: 0.6,
        lookbackDays: 90,
        detectedAt: DateTime(2025, 11, 1),
      );
      expect(a, b);
    });

    test('copyWith changes momentumScore', () {
      final base = SectorRotationSignal(
        sectorName: 'Technology',
        direction: SectorRotationDirection.inflow,
        relativeStrength: 1.15,
        momentumScore: 0.6,
        lookbackDays: 90,
        detectedAt: DateTime(2025, 11, 1),
      );
      final updated = base.copyWith(momentumScore: 0.7);
      expect(updated.momentumScore, 0.7);
    });

    test('props length is 8', () {
      final obj = SectorRotationSignal(
        sectorName: 'Technology',
        direction: SectorRotationDirection.inflow,
        relativeStrength: 1.15,
        momentumScore: 0.6,
        lookbackDays: 90,
        detectedAt: DateTime(2025, 11, 1),
      );
      expect(obj.props.length, 8);
    });
  });
}
