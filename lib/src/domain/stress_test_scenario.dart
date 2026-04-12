import 'package:equatable/equatable.dart';

/// Parameterised stress-test scenario definition (S519).
class StressTestScenario extends Equatable {
  const StressTestScenario({
    required this.scenarioId,
    required this.scenarioName,
    required this.equityShockPercent,
    required this.rateShockBps,
    required this.volatilityMultiplier,
    this.description = '',
    this.isHistorical = false,
  });

  final String scenarioId;
  final String scenarioName;

  /// Instantaneous equity market shock in % (negative = drop).
  final double equityShockPercent;

  /// Interest rate shock in basis points.
  final int rateShockBps;

  /// Volatility scaling multiplier (e.g. 2.0 = double vol).
  final double volatilityMultiplier;
  final String description;

  /// True for historical replay scenarios (e.g. 2008 crisis).
  final bool isHistorical;

  bool get isSevere => equityShockPercent <= -20;
  bool get isHighVolatility => volatilityMultiplier >= 2.0;
  bool get hasDescription => description.isNotEmpty;

  @override
  List<Object?> get props => [
    scenarioId,
    scenarioName,
    equityShockPercent,
    rateShockBps,
    volatilityMultiplier,
    description,
    isHistorical,
  ];
}
