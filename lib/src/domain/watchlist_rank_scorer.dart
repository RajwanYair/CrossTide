/// Watchlist Rank Scorer — composite ranking of watchlist tickers
/// across multiple dimensions (technical, fundamental, momentum).
library;

import 'package:equatable/equatable.dart';

/// Per-ticker ranking result.
class TickerRank extends Equatable {
  const TickerRank({
    required this.ticker,
    required this.rank,
    required this.compositeScore,
    required this.technicalScore,
    required this.momentumScore,
    required this.riskScore,
  });

  final String ticker;

  /// Overall rank (1 = best).
  final int rank;

  /// Composite score (0–100).
  final double compositeScore;

  /// Technical sub-score (0–100).
  final double technicalScore;

  /// Momentum sub-score (0–100).
  final double momentumScore;

  /// Risk sub-score (0–100, higher = less risky).
  final double riskScore;

  @override
  List<Object?> get props => [
    ticker,
    rank,
    compositeScore,
    technicalScore,
    momentumScore,
    riskScore,
  ];
}

/// Input metrics for ranking.
class TickerRankInput extends Equatable {
  const TickerRankInput({
    required this.ticker,
    required this.smaDistancePct,
    required this.rsi,
    required this.trendScore,
    required this.volatility,
  });

  final String ticker;

  /// Distance from SMA200 as percentage (positive = above).
  final double smaDistancePct;

  /// RSI value (0–100).
  final double rsi;

  /// Trend strength score (0–100).
  final double trendScore;

  /// Annualized volatility (lower is better for risk).
  final double volatility;

  @override
  List<Object?> get props => [
    ticker,
    smaDistancePct,
    rsi,
    trendScore,
    volatility,
  ];
}

/// Ranks tickers by composite score.
class WatchlistRankScorer {
  const WatchlistRankScorer({
    this.technicalWeight = 0.4,
    this.momentumWeight = 0.3,
    this.riskWeight = 0.3,
  });

  final double technicalWeight;
  final double momentumWeight;
  final double riskWeight;

  /// Rank all tickers.
  List<TickerRank> rank(List<TickerRankInput> inputs) {
    if (inputs.isEmpty) return [];

    final scored = <_ScoredTicker>[];
    for (final TickerRankInput input in inputs) {
      final tech = _technicalScore(input);
      final momentum = _momentumScore(input);
      final risk = _riskScore(input);
      final composite =
          tech * technicalWeight +
          momentum * momentumWeight +
          risk * riskWeight;
      scored.add(
        _ScoredTicker(
          ticker: input.ticker,
          composite: composite,
          technical: tech,
          momentum: momentum,
          risk: risk,
        ),
      );
    }

    scored.sort(
      (_ScoredTicker a, _ScoredTicker b) => b.composite.compareTo(a.composite),
    );

    return [
      for (int i = 0; i < scored.length; i++)
        TickerRank(
          ticker: scored[i].ticker,
          rank: i + 1,
          compositeScore: scored[i].composite,
          technicalScore: scored[i].technical,
          momentumScore: scored[i].momentum,
          riskScore: scored[i].risk,
        ),
    ];
  }

  double _technicalScore(TickerRankInput input) {
    // Closer to SMA200 from above is better (0-10% ideal)
    final dist = input.smaDistancePct.clamp(-50.0, 50.0);
    if (dist >= 0 && dist <= 10) return 100.0;
    if (dist > 10) return (100 - (dist - 10) * 2).clamp(0.0, 100.0);
    return (100 + dist * 2).clamp(0.0, 100.0);
  }

  double _momentumScore(TickerRankInput input) {
    // Combine RSI positioning and trend strength
    final rsiScore = input.rsi > 70
        ? (100 - (input.rsi - 70) * 3).clamp(0.0, 100.0)
        : input.rsi < 30
        ? (input.rsi * 3).clamp(0.0, 100.0)
        : (50 + (input.rsi - 50)).clamp(0.0, 100.0);
    return (rsiScore * 0.5 + input.trendScore * 0.5).clamp(0.0, 100.0);
  }

  double _riskScore(TickerRankInput input) {
    // Lower volatility = higher score (inverse)
    final vol = input.volatility.clamp(0.0, 1.0);
    return ((1 - vol) * 100).clamp(0.0, 100.0);
  }
}

class _ScoredTicker {
  const _ScoredTicker({
    required this.ticker,
    required this.composite,
    required this.technical,
    required this.momentum,
    required this.risk,
  });

  final String ticker;
  final double composite;
  final double technical;
  final double momentum;
  final double risk;
}
