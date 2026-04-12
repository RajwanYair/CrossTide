import 'package:equatable/equatable.dart';

/// Rotation signal direction across sectors.
enum SectorRotationDirection {
  /// Capital flows into this sector (outperforming).
  inflow,

  /// Capital flows out of this sector (underperforming).
  outflow,

  /// No statistically significant rotation detected.
  neutral,
}

/// A signal indicating cross-sector capital rotation,
/// derived from relative-strength and momentum divergence.
class SectorRotationSignal extends Equatable {
  const SectorRotationSignal({
    required this.sectorName,
    required this.direction,
    required this.relativeStrength,
    required this.momentumScore,
    required this.lookbackDays,
    required this.detectedAt,
    this.leadingSectors = const [],
    this.laggingSectors = const [],
  });

  final String sectorName;
  final SectorRotationDirection direction;

  /// Sector RS vs. market benchmark (>1.0 = outperforming).
  final double relativeStrength;

  /// Normalised momentum score (−1.0 to +1.0).
  final double momentumScore;

  final int lookbackDays;
  final DateTime detectedAt;

  /// Sectors that have stronger momentum (ahead in the rotation cycle).
  final List<String> leadingSectors;

  /// Sectors that have weaker momentum (behind in the rotation cycle).
  final List<String> laggingSectors;

  SectorRotationSignal copyWith({
    String? sectorName,
    SectorRotationDirection? direction,
    double? relativeStrength,
    double? momentumScore,
    int? lookbackDays,
    DateTime? detectedAt,
    List<String>? leadingSectors,
    List<String>? laggingSectors,
  }) => SectorRotationSignal(
    sectorName: sectorName ?? this.sectorName,
    direction: direction ?? this.direction,
    relativeStrength: relativeStrength ?? this.relativeStrength,
    momentumScore: momentumScore ?? this.momentumScore,
    lookbackDays: lookbackDays ?? this.lookbackDays,
    detectedAt: detectedAt ?? this.detectedAt,
    leadingSectors: leadingSectors ?? this.leadingSectors,
    laggingSectors: laggingSectors ?? this.laggingSectors,
  );

  @override
  List<Object?> get props => [
    sectorName,
    direction,
    relativeStrength,
    momentumScore,
    lookbackDays,
    detectedAt,
    leadingSectors,
    laggingSectors,
  ];
}
