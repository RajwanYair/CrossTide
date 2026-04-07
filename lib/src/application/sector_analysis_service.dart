/// Sector Analysis Service — application-layer orchestration.
///
/// Combines [SectorRotationScorer], [SectorCorrelationCalculator], and
/// [SectorHeatmapBuilder] to produce a complete sector analysis.
library;

import '../domain/domain.dart';

/// Orchestrates sector analysis across rotation, correlation, and heatmap.
class SectorAnalysisService {
  const SectorAnalysisService({
    SectorRotationScorer rotationScorer = const SectorRotationScorer(),
    SectorCorrelationCalculator correlationCalculator =
        const SectorCorrelationCalculator(),
    SectorHeatmapBuilder heatmapBuilder = const SectorHeatmapBuilder(),
  }) : _rotationScorer = rotationScorer,
       _correlationCalculator = correlationCalculator,
       _heatmapBuilder = heatmapBuilder;

  final SectorRotationScorer _rotationScorer;
  final SectorCorrelationCalculator _correlationCalculator;
  final SectorHeatmapBuilder _heatmapBuilder;

  /// Run a full sector analysis.  Returns `null` when [sectorReturns]
  /// is empty.
  ///
  /// [sectorReturns] maps sector name → average % return.
  /// [sectorDailyReturns] maps sector name → ordered daily returns (for correlation).
  SectorAnalysisResult? analyze({
    required Map<String, double> sectorReturns,
    required Map<String, List<double>> sectorDailyReturns,
  }) {
    if (sectorReturns.isEmpty) return null;

    final List<SectorScore> scores = _rotationScorer.score(sectorReturns);
    final List<SectorCorrelation> correlations = _correlationCalculator
        .computeAll(sectorDailyReturns);

    return SectorAnalysisResult(scores: scores, correlations: correlations);
  }

  /// Build a heatmap view from per-ticker sector returns.
  List<SectorHeatmapCell> buildHeatmap(List<TickerSectorReturn> tickers) {
    return _heatmapBuilder.build(tickers);
  }
}

/// Combined result of sector rotation scores + correlation pairs.
class SectorAnalysisResult {
  const SectorAnalysisResult({
    required this.scores,
    required this.correlations,
  });

  final List<SectorScore> scores;
  final List<SectorCorrelation> correlations;
}
