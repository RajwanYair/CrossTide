import 'package:equatable/equatable.dart';

/// Credit risk score for a trading counterparty (S524).
enum CounterpartyRiskGrade { aaa, aa, a, bbb, bb, b, ccc, defaulted }

/// Counterparty credit risk assessment (S524).
class CounterpartyRiskScore extends Equatable {
  const CounterpartyRiskScore({
    required this.counterpartyId,
    required this.counterpartyName,
    required this.grade,
    required this.probabilityOfDefaultPercent,
    required this.exposureUsd,
    required this.assessedAtMs,
  });

  final String counterpartyId;
  final String counterpartyName;
  final CounterpartyRiskGrade grade;

  /// One-year probability of default (0–100).
  final double probabilityOfDefaultPercent;

  /// Current net exposure to this counterparty in USD.
  final double exposureUsd;

  /// Epoch milliseconds when this assessment was performed.
  final int assessedAtMs;

  bool get isInvestmentGrade =>
      grade == CounterpartyRiskGrade.aaa ||
      grade == CounterpartyRiskGrade.aa ||
      grade == CounterpartyRiskGrade.a ||
      grade == CounterpartyRiskGrade.bbb;
  bool get isHighRisk => probabilityOfDefaultPercent >= 5;
  bool get hasLargeExposure => exposureUsd >= 1000000;

  @override
  List<Object?> get props => [
    counterpartyId,
    counterpartyName,
    grade,
    probabilityOfDefaultPercent,
    exposureUsd,
    assessedAtMs,
  ];
}
