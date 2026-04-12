import 'package:equatable/equatable.dart';

/// Performance summary for a single GICS sector over a time period.
class SectorPerformanceSnapshot extends Equatable {
  /// Creates a [SectorPerformanceSnapshot].
  const SectorPerformanceSnapshot({
    required this.snapshotId,
    required this.periodLabel,
    required this.sectorPerformances,
  });

  /// Unique identifier for this snapshot.
  final String snapshotId;

  /// Human-readable period label (e.g. `'YTD 2025'`, `'Last 30 days'`).
  final String periodLabel;

  /// Map from sector name to return percentage.
  final Map<String, double> sectorPerformances;

  /// Sector with the highest return within this snapshot.
  String? get leadingSector {
    if (sectorPerformances.isEmpty) return null;
    return sectorPerformances.entries
        .reduce(
          (MapEntry<String, double> a, MapEntry<String, double> b) =>
              a.value >= b.value ? a : b,
        )
        .key;
  }

  /// Sector with the lowest return within this snapshot.
  String? get laggingSector {
    if (sectorPerformances.isEmpty) return null;
    return sectorPerformances.entries
        .reduce(
          (MapEntry<String, double> a, MapEntry<String, double> b) =>
              a.value <= b.value ? a : b,
        )
        .key;
  }

  /// Number of sectors tracked.
  int get sectorCount => sectorPerformances.length;

  @override
  List<Object?> get props => [snapshotId, periodLabel, sectorPerformances];
}
