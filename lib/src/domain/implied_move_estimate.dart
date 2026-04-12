import 'package:equatable/equatable.dart';

/// The options market's implied move estimate for an upcoming event
/// (typically an earnings announcement), derived from straddle pricing.
class ImpliedMoveEstimate extends Equatable {
  const ImpliedMoveEstimate({
    required this.ticker,
    required this.eventDate,
    required this.impliedMovePercent,
    required this.upperPriceTarget,
    required this.lowerPriceTarget,
    required this.currentPrice,
    required this.calculatedAt,
    this.historicalAverageMovePercent,
  });

  final String ticker;

  /// The catalyst event date (e.g. earnings release).
  final DateTime eventDate;

  /// Expected ± move expressed as a percentage of current price.
  final double impliedMovePercent;

  /// Current price + implied move.
  final double upperPriceTarget;

  /// Current price − implied move.
  final double lowerPriceTarget;

  final double currentPrice;
  final DateTime calculatedAt;

  /// Historical average absolute move on earnings days.
  final double? historicalAverageMovePercent;

  ImpliedMoveEstimate copyWith({
    String? ticker,
    DateTime? eventDate,
    double? impliedMovePercent,
    double? upperPriceTarget,
    double? lowerPriceTarget,
    double? currentPrice,
    DateTime? calculatedAt,
    double? historicalAverageMovePercent,
  }) => ImpliedMoveEstimate(
    ticker: ticker ?? this.ticker,
    eventDate: eventDate ?? this.eventDate,
    impliedMovePercent: impliedMovePercent ?? this.impliedMovePercent,
    upperPriceTarget: upperPriceTarget ?? this.upperPriceTarget,
    lowerPriceTarget: lowerPriceTarget ?? this.lowerPriceTarget,
    currentPrice: currentPrice ?? this.currentPrice,
    calculatedAt: calculatedAt ?? this.calculatedAt,
    historicalAverageMovePercent:
        historicalAverageMovePercent ?? this.historicalAverageMovePercent,
  );

  @override
  List<Object?> get props => [
    ticker,
    eventDate,
    impliedMovePercent,
    upperPriceTarget,
    lowerPriceTarget,
    currentPrice,
    calculatedAt,
    historicalAverageMovePercent,
  ];
}
