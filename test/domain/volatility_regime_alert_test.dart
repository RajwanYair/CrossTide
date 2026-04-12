import 'package:cross_tide/src/domain/volatility_regime_alert.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('VolatilityRegimeAlert', () {
    test('equality', () {
      final a = VolatilityRegimeAlert(
        ticker: 'SPY',
        transition: VolatilityRegimeTransition.lowToHigh,
        previousHvPercent: 12.0,
        currentHvPercent: 28.0,
        hvThresholdPercent: 20.0,
        triggeredAt: DateTime(2025, 4, 1),
      );
      final b = VolatilityRegimeAlert(
        ticker: 'SPY',
        transition: VolatilityRegimeTransition.lowToHigh,
        previousHvPercent: 12.0,
        currentHvPercent: 28.0,
        hvThresholdPercent: 20.0,
        triggeredAt: DateTime(2025, 4, 1),
      );
      expect(a, b);
    });

    test('copyWith changes previousHvPercent', () {
      final base = VolatilityRegimeAlert(
        ticker: 'SPY',
        transition: VolatilityRegimeTransition.lowToHigh,
        previousHvPercent: 12.0,
        currentHvPercent: 28.0,
        hvThresholdPercent: 20.0,
        triggeredAt: DateTime(2025, 4, 1),
      );
      final updated = base.copyWith(previousHvPercent: 11.0);
      expect(updated.previousHvPercent, 11.0);
    });

    test('props length is 7', () {
      final obj = VolatilityRegimeAlert(
        ticker: 'SPY',
        transition: VolatilityRegimeTransition.lowToHigh,
        previousHvPercent: 12.0,
        currentHvPercent: 28.0,
        hvThresholdPercent: 20.0,
        triggeredAt: DateTime(2025, 4, 1),
      );
      expect(obj.props.length, 7);
    });
  });
}
