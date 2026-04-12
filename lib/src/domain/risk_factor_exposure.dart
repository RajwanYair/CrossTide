import 'package:equatable/equatable.dart';

/// Portfolio exposure to a named risk factor (S520).
class RiskFactorExposure extends Equatable {
  const RiskFactorExposure({
    required this.portfolioId,
    required this.factorName,
    required this.betaCoefficient,
    required this.contributionPercent,
    this.isHedged = false,
  });

  final String portfolioId;

  /// Factor name, e.g. 'market', 'value', 'momentum', 'size'.
  final String factorName;

  /// Factor beta (sensitivity coefficient).
  final double betaCoefficient;

  /// Percentage of total portfolio risk explained by this factor.
  final double contributionPercent;
  final bool isHedged;

  bool get isDominantFactor => contributionPercent >= 30;
  bool get isHighBeta => betaCoefficient.abs() >= 1.5;
  bool get isNegativeExposure => betaCoefficient < 0;

  @override
  List<Object?> get props => [
    portfolioId,
    factorName,
    betaCoefficient,
    contributionPercent,
    isHedged,
  ];
}
