import 'package:equatable/equatable.dart';

/// Type of stock split event.
enum StockSplitType {
  /// Forward split: shares increase, price decreases.
  forward,

  /// Reverse split: shares decrease, price increases.
  reverse,
}

/// A stock split or reverse-split corporate event.
class StockSplitEvent extends Equatable {
  const StockSplitEvent({
    required this.ticker,
    required this.splitType,
    required this.numerator,
    required this.denominator,
    required this.exDate,
    required this.announcedAt,
    this.adjustmentFactor,
  });

  final String ticker;
  final StockSplitType splitType;

  /// Split ratio numerator (new shares).
  final int numerator;

  /// Split ratio denominator (old shares).
  final int denominator;

  /// Ex-split date (price adjusts on market open).
  final DateTime exDate;

  final DateTime announcedAt;

  /// Price/share-count adjustment factor (numerator / denominator).
  final double? adjustmentFactor;

  StockSplitEvent copyWith({
    String? ticker,
    StockSplitType? splitType,
    int? numerator,
    int? denominator,
    DateTime? exDate,
    DateTime? announcedAt,
    double? adjustmentFactor,
  }) => StockSplitEvent(
    ticker: ticker ?? this.ticker,
    splitType: splitType ?? this.splitType,
    numerator: numerator ?? this.numerator,
    denominator: denominator ?? this.denominator,
    exDate: exDate ?? this.exDate,
    announcedAt: announcedAt ?? this.announcedAt,
    adjustmentFactor: adjustmentFactor ?? this.adjustmentFactor,
  );

  @override
  List<Object?> get props => [
    ticker,
    splitType,
    numerator,
    denominator,
    exDate,
    announcedAt,
    adjustmentFactor,
  ];
}
