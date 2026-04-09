/// Leaderboard Entry — opt-in public leaderboard for signal performance.
library;

import 'package:equatable/equatable.dart';

/// Aggregation window for leaderboard ranking.
enum LeaderboardPeriod {
  /// Rolling 7-day window.
  weekly,

  /// Rolling 30-day window.
  monthly,

  /// Rolling 90-day window.
  quarterly,

  /// All-time since account creation.
  allTime,
}

/// Type of achievement the leaderboard tracks.
enum LeaderboardMetric {
  /// Most consensus signals correctly called (price moved in signal direction).
  signalAccuracy,

  /// Most unique consensus signals fired.
  signalCount,

  /// Highest cumulative % gain from all consensus BUY signals.
  cumulativeReturn,

  /// Longest winning streak of correct signals.
  winStreak,
}

/// A single opt-in leaderboard entry for one user in one period.
class LeaderboardEntry extends Equatable {
  const LeaderboardEntry({
    required this.pseudonym,
    required this.metric,
    required this.period,
    required this.rank,
    required this.score,
    required this.signalCount,
    required this.updatedAt,
  }) : assert(rank >= 1, 'rank must be >= 1');

  /// Opt-in display name (never exposes real identity).
  final String pseudonym;

  final LeaderboardMetric metric;
  final LeaderboardPeriod period;

  /// Current rank on this leaderboard (1-based).
  final int rank;

  /// Numeric score for [metric] (e.g. accuracy % or cumulative return).
  final double score;

  /// Total consensus signals contributed to the score.
  final int signalCount;

  final DateTime updatedAt;

  /// True when this entry holds the top position.
  bool get isTopRanked => rank == 1;

  @override
  List<Object?> get props =>
      [pseudonym, metric, period, rank, score, signalCount, updatedAt];
}

/// Computes a sorted leaderboard from a list of raw entries.
class LeaderboardRanker {
  const LeaderboardRanker();

  /// Rank [entries] by descending [score], assigning 1-based ranks.
  ///
  /// Ties receive the same rank; the next entry gets the non-consecutive rank.
  List<LeaderboardEntry> rank(List<LeaderboardEntry> entries) {
    if (entries.isEmpty) return const [];
    final sorted = [...entries]
      ..sort((a, b) => b.score.compareTo(a.score));

    final ranked = <LeaderboardEntry>[];
    int currentRank = 1;
    for (int i = 0; i < sorted.length; i++) {
      if (i > 0 && sorted[i].score < sorted[i - 1].score) {
        currentRank = i + 1;
      }
      ranked.add(LeaderboardEntry(
        pseudonym: sorted[i].pseudonym,
        metric: sorted[i].metric,
        period: sorted[i].period,
        rank: currentRank,
        score: sorted[i].score,
        signalCount: sorted[i].signalCount,
        updatedAt: sorted[i].updatedAt,
      ));
    }
    return ranked;
  }
}
