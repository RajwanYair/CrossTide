import 'package:cross_tide/src/domain/ml_feature_vector.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('MlFeatureVector', () {
    test('equality', () {
      const a = MlFeatureVector(
        ticker: 'AAPL',
        featureName: 'rsi_14',
        rawValue: 64.5,
        normalizedValue: 0.71,
        normalizationMethod: FeatureNormalizationMethod.minMax,
      );
      const b = MlFeatureVector(
        ticker: 'AAPL',
        featureName: 'rsi_14',
        rawValue: 64.5,
        normalizedValue: 0.71,
        normalizationMethod: FeatureNormalizationMethod.minMax,
      );
      expect(a, b);
    });

    test('copyWith changes normalizedValue', () {
      const base = MlFeatureVector(
        ticker: 'AAPL',
        featureName: 'rsi_14',
        rawValue: 64.5,
        normalizedValue: 0.71,
        normalizationMethod: FeatureNormalizationMethod.minMax,
      );
      final updated = base.copyWith(normalizedValue: 0.75);
      expect(updated.normalizedValue, 0.75);
    });

    test('props length is 5', () {
      const obj = MlFeatureVector(
        ticker: 'AAPL',
        featureName: 'rsi_14',
        rawValue: 64.5,
        normalizedValue: 0.71,
        normalizationMethod: FeatureNormalizationMethod.minMax,
      );
      expect(obj.props.length, 5);
    });
  });
}
