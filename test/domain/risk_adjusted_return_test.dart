import 'package:cross_tide/src/domain/risk_adjusted_return.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('RiskAdjustedReturn', () {
    test('equality', () {
      const a = RiskAdjustedReturn(
        ticker: 'AAPL',
        method: ReturnAdjustmentMethod.sharpe,
        returnPercent: 12.5,
        riskMetric: 8.0,
        adjustedScore: 1.56,
      );
      const b = RiskAdjustedReturn(
        ticker: 'AAPL',
        method: ReturnAdjustmentMethod.sharpe,
        returnPercent: 12.5,
        riskMetric: 8.0,
        adjustedScore: 1.56,
      );
      expect(a, b);
    });

    test('copyWith changes adjustedScore', () {
      const base = RiskAdjustedReturn(
        ticker: 'AAPL',
        method: ReturnAdjustmentMethod.sharpe,
        returnPercent: 12.5,
        riskMetric: 8.0,
        adjustedScore: 1.56,
      );
      final updated = base.copyWith(adjustedScore: 2.0);
      expect(updated.adjustedScore, 2.0);
    });

    test('props length is 5', () {
      const obj = RiskAdjustedReturn(
        ticker: 'AAPL',
        method: ReturnAdjustmentMethod.sharpe,
        returnPercent: 12.5,
        riskMetric: 8.0,
        adjustedScore: 1.56,
      );
      expect(obj.props.length, 5);
    });
  });
}
