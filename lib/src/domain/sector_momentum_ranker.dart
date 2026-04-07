/// Sector Momentum Ranker — ranks sectors by relative momentum
/// using rate-of-change and relative strength.
library;

import 'package:equatable/equatable.dart';

/// A sector ranked by its momentum score.
class SectorMomentum extends Equatable {
  const SectorMomentum({
    required this.sector,
    required this.momentum,
    required this.rank,
    required this.rateOfChange,
    required this.relativeStrength,
  });

  final String sector;

  /// Composite momentum score (higher = stronger momentum).
  final double momentum;

  /// Rank among all sectors (1 = highest momentum).
  final int rank;

  /// Rate of change over the lookback window (percentage).
  final double rateOfChange;

  /// Relative strength vs. equally-weighted average (>1 = outperforming).
  final double relativeStrength;

  @override
  List<Object?> get props => [
    sector,
    momentum,
    rank,
    rateOfChange,
    relativeStrength,
  ];
}

/// Ranks sectors by momentum.
class SectorMomentumRanker {
  const SectorMomentumRanker();

  /// Rank sectors by momentum.
  ///
  /// [sectorReturns] maps sector name → list of periodic returns.
  /// The last value in each list is most recent.
  List<SectorMomentum> rank(Map<String, List<double>> sectorReturns) {
    if (sectorReturns.isEmpty) return [];

    // Compute rate of change (sum of returns) per sector
    final rocMap = <String, double>{};
    for (final MapEntry<String, List<double>> entry in sectorReturns.entries) {
      final returns = entry.value;
      if (returns.isEmpty) {
        rocMap[entry.key] = 0;
        continue;
      }
      var sum = 0.0;
      for (final double r in returns) {
        sum += r;
      }
      rocMap[entry.key] = sum;
    }

    // Average ROC across all sectors
    final allRocs = rocMap.values.toList();
    var avgRoc = 0.0;
    for (final double r in allRocs) {
      avgRoc += r;
    }
    avgRoc = allRocs.isNotEmpty ? avgRoc / allRocs.length : 0;

    // Build unranked list
    final unranked = <_SectorEntry>[];
    for (final MapEntry<String, double> entry in rocMap.entries) {
      final rs = avgRoc != 0 ? entry.value / avgRoc : 1.0;
      // Momentum = ROC weighted by relative strength
      final momentum = entry.value * (rs > 0 ? rs : 1);
      unranked.add(
        _SectorEntry(
          sector: entry.key,
          roc: entry.value,
          rs: rs,
          momentum: momentum,
        ),
      );
    }

    // Sort by momentum descending
    unranked.sort(
      (_SectorEntry a, _SectorEntry b) => b.momentum.compareTo(a.momentum),
    );

    return [
      for (int i = 0; i < unranked.length; i++)
        SectorMomentum(
          sector: unranked[i].sector,
          momentum: unranked[i].momentum,
          rank: i + 1,
          rateOfChange: unranked[i].roc,
          relativeStrength: unranked[i].rs,
        ),
    ];
  }
}

class _SectorEntry {
  const _SectorEntry({
    required this.sector,
    required this.roc,
    required this.rs,
    required this.momentum,
  });

  final String sector;
  final double roc;
  final double rs;
  final double momentum;
}
