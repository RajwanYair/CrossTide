import 'package:equatable/equatable.dart';

/// Liquidity tier classification for a traded asset.
enum LiquidityTier {
  /// Highly liquid — tight spread, large average volume.
  high,

  /// Moderately liquid.
  medium,

  /// Low liquidity — wide spread, thin order book.
  low,

  /// Illiquid — rarely traded.
  illiquid,
}

/// Composite liquidity score for a single ticker.
class LiquidityScore extends Equatable {
  /// Creates a [LiquidityScore].
  const LiquidityScore({
    required this.ticker,
    required this.score,
    required this.tier,
    required this.averageDailyVolume,
    required this.averageSpreadBps,
  });

  /// Ticker symbol.
  final String ticker;

  /// Composite liquidity score [0.0, 100.0]; higher = more liquid.
  final double score;

  /// Tier classification derived from the score.
  final LiquidityTier tier;

  /// Average daily traded volume (shares or contracts).
  final int averageDailyVolume;

  /// Time-weighted average bid-ask spread in basis points.
  final double averageSpreadBps;

  /// Returns `true` when the ticker is considered liquid.
  bool get isLiquid =>
      tier == LiquidityTier.high || tier == LiquidityTier.medium;

  /// Returns `true` when the spread is very tight (≤ 5 bps).
  bool get isTightSpread => averageSpreadBps <= 5.0;

  @override
  List<Object?> get props => [
    ticker,
    score,
    tier,
    averageDailyVolume,
    averageSpreadBps,
  ];
}
