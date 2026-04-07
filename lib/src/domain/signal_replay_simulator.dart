/// Signal Replay Simulator — pure domain logic.
///
/// Replays method signals through historical candle data to evaluate
/// how signals would have performed. Produces trade entries/exits
/// with P&L for backtesting.
library;

import 'package:equatable/equatable.dart';

import 'entities.dart';
import 'micho_method_detector.dart';

/// A simulated trade from entry to exit.
class SimulatedTrade extends Equatable {
  const SimulatedTrade({
    required this.entryDate,
    required this.entryPrice,
    required this.exitDate,
    required this.exitPrice,
    required this.entryType,
    required this.exitType,
    required this.pnlPercent,
  });

  final DateTime entryDate;
  final double entryPrice;
  final DateTime exitDate;
  final double exitPrice;
  final AlertType entryType;
  final AlertType exitType;
  final double pnlPercent;

  @override
  List<Object?> get props => [
    entryDate,
    entryPrice,
    exitDate,
    exitPrice,
    entryType,
    exitType,
    pnlPercent,
  ];
}

/// Result of a signal replay simulation.
class ReplayResult extends Equatable {
  const ReplayResult({
    required this.trades,
    required this.totalPnlPercent,
    required this.winCount,
    required this.lossCount,
  });

  final List<SimulatedTrade> trades;
  final double totalPnlPercent;
  final int winCount;
  final int lossCount;

  /// Win rate as a percentage (0–100).
  double get winRate => trades.isEmpty ? 0 : (winCount / trades.length) * 100;

  @override
  List<Object?> get props => [trades, totalPnlPercent, winCount, lossCount];
}

/// Replays a list of [MethodSignal]s against candle data.
class SignalReplaySimulator {
  const SignalReplaySimulator();

  /// Run the simulation.
  ///
  /// [signals] must be sorted chronologically and aligned with [candles]
  /// by date. For each BUY signal, a position is opened at the close
  /// price; for each SELL signal the position is closed.
  ///
  /// Returns null if no complete trades were produced.
  ReplayResult? simulate({
    required List<DailyCandle> candles,
    required List<MethodSignal> signals,
  }) {
    if (candles.isEmpty || signals.isEmpty) return null;

    final Map<DateTime, DailyCandle> candleMap = {
      for (final DailyCandle c in candles)
        DateTime(c.date.year, c.date.month, c.date.day): c,
    };

    final List<SimulatedTrade> trades = [];
    DateTime? entryDate;
    double? entryPrice;
    AlertType? entryType;

    for (final MethodSignal signal in signals) {
      if (!signal.isTriggered) continue;

      final DateTime day = DateTime(
        signal.evaluatedAt.year,
        signal.evaluatedAt.month,
        signal.evaluatedAt.day,
      );
      final DailyCandle? candle = candleMap[day];
      if (candle == null) continue;

      final bool isBuy = signal.alertType.name.toLowerCase().contains('buy');

      if (isBuy && entryDate == null) {
        // Open position
        entryDate = day;
        entryPrice = candle.close;
        entryType = signal.alertType;
      } else if (!isBuy && entryDate != null) {
        // Close position
        final double pnl = entryPrice! != 0
            ? ((candle.close - entryPrice) / entryPrice) * 100
            : 0;
        trades.add(
          SimulatedTrade(
            entryDate: entryDate,
            entryPrice: entryPrice,
            exitDate: day,
            exitPrice: candle.close,
            entryType: entryType!,
            exitType: signal.alertType,
            pnlPercent: pnl,
          ),
        );
        entryDate = null;
        entryPrice = null;
        entryType = null;
      }
    }

    if (trades.isEmpty) return null;

    double totalPnl = 0;
    int wins = 0;
    int losses = 0;
    for (final SimulatedTrade t in trades) {
      totalPnl += t.pnlPercent;
      if (t.pnlPercent >= 0) {
        wins++;
      } else {
        losses++;
      }
    }

    return ReplayResult(
      trades: trades,
      totalPnlPercent: totalPnl,
      winCount: wins,
      lossCount: losses,
    );
  }
}
