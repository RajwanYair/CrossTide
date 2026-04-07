/// Backtest Result — pure domain value object.
///
/// Captures the outcome of running a trading method against historical candle
/// data for a single ticker.
library;

import 'package:equatable/equatable.dart';

/// A single trade entry/exit pair captured during a backtest.
class BacktestTrade extends Equatable {
  const BacktestTrade({
    required this.entryDate,
    required this.entryPrice,
    required this.exitDate,
    required this.exitPrice,
    required this.methodName,
  });

  /// When the simulated position was opened.
  final DateTime entryDate;

  /// Price at entry.
  final double entryPrice;

  /// When the simulated position was closed.
  final DateTime exitDate;

  /// Price at exit.
  final double exitPrice;

  /// The method that generated the signal.
  final String methodName;

  /// Profit/loss as a percentage: `(exit - entry) / entry × 100`.
  double get returnPercent => (exitPrice - entryPrice) / entryPrice * 100;

  /// Absolute profit/loss.
  double get profitLoss => exitPrice - entryPrice;

  /// Whether this trade was profitable.
  bool get isWinner => exitPrice > entryPrice;

  @override
  List<Object?> get props => [
    entryDate,
    entryPrice,
    exitDate,
    exitPrice,
    methodName,
  ];
}

/// Aggregate result of a full backtest run.
class BacktestResult extends Equatable {
  const BacktestResult({
    required this.ticker,
    required this.methodName,
    required this.startDate,
    required this.endDate,
    required this.trades,
    required this.startingEquity,
  });

  /// Ticker symbol tested.
  final String ticker;

  /// Method under test.
  final String methodName;

  /// Start of the backtest window.
  final DateTime startDate;

  /// End of the backtest window.
  final DateTime endDate;

  /// All simulated trades.
  final List<BacktestTrade> trades;

  /// Initial equity for return calculations.
  final double startingEquity;

  /// Total number of trades.
  int get totalTrades => trades.length;

  /// Number of winning trades.
  int get winners => trades.where((BacktestTrade t) => t.isWinner).length;

  /// Number of losing trades.
  int get losers => totalTrades - winners;

  /// Win rate as a percentage (0-100).
  double get winRate => totalTrades > 0 ? winners / totalTrades * 100 : 0;

  /// Total cumulative return %.
  double get totalReturnPercent {
    if (trades.isEmpty) return 0;
    double equity = startingEquity;
    for (final BacktestTrade trade in trades) {
      equity += trade.profitLoss;
    }
    return (equity - startingEquity) / startingEquity * 100;
  }

  /// Average return per trade.
  double get avgReturnPerTrade =>
      totalTrades > 0 ? totalReturnPercent / totalTrades : 0;

  /// Largest single-trade gain %.
  double get maxWin => trades.isEmpty
      ? 0
      : trades
            .map((BacktestTrade t) => t.returnPercent)
            .reduce((double a, double b) => a > b ? a : b);

  /// Largest single-trade loss %.
  double get maxLoss => trades.isEmpty
      ? 0
      : trades
            .map((BacktestTrade t) => t.returnPercent)
            .reduce((double a, double b) => a < b ? a : b);

  @override
  List<Object?> get props => [
    ticker,
    methodName,
    startDate,
    endDate,
    trades,
    startingEquity,
  ];
}
