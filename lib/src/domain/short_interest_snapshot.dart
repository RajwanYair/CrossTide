import 'package:equatable/equatable.dart';

/// Point-in-time short interest data for a ticker.
class ShortInterestSnapshot extends Equatable {
  const ShortInterestSnapshot({
    required this.ticker,
    required this.shortInterestShares,
    required this.floatShares,
    required this.shortPercentFloat,
    required this.daysTocover,
    required this.reportDate,
    this.changeFromPriorPercent,
  });

  final String ticker;

  /// Number of shares currently sold short.
  final int shortInterestShares;

  /// Total float shares outstanding.
  final int floatShares;

  /// Short interest as a percentage of float.
  final double shortPercentFloat;

  /// Average daily volume divided into short interest (days to cover).
  final double daysTocover;

  /// Settlement date of this short interest report.
  final DateTime reportDate;

  /// Percentage change vs. prior reporting period (positive = increase).
  final double? changeFromPriorPercent;

  ShortInterestSnapshot copyWith({
    String? ticker,
    int? shortInterestShares,
    int? floatShares,
    double? shortPercentFloat,
    double? daysTocover,
    DateTime? reportDate,
    double? changeFromPriorPercent,
  }) => ShortInterestSnapshot(
    ticker: ticker ?? this.ticker,
    shortInterestShares: shortInterestShares ?? this.shortInterestShares,
    floatShares: floatShares ?? this.floatShares,
    shortPercentFloat: shortPercentFloat ?? this.shortPercentFloat,
    daysTocover: daysTocover ?? this.daysTocover,
    reportDate: reportDate ?? this.reportDate,
    changeFromPriorPercent:
        changeFromPriorPercent ?? this.changeFromPriorPercent,
  );

  @override
  List<Object?> get props => [
    ticker,
    shortInterestShares,
    floatShares,
    shortPercentFloat,
    daysTocover,
    reportDate,
    changeFromPriorPercent,
  ];
}
