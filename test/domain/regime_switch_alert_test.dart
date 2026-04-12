import 'package:cross_tide/src/domain/regime_switch_alert.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('RegimeSwitchAlert', () {
    test('equality', () {
      final a = RegimeSwitchAlert(
        alertId: 'rsa1',
        previousRegime: 'Goldilocks',
        newRegime: 'Stagflation',
        confidencePercent: 82.0,
        triggeredAt: DateTime(2025, 7, 4),
      );
      final b = RegimeSwitchAlert(
        alertId: 'rsa1',
        previousRegime: 'Goldilocks',
        newRegime: 'Stagflation',
        confidencePercent: 82.0,
        triggeredAt: DateTime(2025, 7, 4),
      );
      expect(a, b);
    });

    test('copyWith changes confidencePercent', () {
      final base = RegimeSwitchAlert(
        alertId: 'rsa1',
        previousRegime: 'Goldilocks',
        newRegime: 'Stagflation',
        confidencePercent: 82.0,
        triggeredAt: DateTime(2025, 7, 4),
      );
      final updated = base.copyWith(confidencePercent: 90.0);
      expect(updated.confidencePercent, 90.0);
    });

    test('props length is 7', () {
      final obj = RegimeSwitchAlert(
        alertId: 'rsa1',
        previousRegime: 'Goldilocks',
        newRegime: 'Stagflation',
        confidencePercent: 82.0,
        triggeredAt: DateTime(2025, 7, 4),
      );
      expect(obj.props.length, 7);
    });
  });
}
