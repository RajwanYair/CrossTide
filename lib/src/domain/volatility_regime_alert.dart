import 'package:equatable/equatable.dart';

/// Volatility regime transition type.
enum VolatilityRegimeTransition {
  /// Volatility spiked from low to high.
  lowToHigh,

  /// Volatility settled from high to low.
  highToLow,

  /// Volatility entered an extreme (crisis) level.
  enteringCrisis,

  /// Volatility recovered below crisis threshold.
  exitingCrisis,
}

/// An alert triggered when the volatility regime for a ticker
/// transitions, signalling a change in risk environment.
class VolatilityRegimeAlert extends Equatable {
  const VolatilityRegimeAlert({
    required this.ticker,
    required this.transition,
    required this.previousHvPercent,
    required this.currentHvPercent,
    required this.hvThresholdPercent,
    required this.triggeredAt,
    this.affectsConsensus = false,
  });

  final String ticker;
  final VolatilityRegimeTransition transition;

  /// Historical volatility before the regime change.
  final double previousHvPercent;

  /// Historical volatility that triggered the alert.
  final double currentHvPercent;

  /// Threshold that separates low/high volatility regimes.
  final double hvThresholdPercent;

  final DateTime triggeredAt;

  /// `true` when this alert influences consensus signal evaluation.
  final bool affectsConsensus;

  VolatilityRegimeAlert copyWith({
    String? ticker,
    VolatilityRegimeTransition? transition,
    double? previousHvPercent,
    double? currentHvPercent,
    double? hvThresholdPercent,
    DateTime? triggeredAt,
    bool? affectsConsensus,
  }) => VolatilityRegimeAlert(
    ticker: ticker ?? this.ticker,
    transition: transition ?? this.transition,
    previousHvPercent: previousHvPercent ?? this.previousHvPercent,
    currentHvPercent: currentHvPercent ?? this.currentHvPercent,
    hvThresholdPercent: hvThresholdPercent ?? this.hvThresholdPercent,
    triggeredAt: triggeredAt ?? this.triggeredAt,
    affectsConsensus: affectsConsensus ?? this.affectsConsensus,
  );

  @override
  List<Object?> get props => [
    ticker,
    transition,
    previousHvPercent,
    currentHvPercent,
    hvThresholdPercent,
    triggeredAt,
    affectsConsensus,
  ];
}
