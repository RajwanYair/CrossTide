import 'package:equatable/equatable.dart';

/// Entry in a backtest comparison set.
class BacktestComparisonEntry extends Equatable {
  const BacktestComparisonEntry({
    required this.strategyId,
    required this.totalReturnPct,
    required this.maxDrawdownPct,
    required this.sharpeRatio,
    required this.winRatePct,
  });

  final String strategyId;
  final double totalReturnPct;
  final double maxDrawdownPct;
  final double sharpeRatio;
  final double winRatePct;

  @override
  List<Object?> get props => [
    strategyId,
    totalReturnPct,
    maxDrawdownPct,
    sharpeRatio,
    winRatePct,
  ];
}

/// A comparison set of multiple backtest results for side-by-side analysis.
class BacktestComparisonSet extends Equatable {
  const BacktestComparisonSet({
    required this.setId,
    required this.entries,
    required this.comparedAt,
  });

  final String setId;
  final List<BacktestComparisonEntry> entries;
  final DateTime comparedAt;

  /// Returns the entry with the highest total return, or null if empty.
  BacktestComparisonEntry? get bestReturn {
    if (entries.isEmpty) return null;
    return entries.reduce(
      (a, b) => a.totalReturnPct >= b.totalReturnPct ? a : b,
    );
  }

  /// Returns the entry with the highest Sharpe ratio, or null if empty.
  BacktestComparisonEntry? get bestSharpe {
    if (entries.isEmpty) return null;
    return entries.reduce((a, b) => a.sharpeRatio >= b.sharpeRatio ? a : b);
  }

  @override
  List<Object?> get props => [setId, entries, comparedAt];
}
