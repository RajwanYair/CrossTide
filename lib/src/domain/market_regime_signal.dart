import 'package:equatable/equatable.dart';

/// Regime type detected for the current market environment.
enum MarketRegimeType {
  bullTrend,
  bearTrend,
  rangeBound,
  highVolatility,
  lowVolatility,
  transition,
}

/// A market regime signal for a given symbol or market.
class MarketRegimeSignal extends Equatable {
  const MarketRegimeSignal({
    required this.instrumentId,
    required this.regime,
    required this.confidencePct,
    required this.detectedAt,
    this.previousRegime,
  });

  final String instrumentId;
  final MarketRegimeType regime;

  /// Confidence in the regime classification (0–100).
  final double confidencePct;

  final DateTime detectedAt;

  /// Previous regime (for detecting transitions).
  final MarketRegimeType? previousRegime;

  bool get hasRegimeChanged =>
      previousRegime != null && previousRegime != regime;

  bool get isHighConfidence => confidencePct >= 70.0;

  bool get isTrending =>
      regime == MarketRegimeType.bullTrend ||
      regime == MarketRegimeType.bearTrend;

  @override
  List<Object?> get props => [
    instrumentId,
    regime,
    confidencePct,
    detectedAt,
    previousRegime,
  ];
}
