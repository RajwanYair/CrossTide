import 'package:equatable/equatable.dart';

/// Momentum direction for a sector.
enum SectorMomentumDirection {
  /// Sector is exhibiting strong upward relative strength.
  leading,

  /// Sector is in recovery after underperformance.
  recovering,

  /// Sector is exhibiting neutral momentum.
  neutral,

  /// Sector is lagging the broader market.
  lagging,

  /// Sector is significantly underperforming.
  weakening,
}

/// Momentum score and direction for a single market sector.
class SectorMomentumScore extends Equatable {
  /// Creates a [SectorMomentumScore].
  const SectorMomentumScore({
    required this.sectorName,
    required this.score,
    required this.direction,
    required this.calculatedAt,
    this.relativeStrength,
  });

  /// Name of the sector (e.g. `'Technology'`, `'Healthcare'`).
  final String sectorName;

  /// Composite momentum score; higher is stronger.
  final double score;

  /// Qualitative direction label.
  final SectorMomentumDirection direction;

  /// When the score was calculated.
  final DateTime calculatedAt;

  /// Relative strength vs the benchmark index (ratio; >1 = outperforming).
  final double? relativeStrength;

  /// Returns `true` when the sector is leading or recovering.
  bool get isPositive =>
      direction == SectorMomentumDirection.leading ||
      direction == SectorMomentumDirection.recovering;

  /// Returns `true` when the sector is outperforming the benchmark.
  bool get isOutperforming =>
      relativeStrength != null && relativeStrength! > 1.0;

  @override
  List<Object?> get props => [
    sectorName,
    score,
    direction,
    calculatedAt,
    relativeStrength,
  ];
}
