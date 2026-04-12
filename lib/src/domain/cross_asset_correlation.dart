import 'package:equatable/equatable.dart';

/// Asset class for cross-asset correlation analysis.
enum CorrelationAssetClass { equity, bond, commodity, currency, crypto }

/// A pairwise correlation coefficient between two assets across classes.
class CrossAssetCorrelation extends Equatable {
  const CrossAssetCorrelation({
    required this.assetA,
    required this.assetAClass,
    required this.assetB,
    required this.assetBClass,
    required this.correlationCoefficient,
    required this.lookbackDays,
    required this.calculatedAt,
  });

  final String assetA;
  final CorrelationAssetClass assetAClass;
  final String assetB;
  final CorrelationAssetClass assetBClass;

  /// Pearson correlation coefficient (−1.0 to +1.0).
  final double correlationCoefficient;

  /// Rolling window used for calculation.
  final int lookbackDays;

  final DateTime calculatedAt;

  CrossAssetCorrelation copyWith({
    String? assetA,
    CorrelationAssetClass? assetAClass,
    String? assetB,
    CorrelationAssetClass? assetBClass,
    double? correlationCoefficient,
    int? lookbackDays,
    DateTime? calculatedAt,
  }) => CrossAssetCorrelation(
    assetA: assetA ?? this.assetA,
    assetAClass: assetAClass ?? this.assetAClass,
    assetB: assetB ?? this.assetB,
    assetBClass: assetBClass ?? this.assetBClass,
    correlationCoefficient:
        correlationCoefficient ?? this.correlationCoefficient,
    lookbackDays: lookbackDays ?? this.lookbackDays,
    calculatedAt: calculatedAt ?? this.calculatedAt,
  );

  @override
  List<Object?> get props => [
    assetA,
    assetAClass,
    assetB,
    assetBClass,
    correlationCoefficient,
    lookbackDays,
    calculatedAt,
  ];
}
