/// Consensus History Entry — Pure domain logic.
///
/// Records a point-in-time consensus evaluation for display on a timeline chart.
/// Each entry captures the consensus state (BUY/SELL/NEUTRAL), how many methods
/// agreed, and the weighted confidence score.
library;

import 'package:equatable/equatable.dart';

/// Direction of a consensus evaluation.
enum ConsensusDirection { buy, sell, neutral }

/// A single entry in the consensus evaluation history for a ticker.
class ConsensusHistoryEntry extends Equatable {
  const ConsensusHistoryEntry({
    required this.ticker,
    required this.evaluatedAt,
    required this.direction,
    required this.methodCount,
    required this.totalMethods,
    required this.weightedScore,
    this.closePrice,
  });

  final String ticker;
  final DateTime evaluatedAt;
  final ConsensusDirection direction;

  /// Number of methods that agreed with the consensus direction.
  final int methodCount;

  /// Total number of methods evaluated.
  final int totalMethods;

  /// Weighted confidence score from [WeightedConsensusEngine], range [0, 1].
  final double weightedScore;

  /// Close price at the time of evaluation.
  final double? closePrice;

  /// Ratio of agreeing methods to total methods.
  double get agreementRatio =>
      totalMethods > 0 ? methodCount / totalMethods : 0;

  /// Whether this is a strong consensus (>= 60% agreement + weighted score >= 0.7).
  bool get isStrong => agreementRatio >= 0.6 && weightedScore >= 0.7;

  @override
  List<Object?> get props => [
    ticker,
    evaluatedAt,
    direction,
    methodCount,
    totalMethods,
    weightedScore,
    closePrice,
  ];
}

/// Builds consensus history from a series of entries.
class ConsensusHistoryBuilder {
  const ConsensusHistoryBuilder();

  /// Count consecutive entries in the same direction from the most recent.
  int currentStreak(List<ConsensusHistoryEntry> history) {
    if (history.isEmpty) return 0;

    final ConsensusDirection lastDir = history.last.direction;
    if (lastDir == ConsensusDirection.neutral) return 0;

    int streak = 0;
    for (int i = history.length - 1; i >= 0; i--) {
      if (history[i].direction == lastDir) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  }

  /// Find the most recent direction change in the history.
  ConsensusHistoryEntry? lastTransition(List<ConsensusHistoryEntry> history) {
    if (history.length < 2) return null;

    for (int i = history.length - 1; i >= 1; i--) {
      if (history[i].direction != history[i - 1].direction) {
        return history[i];
      }
    }
    return null;
  }

  /// Count how many times the consensus direction changed.
  int transitionCount(List<ConsensusHistoryEntry> history) {
    if (history.length < 2) return 0;

    int count = 0;
    for (int i = 1; i < history.length; i++) {
      if (history[i].direction != history[i - 1].direction) {
        count++;
      }
    }
    return count;
  }
}
