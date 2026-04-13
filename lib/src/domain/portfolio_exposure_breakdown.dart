import 'package:equatable/equatable.dart';

/// Portfolio exposure breakdown — long/short/net by asset category.
enum ExposureCategory { equity, fixedIncome, commodity, crypto, cash, other }

class PortfolioExposureBreakdown extends Equatable {
  const PortfolioExposureBreakdown({
    required this.portfolioId,
    required this.category,
    required this.longPercent,
    required this.shortPercent,
    required this.netPercent,
  });

  final String portfolioId;
  final ExposureCategory category;
  final double longPercent;
  final double shortPercent;
  final double netPercent;

  PortfolioExposureBreakdown copyWith({
    String? portfolioId,
    ExposureCategory? category,
    double? longPercent,
    double? shortPercent,
    double? netPercent,
  }) => PortfolioExposureBreakdown(
    portfolioId: portfolioId ?? this.portfolioId,
    category: category ?? this.category,
    longPercent: longPercent ?? this.longPercent,
    shortPercent: shortPercent ?? this.shortPercent,
    netPercent: netPercent ?? this.netPercent,
  );

  @override
  List<Object?> get props => [
    portfolioId,
    category,
    longPercent,
    shortPercent,
    netPercent,
  ];
}
