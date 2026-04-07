/// Portfolio Service — application-layer orchestration.
///
/// Wraps [PortfolioSummarizer] and [PortfolioRiskScorer] to produce
/// a consolidated portfolio view from a list of holdings.
library;

import '../domain/domain.dart';

/// Orchestrates portfolio summary + risk scoring in one call.
class PortfolioService {
  const PortfolioService({
    PortfolioSummarizer summarizer = const PortfolioSummarizer(),
    PortfolioRiskScorer riskScorer = const PortfolioRiskScorer(),
  }) : _summarizer = summarizer,
       _riskScorer = riskScorer;

  final PortfolioSummarizer _summarizer;
  final PortfolioRiskScorer _riskScorer;

  /// Build summary + risk analysis.  Returns `null` when [holdings] is empty.
  PortfolioAnalysis? analyze(
    List<PortfolioHolding> holdings, {
    Map<String, double> positionVolatilities = const {},
  }) {
    final PortfolioSummary? summary = _summarizer.summarize(holdings);
    if (summary == null) return null;

    // Build position weights from market values.
    final Map<String, double> weights = {};
    for (final PortfolioHolding h in holdings) {
      if (summary.totalValue > 0) {
        weights[h.ticker] = h.marketValue / summary.totalValue;
      }
    }

    final PortfolioRiskScore risk = _riskScorer.score(
      positionWeights: weights,
      positionVolatilities: positionVolatilities,
      sectorCount: summary.sectorWeights.length,
    );

    return PortfolioAnalysis(summary: summary, risk: risk);
  }
}

/// Combined portfolio summary + risk assessment.
class PortfolioAnalysis {
  const PortfolioAnalysis({required this.summary, required this.risk});

  final PortfolioSummary summary;
  final PortfolioRiskScore risk;
}
