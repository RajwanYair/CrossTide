import 'package:cross_tide/src/domain/market_impact_model.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('MarketImpactModel', () {
    test('equality', () {
      final a = MarketImpactModel(
        ticker: 'AAPL',
        modelType: MarketImpactModelType.squareRoot,
        orderSizeShares: 10000,
        averageDailyVolumeShares: 80000000,
        participationRatePercent: 2.0,
        estimatedImpactBps: 5.0,
        calculatedAt: DateTime(2025, 9, 1),
      );
      final b = MarketImpactModel(
        ticker: 'AAPL',
        modelType: MarketImpactModelType.squareRoot,
        orderSizeShares: 10000,
        averageDailyVolumeShares: 80000000,
        participationRatePercent: 2.0,
        estimatedImpactBps: 5.0,
        calculatedAt: DateTime(2025, 9, 1),
      );
      expect(a, b);
    });

    test('copyWith changes estimatedImpactBps', () {
      final base = MarketImpactModel(
        ticker: 'AAPL',
        modelType: MarketImpactModelType.squareRoot,
        orderSizeShares: 10000,
        averageDailyVolumeShares: 80000000,
        participationRatePercent: 2.0,
        estimatedImpactBps: 5.0,
        calculatedAt: DateTime(2025, 9, 1),
      );
      final updated = base.copyWith(estimatedImpactBps: 7.5);
      expect(updated.estimatedImpactBps, 7.5);
    });

    test('props length is 8', () {
      final obj = MarketImpactModel(
        ticker: 'AAPL',
        modelType: MarketImpactModelType.squareRoot,
        orderSizeShares: 10000,
        averageDailyVolumeShares: 80000000,
        participationRatePercent: 2.0,
        estimatedImpactBps: 5.0,
        calculatedAt: DateTime(2025, 9, 1),
      );
      expect(obj.props.length, 8);
    });
  });
}
