import 'package:equatable/equatable.dart';

/// Composite liquidity rating classification.
enum LiquidityRatingGrade { high, moderate, low, illiquid }

/// A composite market liquidity rating for a ticker, derived from
/// spread, depth, volume and turnover metrics.
class MarketLiquidityRating extends Equatable {
  const MarketLiquidityRating({
    required this.ticker,
    required this.grade,
    required this.compositeScore,
    required this.averageDailyVolumeM,
    required this.bidAskSpreadBps,
    required this.amihudRatio,
    required this.calculatedAt,
  });

  final String ticker;
  final LiquidityRatingGrade grade;

  /// Composite liquidity score (0–100).
  final double compositeScore;

  /// Average daily volume in millions of USD.
  final double averageDailyVolumeM;

  /// Time-weighted average bid–ask spread in basis points.
  final double bidAskSpreadBps;

  /// Amihud illiquidity ratio (lower = more liquid).
  final double amihudRatio;

  final DateTime calculatedAt;

  MarketLiquidityRating copyWith({
    String? ticker,
    LiquidityRatingGrade? grade,
    double? compositeScore,
    double? averageDailyVolumeM,
    double? bidAskSpreadBps,
    double? amihudRatio,
    DateTime? calculatedAt,
  }) => MarketLiquidityRating(
    ticker: ticker ?? this.ticker,
    grade: grade ?? this.grade,
    compositeScore: compositeScore ?? this.compositeScore,
    averageDailyVolumeM: averageDailyVolumeM ?? this.averageDailyVolumeM,
    bidAskSpreadBps: bidAskSpreadBps ?? this.bidAskSpreadBps,
    amihudRatio: amihudRatio ?? this.amihudRatio,
    calculatedAt: calculatedAt ?? this.calculatedAt,
  );

  @override
  List<Object?> get props => [
    ticker,
    grade,
    compositeScore,
    averageDailyVolumeM,
    bidAskSpreadBps,
    amihudRatio,
    calculatedAt,
  ];
}
