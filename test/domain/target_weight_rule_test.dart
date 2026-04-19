import 'package:cross_tide/src/domain/target_weight_rule.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('TargetWeightRule', () {
    test('equality', () {
      const a = TargetWeightRule(
        ruleId: 'r-1',
        ticker: 'AAPL',
        targetWeightPct: 5.0,
        tolerancePct: 1.0,
        trigger: WeightAdjustmentTrigger.driftExceeded,
      );
      const b = TargetWeightRule(
        ruleId: 'r-1',
        ticker: 'AAPL',
        targetWeightPct: 5.0,
        tolerancePct: 1.0,
        trigger: WeightAdjustmentTrigger.driftExceeded,
      );
      expect(a, b);
    });

    test('copyWith changes targetWeightPct', () {
      const base = TargetWeightRule(
        ruleId: 'r-1',
        ticker: 'AAPL',
        targetWeightPct: 5.0,
        tolerancePct: 1.0,
        trigger: WeightAdjustmentTrigger.driftExceeded,
      );
      final updated = base.copyWith(targetWeightPct: 6.0);
      expect(updated.targetWeightPct, 6.0);
    });

    test('props length is 5', () {
      const obj = TargetWeightRule(
        ruleId: 'r-1',
        ticker: 'AAPL',
        targetWeightPct: 5.0,
        tolerancePct: 1.0,
        trigger: WeightAdjustmentTrigger.driftExceeded,
      );
      expect(obj.props.length, 5);
    });
  });
}
