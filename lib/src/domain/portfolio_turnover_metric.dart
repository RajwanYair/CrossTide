import 'package:equatable/equatable.dart';

/// Annualised portfolio turnover metric.
class PortfolioTurnoverMetric extends Equatable {
  const PortfolioTurnoverMetric({
    required this.portfolioId,
    required this.annualisedTurnoverPercent,
    required this.totalBuyValueBase,
    required this.totalSellValueBase,
    required this.averageHoldingDays,
    required this.calculatedAt,
  });

  final String portfolioId;

  /// Annual turnover as a percentage of average portfolio value.
  final double annualisedTurnoverPercent;

  /// Sum of all buy transactions in base currency for the period.
  final double totalBuyValueBase;

  /// Sum of all sell transactions in base currency for the period.
  final double totalSellValueBase;

  /// Average holding period for positions closed in the period.
  final double averageHoldingDays;

  final DateTime calculatedAt;

  PortfolioTurnoverMetric copyWith({
    String? portfolioId,
    double? annualisedTurnoverPercent,
    double? totalBuyValueBase,
    double? totalSellValueBase,
    double? averageHoldingDays,
    DateTime? calculatedAt,
  }) => PortfolioTurnoverMetric(
    portfolioId: portfolioId ?? this.portfolioId,
    annualisedTurnoverPercent:
        annualisedTurnoverPercent ?? this.annualisedTurnoverPercent,
    totalBuyValueBase: totalBuyValueBase ?? this.totalBuyValueBase,
    totalSellValueBase: totalSellValueBase ?? this.totalSellValueBase,
    averageHoldingDays: averageHoldingDays ?? this.averageHoldingDays,
    calculatedAt: calculatedAt ?? this.calculatedAt,
  );

  @override
  List<Object?> get props => [
    portfolioId,
    annualisedTurnoverPercent,
    totalBuyValueBase,
    totalSellValueBase,
    averageHoldingDays,
    calculatedAt,
  ];
}
