import 'package:cross_tide/src/domain/backtest_regime_filter.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('BacktestRegimeFilter', () {
    test('equality', () {
      const a = BacktestRegimeFilter(
        filterId: 'rf-1',
        filterMode: RegimeFilterMode.bullOnly,
        minConfidence: 0.7,
        excludeTransitions: true,
        isEnabled: true,
      );
      const b = BacktestRegimeFilter(
        filterId: 'rf-1',
        filterMode: RegimeFilterMode.bullOnly,
        minConfidence: 0.7,
        excludeTransitions: true,
        isEnabled: true,
      );
      expect(a, b);
    });

    test('copyWith changes minConfidence', () {
      const base = BacktestRegimeFilter(
        filterId: 'rf-1',
        filterMode: RegimeFilterMode.bullOnly,
        minConfidence: 0.7,
        excludeTransitions: true,
        isEnabled: true,
      );
      final updated = base.copyWith(minConfidence: 0.8);
      expect(updated.minConfidence, 0.8);
    });

    test('props length is 5', () {
      const obj = BacktestRegimeFilter(
        filterId: 'rf-1',
        filterMode: RegimeFilterMode.bullOnly,
        minConfidence: 0.7,
        excludeTransitions: true,
        isEnabled: true,
      );
      expect(obj.props.length, 5);
    });
  });
}
