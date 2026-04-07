/// Market Breadth Calculator — computes advance/decline statistics
/// for a set of tickers to gauge overall market health.
library;

import 'package:equatable/equatable.dart';

/// Snapshot of market breadth metrics.
class MarketBreadthResult extends Equatable {
  const MarketBreadthResult({
    required this.advances,
    required this.declines,
    required this.unchanged,
    required this.newHighs,
    required this.newLows,
    required this.advanceDeclineRatio,
    required this.breadthThrust,
  });

  /// Count of tickers that advanced (close > previous close).
  final int advances;

  /// Count of tickers that declined.
  final int declines;

  /// Count of tickers unchanged.
  final int unchanged;

  /// Count of tickers at 52-week highs.
  final int newHighs;

  /// Count of tickers at 52-week lows.
  final int newLows;

  /// Advance/Decline ratio. Zero declines yields [double.infinity].
  final double advanceDeclineRatio;

  /// Breadth thrust: advances / (advances + declines). Range 0–1.
  final double breadthThrust;

  /// Total tickers.
  int get total => advances + declines + unchanged;

  @override
  List<Object?> get props => [
    advances,
    declines,
    unchanged,
    newHighs,
    newLows,
    advanceDeclineRatio,
    breadthThrust,
  ];
}

/// Input for market breadth: per-ticker last two closes and 52-week range.
class TickerBreadthInput extends Equatable {
  const TickerBreadthInput({
    required this.ticker,
    required this.previousClose,
    required this.currentClose,
    required this.fiftyTwoWeekHigh,
    required this.fiftyTwoWeekLow,
  });

  final String ticker;
  final double previousClose;
  final double currentClose;
  final double fiftyTwoWeekHigh;
  final double fiftyTwoWeekLow;

  @override
  List<Object?> get props => [
    ticker,
    previousClose,
    currentClose,
    fiftyTwoWeekHigh,
    fiftyTwoWeekLow,
  ];
}

/// Computes market breadth from ticker inputs.
class MarketBreadthCalculator {
  const MarketBreadthCalculator();

  /// Compute breadth from a list of ticker inputs.
  MarketBreadthResult compute(List<TickerBreadthInput> inputs) {
    var advances = 0;
    var declines = 0;
    var unchanged = 0;
    var newHighs = 0;
    var newLows = 0;

    for (final TickerBreadthInput t in inputs) {
      if (t.currentClose > t.previousClose) {
        advances++;
      } else if (t.currentClose < t.previousClose) {
        declines++;
      } else {
        unchanged++;
      }
      if (t.currentClose >= t.fiftyTwoWeekHigh) newHighs++;
      if (t.currentClose <= t.fiftyTwoWeekLow) newLows++;
    }

    final adRatio = declines > 0 ? advances / declines : double.infinity;
    final total = advances + declines;
    final thrust = total > 0 ? advances / total : 0.0;

    return MarketBreadthResult(
      advances: advances,
      declines: declines,
      unchanged: unchanged,
      newHighs: newHighs,
      newLows: newLows,
      advanceDeclineRatio: adRatio,
      breadthThrust: thrust,
    );
  }
}
