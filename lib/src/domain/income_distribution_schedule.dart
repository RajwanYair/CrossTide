import 'package:equatable/equatable.dart';

/// Income distribution schedule — projected dividend + interest income.
enum IncomeFrequency { monthly, quarterly, semiAnnual, annual, irregular }

class IncomeDistributionSchedule extends Equatable {
  const IncomeDistributionSchedule({
    required this.ticker,
    required this.annualIncomeUsd,
    required this.frequency,
    required this.nextPaymentDate,
    required this.yieldPercent,
  });

  final String ticker;
  final double annualIncomeUsd;
  final IncomeFrequency frequency;
  final String nextPaymentDate;
  final double yieldPercent;

  IncomeDistributionSchedule copyWith({
    String? ticker,
    double? annualIncomeUsd,
    IncomeFrequency? frequency,
    String? nextPaymentDate,
    double? yieldPercent,
  }) => IncomeDistributionSchedule(
    ticker: ticker ?? this.ticker,
    annualIncomeUsd: annualIncomeUsd ?? this.annualIncomeUsd,
    frequency: frequency ?? this.frequency,
    nextPaymentDate: nextPaymentDate ?? this.nextPaymentDate,
    yieldPercent: yieldPercent ?? this.yieldPercent,
  );

  @override
  List<Object?> get props => [
    ticker,
    annualIncomeUsd,
    frequency,
    nextPaymentDate,
    yieldPercent,
  ];
}
