import 'package:equatable/equatable.dart';

/// A point-in-time portfolio exposure breakdown by asset class and sector.
///
/// Provides a quick snapshot of concentration risk so that rebalancing
/// workflows and risk dashboards can highlight over-exposure.
class PortfolioExposureMap extends Equatable {
  /// Creates a [PortfolioExposureMap].
  const PortfolioExposureMap({
    required this.capturedAt,
    required this.assetClassWeights,
    required this.sectorWeights,
    this.topHoldingTicker,
    this.topHoldingPct,
  });

  /// Timestamp when the exposure was calculated.
  final DateTime capturedAt;

  /// Asset-class allocation map; keys are class names, values are %.
  final Map<String, double> assetClassWeights;

  /// Sector allocation map; keys are sector names, values are %.
  final Map<String, double> sectorWeights;

  /// Ticker of the single largest holding (`null` if unavailable).
  final String? topHoldingTicker;

  /// Weight of the largest holding as a percentage (`null` if unavailable).
  final double? topHoldingPct;

  /// Returns `true` when any single asset class exceeds 60%.
  bool get isConcentrated =>
      assetClassWeights.values.any((double w) => w > 60.0);

  /// Returns `true` when any single sector exceeds 30%.
  bool get isSectorConcentrated =>
      sectorWeights.values.any((double w) => w > 30.0);

  @override
  List<Object?> get props => [
    capturedAt,
    assetClassWeights,
    sectorWeights,
    topHoldingTicker,
    topHoldingPct,
  ];
}
