import 'package:equatable/equatable.dart';

/// Concentration risk alert when a holding exceeds threshold (S523).
class ConcentrationRiskAlert extends Equatable {
  const ConcentrationRiskAlert({
    required this.alertId,
    required this.portfolioId,
    required this.ticker,
    required this.holdingWeightPercent,
    required this.thresholdPercent,
    required this.triggeredAtMs,
    this.isActive = true,
  });

  final String alertId;
  final String portfolioId;
  final String ticker;

  /// Current weight of the holding in the portfolio (0–100).
  final double holdingWeightPercent;

  /// Threshold that was breached.
  final double thresholdPercent;

  /// Epoch milliseconds when the alert was triggered.
  final int triggeredAtMs;
  final bool isActive;

  double get excessWeightPercent => holdingWeightPercent - thresholdPercent;
  bool get isSevere => excessWeightPercent >= 10;
  bool get requiresRebalancing => isActive && excessWeightPercent >= 5;

  @override
  List<Object?> get props => [
    alertId,
    portfolioId,
    ticker,
    holdingWeightPercent,
    thresholdPercent,
    triggeredAtMs,
    isActive,
  ];
}
