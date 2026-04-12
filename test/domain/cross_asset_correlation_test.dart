import 'package:cross_tide/src/domain/cross_asset_correlation.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('CrossAssetCorrelation', () {
    test('equality', () {
      final a = CrossAssetCorrelation(
        assetA: 'SPY',
        assetAClass: CorrelationAssetClass.equity,
        assetB: 'TLT',
        assetBClass: CorrelationAssetClass.bond,
        correlationCoefficient: -0.45,
        lookbackDays: 252,
        calculatedAt: DateTime(2025, 8, 1),
      );
      final b = CrossAssetCorrelation(
        assetA: 'SPY',
        assetAClass: CorrelationAssetClass.equity,
        assetB: 'TLT',
        assetBClass: CorrelationAssetClass.bond,
        correlationCoefficient: -0.45,
        lookbackDays: 252,
        calculatedAt: DateTime(2025, 8, 1),
      );
      expect(a, b);
    });

    test('copyWith changes correlationCoefficient', () {
      final base = CrossAssetCorrelation(
        assetA: 'SPY',
        assetAClass: CorrelationAssetClass.equity,
        assetB: 'TLT',
        assetBClass: CorrelationAssetClass.bond,
        correlationCoefficient: -0.45,
        lookbackDays: 252,
        calculatedAt: DateTime(2025, 8, 1),
      );
      final updated = base.copyWith(correlationCoefficient: -0.50);
      expect(updated.correlationCoefficient, -0.50);
    });

    test('props length is 7', () {
      final obj = CrossAssetCorrelation(
        assetA: 'SPY',
        assetAClass: CorrelationAssetClass.equity,
        assetB: 'TLT',
        assetBClass: CorrelationAssetClass.bond,
        correlationCoefficient: -0.45,
        lookbackDays: 252,
        calculatedAt: DateTime(2025, 8, 1),
      );
      expect(obj.props.length, 7);
    });
  });
}
