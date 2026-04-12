import 'package:equatable/equatable.dart';

/// Analyst price-target consensus for a single ticker.
class PriceTargetConsensus extends Equatable {
  /// Creates a [PriceTargetConsensus].
  const PriceTargetConsensus({
    required this.ticker,
    required this.currentPrice,
    required this.targetMean,
    required this.targetHigh,
    required this.targetLow,
    required this.analystCount,
    required this.buyRatings,
    required this.holdRatings,
    required this.sellRatings,
  });

  /// Ticker symbol.
  final String ticker;

  /// Current market price.
  final double currentPrice;

  /// Mean analyst price target.
  final double targetMean;

  /// Highest individual price target.
  final double targetHigh;

  /// Lowest individual price target.
  final double targetLow;

  /// Total number of analyst ratings.
  final int analystCount;

  /// Number of Buy / Overweight ratings.
  final int buyRatings;

  /// Number of Hold / Neutral ratings.
  final int holdRatings;

  /// Number of Sell / Underweight ratings.
  final int sellRatings;

  /// Upside potential to mean target as a percentage.
  double get upsidePotential => currentPrice == 0.0
      ? 0.0
      : (targetMean - currentPrice) / currentPrice * 100;

  /// Returns `true` when the majority of ratings are Buy.
  bool get isBuyMajority => analystCount > 0 && buyRatings > analystCount ~/ 2;

  /// Returns `true` when the mean target is above the current price.
  bool get isAboveCurrentPrice => targetMean > currentPrice;

  @override
  List<Object?> get props => [
    ticker,
    currentPrice,
    targetMean,
    targetHigh,
    targetLow,
    analystCount,
    buyRatings,
    holdRatings,
    sellRatings,
  ];
}
