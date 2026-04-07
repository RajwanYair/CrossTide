/// Trade Journal Calculator — analyzes a trader's journal entries
/// to compute performance metrics, identify patterns, and suggest improvements.
library;

import 'package:equatable/equatable.dart';

/// A journal entry for a completed trade.
class JournalEntry extends Equatable {
  const JournalEntry({
    required this.ticker,
    required this.entryDate,
    required this.exitDate,
    required this.entryPrice,
    required this.exitPrice,
    required this.shares,
    required this.method,
    this.notes = '',
  });

  final String ticker;
  final DateTime entryDate;
  final DateTime exitDate;
  final double entryPrice;
  final double exitPrice;
  final double shares;
  final String method;
  final String notes;

  /// Profit or loss in dollars.
  double get pnl => (exitPrice - entryPrice) * shares;

  /// Return percentage.
  double get returnPct =>
      entryPrice > 0 ? ((exitPrice - entryPrice) / entryPrice) * 100 : 0;

  /// Holding period in days.
  int get holdingDays => exitDate.difference(entryDate).inDays;

  /// Whether the trade was profitable.
  bool get isWin => pnl > 0;

  @override
  List<Object?> get props => [
    ticker,
    entryDate,
    exitDate,
    entryPrice,
    exitPrice,
    shares,
    method,
  ];
}

/// Summary of trade journal performance.
class JournalSummary extends Equatable {
  const JournalSummary({
    required this.totalTrades,
    required this.wins,
    required this.losses,
    required this.winRate,
    required this.totalPnl,
    required this.avgReturnPct,
    required this.avgHoldingDays,
    required this.bestTrade,
    required this.worstTrade,
    required this.profitFactor,
    required this.methodBreakdown,
  });

  final int totalTrades;
  final int wins;
  final int losses;
  final double winRate;
  final double totalPnl;
  final double avgReturnPct;
  final double avgHoldingDays;
  final JournalEntry? bestTrade;
  final JournalEntry? worstTrade;

  /// Gross profit / gross loss (>1 is profitable).
  final double profitFactor;

  /// Win rate per method.
  final Map<String, double> methodBreakdown;

  @override
  List<Object?> get props => [
    totalTrades,
    wins,
    losses,
    winRate,
    totalPnl,
    avgReturnPct,
    profitFactor,
  ];
}

/// Analyzes trade journal entries.
class TradeJournalCalculator {
  const TradeJournalCalculator();

  /// Summarize a list of journal entries.
  JournalSummary summarize(List<JournalEntry> entries) {
    if (entries.isEmpty) {
      return const JournalSummary(
        totalTrades: 0,
        wins: 0,
        losses: 0,
        winRate: 0,
        totalPnl: 0,
        avgReturnPct: 0,
        avgHoldingDays: 0,
        bestTrade: null,
        worstTrade: null,
        profitFactor: 0,
        methodBreakdown: {},
      );
    }

    var wins = 0;
    var totalPnl = 0.0;
    var totalReturn = 0.0;
    var totalDays = 0;
    var grossProfit = 0.0;
    var grossLoss = 0.0;
    JournalEntry? best;
    JournalEntry? worst;

    final methodWins = <String, int>{};
    final methodTotal = <String, int>{};

    for (final JournalEntry e in entries) {
      totalPnl += e.pnl;
      totalReturn += e.returnPct;
      totalDays += e.holdingDays;

      if (e.isWin) {
        wins++;
        grossProfit += e.pnl;
      } else {
        grossLoss += e.pnl.abs();
      }

      if (best == null || e.pnl > best.pnl) best = e;
      if (worst == null || e.pnl < worst.pnl) worst = e;

      methodTotal[e.method] = (methodTotal[e.method] ?? 0) + 1;
      if (e.isWin) {
        methodWins[e.method] = (methodWins[e.method] ?? 0) + 1;
      }
    }

    final breakdown = <String, double>{};
    for (final MapEntry<String, int> entry in methodTotal.entries) {
      breakdown[entry.key] = entry.value > 0
          ? (methodWins[entry.key] ?? 0) / entry.value
          : 0;
    }

    return JournalSummary(
      totalTrades: entries.length,
      wins: wins,
      losses: entries.length - wins,
      winRate: wins / entries.length,
      totalPnl: totalPnl,
      avgReturnPct: totalReturn / entries.length,
      avgHoldingDays: totalDays / entries.length,
      bestTrade: best,
      worstTrade: worst,
      profitFactor: grossLoss > 0
          ? grossProfit / grossLoss
          : grossProfit > 0
          ? double.infinity
          : 0,
      methodBreakdown: breakdown,
    );
  }
}
