/// Consensus Accuracy Tracker — Pure domain logic.
///
/// Tracks how often consensus BUY / SELL signals led to profitable outcomes.
/// Given a sequence of [ConsensusOutcome] records — each pairing a consensus
/// signal with a known forward return — computes hit rate, average profit/loss,
/// and per-method contribution stats.
library;

import 'package:equatable/equatable.dart';

/// The actual outcome of a consensus signal after a holding period.
class ConsensusOutcome extends Equatable {
  const ConsensusOutcome({
    required this.ticker,
    required this.signalDate,
    required this.direction,
    required this.entryPrice,
    required this.exitPrice,
    required this.holdingDays,
  });

  final String ticker;
  final DateTime signalDate;

  /// 'BUY' or 'SELL'.
  final String direction;
  final double entryPrice;
  final double exitPrice;
  final int holdingDays;

  double get returnPct =>
      entryPrice > 0 ? ((exitPrice - entryPrice) / entryPrice) * 100 : 0;

  bool get isProfitable =>
      (direction == 'BUY' && exitPrice > entryPrice) ||
      (direction == 'SELL' && exitPrice < entryPrice);

  @override
  List<Object?> get props => [
    ticker,
    signalDate,
    direction,
    entryPrice,
    exitPrice,
    holdingDays,
  ];
}

/// Aggregated accuracy statistics for consensus signals.
class ConsensusAccuracyStats extends Equatable {
  const ConsensusAccuracyStats({
    required this.totalSignals,
    required this.profitableSignals,
    required this.avgReturnPct,
    required this.avgHoldingDays,
    required this.buyHitRate,
    required this.sellHitRate,
  });

  final int totalSignals;
  final int profitableSignals;
  final double avgReturnPct;
  final double avgHoldingDays;
  final double buyHitRate;
  final double sellHitRate;

  double get overallHitRate =>
      totalSignals > 0 ? profitableSignals / totalSignals : 0;

  @override
  List<Object?> get props => [
    totalSignals,
    profitableSignals,
    avgReturnPct,
    avgHoldingDays,
    buyHitRate,
    sellHitRate,
  ];
}

/// Computes consensus signal accuracy from historical outcomes.
class ConsensusAccuracyTracker {
  const ConsensusAccuracyTracker();

  ConsensusAccuracyStats compute(List<ConsensusOutcome> outcomes) {
    if (outcomes.isEmpty) {
      return const ConsensusAccuracyStats(
        totalSignals: 0,
        profitableSignals: 0,
        avgReturnPct: 0,
        avgHoldingDays: 0,
        buyHitRate: 0,
        sellHitRate: 0,
      );
    }

    int profitable = 0;
    double totalReturn = 0;
    int totalDays = 0;

    int buyTotal = 0;
    int buyProfitable = 0;
    int sellTotal = 0;
    int sellProfitable = 0;

    for (final ConsensusOutcome o in outcomes) {
      totalReturn += o.returnPct;
      totalDays += o.holdingDays;
      if (o.isProfitable) profitable++;

      if (o.direction == 'BUY') {
        buyTotal++;
        if (o.isProfitable) buyProfitable++;
      } else if (o.direction == 'SELL') {
        sellTotal++;
        if (o.isProfitable) sellProfitable++;
      }
    }

    return ConsensusAccuracyStats(
      totalSignals: outcomes.length,
      profitableSignals: profitable,
      avgReturnPct: totalReturn / outcomes.length,
      avgHoldingDays: totalDays / outcomes.length,
      buyHitRate: buyTotal > 0 ? buyProfitable / buyTotal : 0,
      sellHitRate: sellTotal > 0 ? sellProfitable / sellTotal : 0,
    );
  }
}
