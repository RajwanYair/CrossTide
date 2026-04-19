import 'package:equatable/equatable.dart';

/// ML feature vector — normalized input feature for a machine-learning model.
enum FeatureNormalizationMethod { zScore, minMax, robust, none }

class MlFeatureVector extends Equatable {
  const MlFeatureVector({
    required this.ticker,
    required this.featureName,
    required this.rawValue,
    required this.normalizedValue,
    required this.normalizationMethod,
  });

  final String ticker;
  final String featureName;
  final double rawValue;
  final double normalizedValue;
  final FeatureNormalizationMethod normalizationMethod;

  MlFeatureVector copyWith({
    String? ticker,
    String? featureName,
    double? rawValue,
    double? normalizedValue,
    FeatureNormalizationMethod? normalizationMethod,
  }) => MlFeatureVector(
    ticker: ticker ?? this.ticker,
    featureName: featureName ?? this.featureName,
    rawValue: rawValue ?? this.rawValue,
    normalizedValue: normalizedValue ?? this.normalizedValue,
    normalizationMethod: normalizationMethod ?? this.normalizationMethod,
  );

  @override
  List<Object?> get props => [
    ticker,
    featureName,
    rawValue,
    normalizedValue,
    normalizationMethod,
  ];
}
