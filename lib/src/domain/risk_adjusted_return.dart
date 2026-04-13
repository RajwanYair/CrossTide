import 'package:equatable/equatable.dart';

/// Risk-adjusted return — Sharpe/Sortino/Calmar blend score.
enum ReturnAdjustmentMethod { sharpe, sortino, calmar, omega, treynor }

class RiskAdjustedReturn extends Equatable {
  const RiskAdjustedReturn({
    required this.ticker,
    required this.method,
    required this.returnPercent,
    required this.riskMetric,
    required this.adjustedScore,
  });

  final String ticker;
  final ReturnAdjustmentMethod method;
  final double returnPercent;
  final double riskMetric;
  final double adjustedScore;

  RiskAdjustedReturn copyWith({
    String? ticker,
    ReturnAdjustmentMethod? method,
    double? returnPercent,
    double? riskMetric,
    double? adjustedScore,
  }) => RiskAdjustedReturn(
    ticker: ticker ?? this.ticker,
    method: method ?? this.method,
    returnPercent: returnPercent ?? this.returnPercent,
    riskMetric: riskMetric ?? this.riskMetric,
    adjustedScore: adjustedScore ?? this.adjustedScore,
  );

  @override
  List<Object?> get props => [
    ticker,
    method,
    returnPercent,
    riskMetric,
    adjustedScore,
  ];
}
