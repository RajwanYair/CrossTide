/// Dividend Service — application-layer orchestration.
///
/// Wraps [DividendCalculator] to compute trailing-12-month summaries and
/// forward income projections from a list of dividend payments.
library;

import '../domain/domain.dart';

/// Orchestrates dividend summary + projection in one call.
class DividendService {
  const DividendService({
    DividendCalculator calculator = const DividendCalculator(),
  }) : _calculator = calculator;

  final DividendCalculator _calculator;

  /// Summarise dividends for a single ticker.
  DividendSummary summarize({
    required String ticker,
    required List<DividendPayment> payments,
    required double currentPrice,
    required DateTime asOf,
  }) {
    return _calculator.summarize(
      ticker: ticker,
      payments: payments,
      currentPrice: currentPrice,
      asOf: asOf,
    );
  }

  /// Project portfolio dividend income.
  DividendProjection project({
    required Map<String, double> holdings,
    required Map<String, DividendSummary> summaries,
    required double totalCost,
  }) {
    return _calculator.project(
      holdings: holdings,
      summaries: summaries,
      totalCost: totalCost,
    );
  }
}

/// Combined dividend summary + forward projection.
class DividendAnalysis {
  const DividendAnalysis({required this.summary, required this.projection});

  final DividendSummary summary;
  final DividendProjection projection;
}
