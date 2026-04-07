/// Cost Basis Service — application-layer orchestration.
///
/// Wraps [CostBasisCalculator] to manage trade entries and compute
/// average cost basis and unrealized P&L per ticker.
library;

import '../domain/domain.dart';

/// Orchestrates cost basis tracking across a portfolio.
class CostBasisService {
  const CostBasisService({
    CostBasisCalculator calculator = const CostBasisCalculator(),
  }) : _calculator = calculator;

  final CostBasisCalculator _calculator;

  /// Calculate cost basis for a single ticker's trade history.
  CostBasisResult compute(List<TradeEntry> trades) {
    return _calculator.compute(trades);
  }

  /// Compute cost basis across all tickers, returning a map of
  /// ticker → [CostBasisResult].
  Map<String, CostBasisResult> computeAll(
    Map<String, List<TradeEntry>> tradesByTicker,
  ) {
    final Map<String, CostBasisResult> results = {};
    for (final MapEntry<String, List<TradeEntry>> entry
        in tradesByTicker.entries) {
      results[entry.key] = _calculator.compute(entry.value);
    }
    return results;
  }
}
