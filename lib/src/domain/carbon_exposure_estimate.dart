import 'package:equatable/equatable.dart';

/// Portfolio carbon footprint and scope exposure estimate (S530).
class CarbonExposureEstimate extends Equatable {
  const CarbonExposureEstimate({
    required this.portfolioId,
    required this.scope1TonneCo2e,
    required this.scope2TonneCo2e,
    required this.scope3TonneCo2e,
    required this.weightedAverageCarbonIntensity,
    required this.assessedAtMs,
  });

  final String portfolioId;

  /// Scope 1 direct emissions in tonne CO2-equivalent.
  final double scope1TonneCo2e;

  /// Scope 2 indirect (electricity) emissions.
  final double scope2TonneCo2e;

  /// Scope 3 value-chain emissions.
  final double scope3TonneCo2e;

  /// Weighted average carbon intensity (tonne CO2e per $1M revenue).
  final double weightedAverageCarbonIntensity;

  /// Epoch milliseconds when assessed.
  final int assessedAtMs;

  double get totalTonneCo2e =>
      scope1TonneCo2e + scope2TonneCo2e + scope3TonneCo2e;
  bool get isHighIntensity => weightedAverageCarbonIntensity >= 200;
  bool get isScope3Dominant =>
      scope3TonneCo2e > scope1TonneCo2e + scope2TonneCo2e;

  @override
  List<Object?> get props => [
    portfolioId,
    scope1TonneCo2e,
    scope2TonneCo2e,
    scope3TonneCo2e,
    weightedAverageCarbonIntensity,
    assessedAtMs,
  ];
}
