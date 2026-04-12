import 'package:equatable/equatable.dart';

/// Ownership change direction for institutional 13F filings.
enum OwnershipChangeDirection { increased, decreased, newPosition, closedOut }

/// A quarterly change in institutional ownership as reported in a 13F filing.
class InstitutionalOwnershipEntry extends Equatable {
  const InstitutionalOwnershipEntry({
    required this.ticker,
    required this.institutionName,
    required this.changeDirection,
    required this.currentShares,
    required this.reportQuarter,
    this.previousShares,
    this.changeShares,
    this.portfolioWeightPercent,
  });

  final String ticker;
  final String institutionName;
  final OwnershipChangeDirection changeDirection;

  /// Total shares held in this reporting period.
  final int currentShares;

  /// Report period in "YYYY-QN" format (e.g. "2025-Q1").
  final String reportQuarter;

  final int? previousShares;
  final int? changeShares;

  /// This position as a percentage of the institution's total portfolio.
  final double? portfolioWeightPercent;

  InstitutionalOwnershipEntry copyWith({
    String? ticker,
    String? institutionName,
    OwnershipChangeDirection? changeDirection,
    int? currentShares,
    String? reportQuarter,
    int? previousShares,
    int? changeShares,
    double? portfolioWeightPercent,
  }) => InstitutionalOwnershipEntry(
    ticker: ticker ?? this.ticker,
    institutionName: institutionName ?? this.institutionName,
    changeDirection: changeDirection ?? this.changeDirection,
    currentShares: currentShares ?? this.currentShares,
    reportQuarter: reportQuarter ?? this.reportQuarter,
    previousShares: previousShares ?? this.previousShares,
    changeShares: changeShares ?? this.changeShares,
    portfolioWeightPercent:
        portfolioWeightPercent ?? this.portfolioWeightPercent,
  );

  @override
  List<Object?> get props => [
    ticker,
    institutionName,
    changeDirection,
    currentShares,
    reportQuarter,
    previousShares,
    changeShares,
    portfolioWeightPercent,
  ];
}
