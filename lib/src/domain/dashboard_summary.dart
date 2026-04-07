/// Dashboard Summary — pure domain value object.
///
/// Aggregates key metrics for the at-a-glance dashboard view:
/// tickers near SMA200, recent cross-ups, and overall market status.
library;

import 'package:equatable/equatable.dart';

/// Snapshot of dashboard-level metrics.
class DashboardSummary extends Equatable {
  const DashboardSummary({
    required this.totalTickers,
    required this.tickersAboveSma200,
    required this.tickersBelowSma200,
    required this.tickersNearSma200,
    required this.recentCrossUpCount,
    required this.recentCrossDownCount,
    required this.consensusBuyCount,
    required this.consensusSellCount,
    required this.asOf,
  });

  /// Total number of tickers in the watchlist.
  final int totalTickers;

  /// Tickers currently above their SMA200.
  final int tickersAboveSma200;

  /// Tickers currently below their SMA200.
  final int tickersBelowSma200;

  /// Tickers within ±2% of their SMA200.
  final int tickersNearSma200;

  /// Number of cross-up events in the recent window.
  final int recentCrossUpCount;

  /// Number of cross-down events in the recent window.
  final int recentCrossDownCount;

  /// Number of tickers with active consensus BUY signal.
  final int consensusBuyCount;

  /// Number of tickers with active consensus SELL signal.
  final int consensusSellCount;

  /// When this summary was computed.
  final DateTime asOf;

  /// Percentage of tickers above SMA200 (0–100).
  double get bullishPercent =>
      totalTickers > 0 ? tickersAboveSma200 / totalTickers * 100 : 0;

  /// Whether the majority of tickers are above their SMA200.
  bool get isBullishBias => tickersAboveSma200 > tickersBelowSma200;

  @override
  List<Object?> get props => [
    totalTickers,
    tickersAboveSma200,
    tickersBelowSma200,
    tickersNearSma200,
    recentCrossUpCount,
    recentCrossDownCount,
    consensusBuyCount,
    consensusSellCount,
    asOf,
  ];
}
