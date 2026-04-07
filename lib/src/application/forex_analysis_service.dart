/// Forex Analysis Service — application-layer orchestration.
///
/// Wraps [ForexCalculator] to summarise forex pairs from candle data.
library;

import '../domain/domain.dart';

/// Orchestrates forex pair analysis.
class ForexAnalysisService {
  const ForexAnalysisService({
    ForexCalculator calculator = const ForexCalculator(),
  }) : _calculator = calculator;

  final ForexCalculator _calculator;

  /// Build a summary for a single forex pair.
  ForexSummary summarize({
    required ForexPair pair,
    required List<DailyCandle> candles,
  }) {
    return _calculator.summarize(pair: pair, candles: candles);
  }

  /// Summarise all provided pairs.  Returns a map of pair symbol
  /// to [ForexSummary].  Pairs with insufficient data are omitted.
  Map<String, ForexSummary> summarizeAll(
    Map<ForexPair, List<DailyCandle>> pairCandles,
  ) {
    final Map<String, ForexSummary> results = {};
    for (final MapEntry<ForexPair, List<DailyCandle>> entry
        in pairCandles.entries) {
      final ForexSummary summary = _calculator.summarize(
        pair: entry.key,
        candles: entry.value,
      );
      results[entry.key.symbol] = summary;
    }
    return results;
  }
}
