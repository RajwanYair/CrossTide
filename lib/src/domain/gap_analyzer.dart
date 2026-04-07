/// Gap Analyzer — detects and classifies opening price gaps
/// (common, breakaway, runaway, exhaustion) from candle data.
library;

import 'package:equatable/equatable.dart';

import 'entities.dart';

/// Classification of a price gap.
enum GapType { common, breakaway, runaway, exhaustion }

/// Direction of the gap.
enum AnalyzedGapDirection { up, down }

/// A detected price gap.
class AnalyzedGap extends Equatable {
  const AnalyzedGap({
    required this.date,
    required this.direction,
    required this.type,
    required this.gapSizePct,
    required this.previousClose,
    required this.openPrice,
    required this.filled,
  });

  final DateTime date;
  final AnalyzedGapDirection direction;
  final GapType type;

  /// Gap size as percentage of previous close.
  final double gapSizePct;

  final double previousClose;
  final double openPrice;

  /// Whether the gap was filled (price returned to previous close).
  final bool filled;

  @override
  List<Object?> get props => [
    date,
    direction,
    type,
    gapSizePct,
    previousClose,
    openPrice,
    filled,
  ];
}

/// Result of gap analysis.
class GapAnalysisResult extends Equatable {
  const GapAnalysisResult({
    required this.gaps,
    required this.totalGaps,
    required this.avgGapSizePct,
    required this.fillRate,
  });

  final List<AnalyzedGap> gaps;
  final int totalGaps;
  final double avgGapSizePct;

  /// Percentage of gaps that were eventually filled (0–1).
  final double fillRate;

  @override
  List<Object?> get props => [gaps, totalGaps, avgGapSizePct, fillRate];
}

/// Detects and classifies gaps in candle data.
class GapAnalyzer {
  const GapAnalyzer({this.minGapPct = 0.5});

  /// Minimum gap size (%) to detect.
  final double minGapPct;

  /// Analyze gaps in a candle series.
  GapAnalysisResult analyze(List<DailyCandle> candles) {
    if (candles.length < 2) {
      return const GapAnalysisResult(
        gaps: [],
        totalGaps: 0,
        avgGapSizePct: 0,
        fillRate: 0,
      );
    }

    final gaps = <AnalyzedGap>[];

    for (int i = 1; i < candles.length; i++) {
      final prev = candles[i - 1];
      final curr = candles[i];
      final gapPct = prev.close > 0
          ? ((curr.open - prev.close) / prev.close) * 100
          : 0.0;

      if (gapPct.abs() < minGapPct) continue;

      final direction = gapPct > 0
          ? AnalyzedGapDirection.up
          : AnalyzedGapDirection.down;

      // Check if gap was filled by subsequent candles
      var filled = false;
      for (int j = i; j < candles.length; j++) {
        if (direction == AnalyzedGapDirection.up &&
            candles[j].low <= prev.close) {
          filled = true;
          break;
        }
        if (direction == AnalyzedGapDirection.down &&
            candles[j].high >= prev.close) {
          filled = true;
          break;
        }
      }

      gaps.add(
        AnalyzedGap(
          date: curr.date,
          direction: direction,
          type: _classifyGap(gapPct.abs(), i, candles),
          gapSizePct: gapPct.abs(),
          previousClose: prev.close,
          openPrice: curr.open,
          filled: filled,
        ),
      );
    }

    final totalGaps = gaps.length;
    final avgSize = totalGaps > 0
        ? gaps.fold(0.0, (double sum, AnalyzedGap g) => sum + g.gapSizePct) /
              totalGaps
        : 0.0;
    final filledCount = gaps.where((AnalyzedGap g) => g.filled).length;
    final fillRate = totalGaps > 0 ? filledCount / totalGaps : 0.0;

    return GapAnalysisResult(
      gaps: gaps,
      totalGaps: totalGaps,
      avgGapSizePct: avgSize,
      fillRate: fillRate,
    );
  }

  GapType _classifyGap(double absGapPct, int index, List<DailyCandle> candles) {
    // Volume-based classification (simplified)
    final curr = candles[index];
    final lookback = index >= 5 ? 5 : index;
    if (lookback == 0) return GapType.common;

    var avgVol = 0.0;
    for (int j = index - lookback; j < index; j++) {
      avgVol += candles[j].volume;
    }
    avgVol /= lookback;

    final relVol = avgVol > 0 ? curr.volume / avgVol : 1.0;

    if (absGapPct > 3.0 && relVol > 2.0) return GapType.breakaway;
    if (absGapPct > 2.0 && relVol > 1.5) return GapType.runaway;
    if (absGapPct > 3.0 && relVol < 0.8) return GapType.exhaustion;
    return GapType.common;
  }
}
